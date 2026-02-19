"""
Trinetra Backend Configuration
Loads settings from .env file using pydantic-settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Firebase
    firebase_service_account_key: str = "serviceAccountKey.json"
    firebase_api_key: str = ""

    # Optional: Gemini API for deeper NLP analysis
    gemini_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None

    # Crawler settings
    crawler_interval_seconds: int = 300  # 5 minutes

    # SMTP Settings (for Email Escalation)
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None

    # Telegram Settings
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://trinetra-intel-v3.web.app"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
