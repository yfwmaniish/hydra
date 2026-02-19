
import asyncio
from app.services.telegram_service import send_telegram_alert
from app.config import settings

async def test_alert():
    print(f"Testing Telegram Alert for HIGH Severity...")
    
    test_threat_high = {
        "id": "TEST-HIGH-123",
        "title": "Test High Severity Alert",
        "source": "Manual Test",
        "type": "Data Leak",
        "severity": "High",
        "rawEvidence": "This is a test notification for a HIGH severity threat.",
        "credibility": 85.0,
        "timestamp": "2026-02-19T16:15:00Z"
    }

    await send_telegram_alert(test_threat_high)
    print("High severity alert sent! Check Telegram.")

if __name__ == "__main__":
    asyncio.run(test_alert())
