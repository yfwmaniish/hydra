"""
Reddit Scraper — monitors cybersecurity subreddits via Reddit's public JSON API.
No API key required. Uses the .json endpoint available on all public subreddits.
"""
import httpx
import logging
from app.crawler.base_scraper import BaseScraper, RawPost

logger = logging.getLogger(__name__)

# Subreddits focused on cybersecurity, threat intel, and Indian infra
DEFAULT_SUBREDDITS = [
    "netsec",
    "cybersecurity",
    "hacking",
    "ReverseEngineering",
    "InfoSecNews",
]

# User-Agent header to avoid being blocked by Reddit
_HEADERS = {
    "User-Agent": "Trinetra-ThreatIntel/1.0 (Threat Intelligence Platform)"
}


class RedditScraper(BaseScraper):
    """
    Scrapes posts from cybersecurity-related subreddits using
    Reddit's public .json API (no authentication needed).
    """

    def __init__(
        self,
        subreddits: list[str] | None = None,
        posts_per_sub: int = 15,
    ):
        super().__init__(name="Reddit Scraper")
        self.subreddits = subreddits or DEFAULT_SUBREDDITS
        self.posts_per_sub = posts_per_sub

    async def scrape(self) -> list[RawPost]:
        """Scrape recent posts from all configured subreddits."""
        all_posts: list[RawPost] = []

        async with httpx.AsyncClient(
            headers=_HEADERS, timeout=15.0, follow_redirects=True
        ) as client:
            for subreddit in self.subreddits:
                try:
                    posts = await self._scrape_subreddit(client, subreddit)
                    all_posts.extend(posts)
                    logger.info(
                        f"Reddit: scraped {len(posts)} posts from r/{subreddit}"
                    )
                except Exception as exc:
                    logger.warning(
                        f"Reddit: failed to scrape r/{subreddit}: {exc}"
                    )

        return all_posts

    async def _scrape_subreddit(
        self, client: httpx.AsyncClient, subreddit: str
    ) -> list[RawPost]:
        """Scrape a single subreddit's recent posts."""
        url = f"https://www.reddit.com/r/{subreddit}/new.json?limit={self.posts_per_sub}"
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

        posts = []
        children = data.get("data", {}).get("children", [])

        for child in children:
            post_data = child.get("data", {})
            title = post_data.get("title", "")
            selftext = post_data.get("selftext", "")
            author = post_data.get("author", "Unknown")
            permalink = post_data.get("permalink", "")
            created_utc = post_data.get("created_utc", 0)

            # Combine title and body for analysis
            content = f"{title}\n\n{selftext}" if selftext else title

            if not content.strip():
                continue

            posts.append(
                RawPost(
                    content=content,
                    title=title,
                    author=author,
                    url=f"https://reddit.com{permalink}",
                    timestamp=self._utc_to_iso(created_utc),
                    source_name=f"Reddit r/{subreddit}",
                )
            )

        return posts

    @staticmethod
    def _utc_to_iso(utc_timestamp: float) -> str:
        """Convert UTC timestamp to ISO 8601 string."""
        from datetime import datetime, timezone

        try:
            dt = datetime.fromtimestamp(utc_timestamp, tz=timezone.utc)
            return dt.isoformat()
        except (ValueError, OSError):
            return datetime.now(timezone.utc).isoformat()
