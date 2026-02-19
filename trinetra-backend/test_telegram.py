
import asyncio
from app.services.telegram_service import send_telegram_alert
from app.config import settings

async def test_alert():
    print(f"Testing Telegram Alert...")
    print(f"Token: {settings.telegram_bot_token[:5]}...")
    print(f"Chat ID: {settings.telegram_chat_id}")

    test_threat = {
        "id": "TEST-12345",
        "title": "Test Critical Alert from Trinetra",
        "source": "Manual Test",
        "type": "System Test",
        "severity": "Critical",
        "rawEvidence": "This is a test notification to verify the Telegram integration is working correctly.",
        "credibility": 99.9,
        "timestamp": "2026-02-19T16:10:00Z"
    }

    await send_telegram_alert(test_threat)
    print("Test alert sent! Check your Telegram.")

if __name__ == "__main__":
    asyncio.run(test_alert())
