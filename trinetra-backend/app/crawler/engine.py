"""
Crawler Engine — orchestrates all scrapers, runs NLP analysis and
credential detection, stores results in Firestore, and broadcasts
new threats via WebSocket.

This is the heart of the Trinetra intelligence pipeline.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from app.crawler.base_scraper import RawPost
from app.crawler.scrapers.reddit_scraper import RedditScraper
from app.crawler.scrapers.pastebin_scraper import PastebinScraper
from app.crawler.scrapers.generic_scraper import GenericForumScraper
from app.crawler.credential_detector import CredentialDetector
from app.nlp.analyzer import NLPAnalyzer
from app.nlp.threat_scorer import calculate_threat_score
from app.firebase_client import get_firestore

logger = logging.getLogger(__name__)


class CrawlerEngine:
    """
    Main orchestrator for the Trinetra threat intelligence pipeline.

    Pipeline flow:
    1. Load active sources and keywords from Firestore
    2. Execute all scrapers in parallel
    3. For each scraped post:
       a. Run credential detection
       b. Run NLP analysis
       c. Calculate threat score
       d. If threat detected → store in Firestore + broadcast via WebSocket
    4. Log results and schedule next run
    """

    def __init__(self, interval_seconds: int = 300):
        """
        Initialize the crawler engine.

        Args:
            interval_seconds: Time between crawl cycles (default: 5 minutes)
        """
        self.interval = interval_seconds
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # Initialize scrapers
        self.reddit_scraper = RedditScraper()
        self.pastebin_scraper = PastebinScraper()
        self.generic_scraper = GenericForumScraper()

        # Initialize analysis tools (will be refreshed each cycle)
        self.credential_detector = CredentialDetector()
        self.nlp_analyzer = NLPAnalyzer()

    async def start(self) -> None:
        """Start the crawl loop as an async background task."""
        if self._running:
            logger.warning("Crawler engine is already running")
            return

        self._running = True
        self._task = asyncio.create_task(self._crawl_loop())
        logger.info(
            f"Crawler engine started. Interval: {self.interval}s"
        )

    async def stop(self) -> None:
        """Gracefully stop the crawl loop."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Crawler engine stopped")

    async def _crawl_loop(self) -> None:
        """Main crawl loop — runs indefinitely until stopped."""
        while self._running:
            try:
                logger.info("═══ Starting crawl cycle ═══")
                await self._execute_cycle()
                logger.info(
                    f"═══ Crawl cycle complete. Next in {self.interval}s ═══"
                )
            except Exception as exc:
                logger.error(f"Crawl cycle failed: {exc}", exc_info=True)

            # Wait for next cycle
            try:
                await asyncio.sleep(self.interval)
            except asyncio.CancelledError:
                break

    async def _execute_cycle(self) -> None:
        """Execute a single crawl-analyze-store cycle."""
        # Step 1: Refresh configuration from Firestore
        await self._refresh_config()

        # Step 2: Scrape from all sources in parallel
        raw_posts = await self._scrape_all()
        logger.info(f"Total posts scraped: {len(raw_posts)}")

        if not raw_posts:
            logger.info("No new posts found this cycle")
            return

        # Step 3: Analyze each post
        threats_found = 0
        for post in raw_posts:
            try:
                is_stored = await self._analyze_and_store(post)
                if is_stored:
                    threats_found += 1
            except Exception as exc:
                logger.warning(f"Failed to analyze post: {exc}")

        logger.info(f"Threats detected and stored: {threats_found}")

    async def _refresh_config(self) -> None:
        """Load active sources and keywords from Firestore."""
        try:
            db = get_firestore()

            # Load custom keywords for NLP analyzer
            keyword_docs = db.collection("keywords").get()
            active_keywords = [
                doc.to_dict().get("term", "")
                for doc in keyword_docs
                if doc.to_dict().get("active", False)
            ]
            self.nlp_analyzer = NLPAnalyzer(custom_keywords=active_keywords)

            # Load custom credential patterns
            config_doc = db.collection("config").document("credential_patterns").get()
            custom_patterns = []
            if config_doc.exists:
                patterns_str = config_doc.to_dict().get("patterns", "")
                custom_patterns = [
                    p.strip() for p in patterns_str.split("\n") if p.strip()
                ]
            self.credential_detector = CredentialDetector(
                custom_patterns=custom_patterns
            )

            # Load active source URLs for generic scraper
            source_docs = db.collection("sources").get()
            generic_urls = []
            for doc in source_docs:
                data = doc.to_dict()
                if data.get("active", False) and data.get("url"):
                    source_type = data.get("type", "").lower()
                    if source_type not in ("reddit", "pastebin"):
                        generic_urls.append(data["url"])

            self.generic_scraper = GenericForumScraper(urls=generic_urls)

            logger.info(
                f"Config refreshed: {len(active_keywords)} keywords, "
                f"{len(custom_patterns)} custom patterns, "
                f"{len(generic_urls)} generic URLs"
            )
        except Exception as exc:
            logger.warning(f"Config refresh failed, using defaults: {exc}")

    async def _scrape_all(self) -> list[RawPost]:
        """Execute all scrapers in parallel and collect results."""
        tasks = []

        if self.reddit_scraper.enabled:
            tasks.append(self._safe_scrape(self.reddit_scraper))
        if self.pastebin_scraper.enabled:
            tasks.append(self._safe_scrape(self.pastebin_scraper))
        if self.generic_scraper.enabled and self.generic_scraper.urls:
            tasks.append(self._safe_scrape(self.generic_scraper))

        results = await asyncio.gather(*tasks)

        # Flatten all post lists
        all_posts: list[RawPost] = []
        for post_list in results:
            all_posts.extend(post_list)

        return all_posts

    async def _safe_scrape(self, scraper) -> list[RawPost]:
        """Wrapper to safely execute a scraper with error handling."""
        try:
            return await scraper.scrape()
        except Exception as exc:
            logger.warning(f"Scraper {scraper.name} failed: {exc}")
            return []

    async def _analyze_and_store(self, post: RawPost) -> bool:
        """
        Analyze a single post for threats. If a threat is detected,
        store it in Firestore and broadcast via WebSocket.

        Returns True if a threat was stored.
        """
        # Run credential detection
        cred_matches = self.credential_detector.scan(post.content)

        # Run NLP analysis
        nlp_result = self.nlp_analyzer.analyze(post.content)

        # If neither analysis found anything, skip
        if not nlp_result.is_threat and not cred_matches:
            return False

        # Calculate unified threat score
        threat_score = calculate_threat_score(nlp_result, cred_matches)

        # Skip very low-score detections (likely false positives)
        if threat_score["score"] < 20:
            return False

        # Check for duplicates (skip if very similar content already exists)
        if await self._is_duplicate(post):
            return False

        # Build threat document
        threat_id = self._generate_threat_id(post)
        threat_doc = {
            "id": threat_id,
            "title": post.title[:200] or f"Alert from {post.source_name}",
            "source": post.source_name,
            "target": nlp_result.target_sector or "General",
            "type": threat_score["threat_type"],
            "severity": threat_score["severity"],
            "credibility": threat_score["credibility"],
            "timestamp": post.timestamp,
            "status": "New",
            "rawEvidence": post.content[:2000],  # Store first 2000 chars
            "details": threat_score["detail_summary"],
            "location": None,  # Could be enriched with GeoIP later
            "url": post.url,
            "matched_keywords": nlp_result.matched_keywords[:10],
            "credential_types": [m.type for m in cred_matches],
            "entities_found": nlp_result.entities_found[:10],
        }

        # Store in Firestore
        db = get_firestore()
        db.collection("threats").document(threat_id).set(threat_doc)

        logger.info(
            f"NEW THREAT: [{threat_score['severity']}] {post.title[:50]} "
            f"(score: {threat_score['score']}, source: {post.source_name})"
        )

        # Broadcast via WebSocket
        try:
            from app.routers.websocket import broadcast_threat
            await broadcast_threat(threat_doc)
        except Exception as exc:
            logger.warning(f"WebSocket broadcast failed: {exc}")

        # Send Telegram Alert for Critical & High Threats
        if threat_doc["severity"] in ["Critical", "High"]:
            try:
                from app.services.telegram_service import send_telegram_alert
                # Fire and forget task
                asyncio.create_task(send_telegram_alert(threat_doc))
            except Exception as exc:
                logger.warning(f"Failed to trigger Telegram alert: {exc}")

        return True

    async def _is_duplicate(self, post: RawPost) -> bool:
        """
        Simple duplicate check — looks for threats from the same URL
        that were already stored.
        """
        if not post.url:
            return False

        db = get_firestore()
        existing = (
            db.collection("threats")
            .where("url", "==", post.url)
            .limit(1)
            .get()
        )
        return len(existing) > 0

    @staticmethod
    def _generate_threat_id(post: RawPost) -> str:
        """Generate a unique threat ID based on content hash."""
        import hashlib

        content_hash = hashlib.sha256(
            f"{post.source_name}:{post.url}:{post.title}".encode()
        ).hexdigest()[:12]

        now = datetime.now(timezone.utc)
        return f"THR-{now.strftime('%Y%m%d')}-{content_hash.upper()}"


# ═══ Module-level engine instance ═══
_engine: Optional[CrawlerEngine] = None


def get_engine() -> CrawlerEngine:
    """Get or create the singleton crawler engine instance."""
    global _engine
    if _engine is None:
        _engine = CrawlerEngine()
    return _engine
