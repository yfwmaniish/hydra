import httpx
import logging
from ..config import settings

logger = logging.getLogger(__name__)

async def send_telegram_alert(threat_data: dict) -> None:
    """
    Sends a critical threat alert to the configured Telegram chat.
    This function is designed to be fire-and-forget.
    """
    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.warning("Telegram alert skipped: missing credentials")
        return

    # Format the message
    title = threat_data.get('title', 'Unknown Threat')
    source = threat_data.get('source', 'Unknown Source')
    threat_type = threat_data.get('type', 'Unknown Type')
    severity = threat_data.get('severity', 'Unknown')
    evidence_snippet = threat_data.get('rawEvidence', 'N/A')[:200]
    
    message = (
        f"🚨 <b>CRITICAL THREAT DETECTED</b> 🚨\n\n"
        f"<b>Title:</b> {title}\n"
        f"<b>Source:</b> {source}\n"
        f"<b>Type:</b> {threat_type}\n"
        f"<b>Severity:</b> {severity}\n\n"
        f"<b>Evidence:</b>\n<pre>{evidence_snippet}...</pre>\n\n"
        f"<i>Check Trinetra Dashboard for details.</i>"
    )

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": message,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            if resp.status_code != 200:
                logger.error(f"Telegram send failed: {resp.text}")
            else:
                logger.info(f"Telegram alert sent for threat {threat_data.get('id')}")
    except Exception as e:
        logger.error(f"Telegram connection failed: {e}")
