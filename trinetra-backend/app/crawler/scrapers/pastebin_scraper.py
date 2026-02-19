"""
Pastebin Scraper — monitors recent public pastes for credential leaks.
Uses Pastebin's scraping API (requires IP whitelisting for heavy use,
but basic access works for limited polling).
"""
import httpx
import logging
from app.crawler.base_scraper import BaseScraper, RawPost

logger = logging.getLogger(__name__)


class PastebinScraper(BaseScraper):
    """
    Scrapes recent public pastes from Pastebin.
    Falls back to scraping the raw paste archive if the API is unavailable.
    """

    def __init__(self, max_pastes: int = 20):
        super().__init__(name="Pastebin Scraper")
        self.max_pastes = max_pastes
        self._scrape_url = "https://scrape.pastebin.com/api_scraping.php"
        self._raw_url = "https://scrape.pastebin.com/api_scrape_item.php"

    async def scrape(self) -> list[RawPost]:
        """Scrape recent pastes from Pastebin's scraping API."""
        posts: list[RawPost] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                # Attempt the official scraping API
                posts = await self._scrape_via_api(client)
            except Exception as exc:
                logger.warning(f"Pastebin API scrape failed: {exc}")
                # Fallback: try to scrape trending/archive page
                try:
                    posts = await self._scrape_archive(client)
                except Exception as exc2:
                    logger.warning(f"Pastebin archive scrape also failed: {exc2}")

        logger.info(f"Pastebin: scraped {len(posts)} pastes")
        return posts

    async def _scrape_via_api(self, client: httpx.AsyncClient) -> list[RawPost]:
        """Use Pastebin's scraping API to get recent pastes."""
        resp = await client.get(
            self._scrape_url, params={"limit": self.max_pastes}
        )
        resp.raise_for_status()

        paste_list = resp.json()
        posts = []

        for paste_meta in paste_list[:self.max_pastes]:
            paste_key = paste_meta.get("key", "")
            title = paste_meta.get("title", "Untitled")
            user = paste_meta.get("user", "Anonymous")
            date = paste_meta.get("date", "")

            # Fetch the raw content of each paste
            try:
                raw_resp = await client.get(
                    self._raw_url, params={"i": paste_key}
                )
                raw_resp.raise_for_status()
                content = raw_resp.text
            except Exception:
                content = title  # Use title as fallback

            if not content.strip():
                continue

            posts.append(
                RawPost(
                    content=content[:5000],  # Limit content size
                    title=title,
                    author=user,
                    url=f"https://pastebin.com/{paste_key}",
                    timestamp=self._unix_to_iso(date),
                    source_name="Pastebin",
                )
            )

        return posts

    async def _scrape_archive(self, client: httpx.AsyncClient) -> list[RawPost]:
        """
        Fallback: scrape Pastebin's archive page using BeautifulSoup.
        This works without API access but provides less data.
        """
        from bs4 import BeautifulSoup

        resp = await client.get(
            "https://pastebin.com/archive",
            headers={"User-Agent": "Trinetra-ThreatIntel/1.0"},
        )
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        posts = []

        # Find paste links in the archive table
        table = soup.find("table", class_="maintable")
        if not table:
            return posts

        rows = table.find_all("tr")[1:]  # Skip header row
        for row in rows[: self.max_pastes]:
            cells = row.find_all("td")
            if len(cells) < 2:
                continue

            link_tag = cells[0].find("a")
            if not link_tag:
                continue

            title = link_tag.text.strip() or "Untitled"
            href = link_tag.get("href", "")
            paste_key = href.strip("/")

            # Fetch raw content
            try:
                raw_resp = await client.get(
                    f"https://pastebin.com/raw/{paste_key}",
                    headers={"User-Agent": "Trinetra-ThreatIntel/1.0"},
                )
                raw_resp.raise_for_status()
                content = raw_resp.text[:5000]
            except Exception:
                content = title

            posts.append(
                RawPost(
                    content=content,
                    title=title,
                    author="Anonymous",
                    url=f"https://pastebin.com/{paste_key}",
                    source_name="Pastebin Archive",
                )
            )

        return posts

    @staticmethod
    def _unix_to_iso(unix_str: str) -> str:
        """Convert Unix timestamp string to ISO 8601."""
        from datetime import datetime, timezone

        try:
            ts = int(unix_str)
            return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
        except (ValueError, TypeError):
            return datetime.now(timezone.utc).isoformat()
