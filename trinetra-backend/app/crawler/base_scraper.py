"""
Abstract base scraper — defines the interface all scrapers must implement.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class RawPost:
    """Represents a single scraped forum post or paste."""
    content: str
    title: str = ""
    author: str = "Unknown"
    url: str = ""
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    source_name: str = ""


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers.
    Each scraper must implement the `scrape()` method that returns
    a list of RawPost objects from its target source.
    """

    def __init__(self, name: str, enabled: bool = True):
        self.name = name
        self.enabled = enabled

    @abstractmethod
    async def scrape(self) -> list[RawPost]:
        """
        Execute the scraping logic and return discovered posts.
        Each implementation handles its own HTTP requests and parsing.
        """
        pass

    def __repr__(self) -> str:
        status = "enabled" if self.enabled else "disabled"
        return f"<{self.__class__.__name__} name='{self.name}' {status}>"
