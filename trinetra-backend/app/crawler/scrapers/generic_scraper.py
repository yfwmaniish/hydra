"""
Generic Forum Scraper — BeautifulSoup-based scraper for arbitrary forum URLs.
Supports configurable CSS selectors for extracting posts from any forum.
"""
import httpx
import logging
from bs4 import BeautifulSoup
from app.crawler.base_scraper import BaseScraper, RawPost

logger = logging.getLogger(__name__)

# Default CSS selectors for common forum structures
_DEFAULT_SELECTORS = {
    "post_container": "article, .post, .thread, .message, .entry",
    "title": "h1, h2, h3, .title, .subject",
    "content": "p, .content, .body, .post-body, .message-body",
    "author": ".author, .username, .user, .poster",
}

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


class GenericForumScraper(BaseScraper):
    """
    Scrapes forum posts from any publicly accessible URL using
    configurable CSS selectors. Designed to be flexible and extensible.
    """

    def __init__(
        self,
        urls: list[str] | None = None,
        selectors: dict[str, str] | None = None,
    ):
        super().__init__(name="Generic Forum Scraper")
        self.urls = urls or []
        self.selectors = selectors or _DEFAULT_SELECTORS

    async def scrape(self) -> list[RawPost]:
        """Scrape all configured URLs."""
        all_posts: list[RawPost] = []

        async with httpx.AsyncClient(
            headers=_HEADERS, timeout=20.0, follow_redirects=True
        ) as client:
            for url in self.urls:
                try:
                    posts = await self._scrape_url(client, url)
                    all_posts.extend(posts)
                    logger.info(f"Generic: scraped {len(posts)} posts from {url}")
                except Exception as exc:
                    logger.warning(f"Generic: failed to scrape {url}: {exc}")

        return all_posts

    async def _scrape_url(
        self, client: httpx.AsyncClient, url: str
    ) -> list[RawPost]:
        """Scrape a single forum URL."""
        resp = await client.get(url)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "lxml")
        posts = []

        # Find post containers using configurable selectors
        containers = soup.select(self.selectors["post_container"])

        if not containers:
            # Fallback: try to extract all visible text from the page
            page_text = soup.get_text(separator="\n", strip=True)
            if page_text and len(page_text) > 50:
                posts.append(
                    RawPost(
                        content=page_text[:5000],
                        title=soup.title.text if soup.title else url,
                        url=url,
                        source_name=f"Forum: {url}",
                    )
                )
            return posts

        for container in containers[:25]:  # Limit to 25 posts per page
            title = self._extract_text(container, self.selectors["title"])
            content = self._extract_text(container, self.selectors["content"])
            author = self._extract_text(container, self.selectors["author"])

            combined = f"{title}\n\n{content}" if content else title
            if not combined.strip() or len(combined) < 10:
                continue

            # Try to extract link from container
            link_tag = container.find("a")
            post_url = url
            if link_tag and link_tag.get("href"):
                href = link_tag["href"]
                if href.startswith("http"):
                    post_url = href
                elif href.startswith("/"):
                    from urllib.parse import urljoin
                    post_url = urljoin(url, href)

            posts.append(
                RawPost(
                    content=combined[:5000],
                    title=title[:200] if title else "Untitled Post",
                    author=author or "Anonymous",
                    url=post_url,
                    source_name=f"Forum: {url}",
                )
            )

        return posts

    @staticmethod
    def _extract_text(container, selector: str) -> str:
        """Extract text from a container element using CSS selector."""
        try:
            element = container.select_one(selector)
            if element:
                return element.get_text(separator=" ", strip=True)
        except Exception:
            pass
        return ""
