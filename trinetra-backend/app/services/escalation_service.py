import smtplib
from email.message import EmailMessage
from datetime import datetime
import logging
from ..config import settings

logger = logging.getLogger(__name__)

def escalate_to_cert_in(threat_data: dict) -> str:
    """
    Sends an incident report email to CERT-In (simulated via personal email).
    """
    if not settings.smtp_username or not settings.smtp_password:
        return "Escalation Failed: SMTP credentials not configured."

    # 1. Setup the Email Content
    msg = EmailMessage()
    msg['Subject'] = f"INCIDENT REPORT: {threat_data.get('type', 'Unknown')} - {threat_data.get('id', 'N/A')}"
    msg['From'] = settings.smtp_username
    msg['To'] = "manishtiwari5398@gmail.com" # As requested by user

    # 2. Map Threat Analysis to CERT-In Format
    # 2. Map Threat Analysis to CERT-In Format
    # Truncate raw evidence to avoid spamming
    raw_evidence = threat_data.get('rawEvidence', 'N/A')
    if len(raw_evidence) > 300:
        evidence_snippet = raw_evidence[:300] + "... [TRUNCATED]"
    else:
        evidence_snippet = raw_evidence

    body = f"""
    --- TRINETRA INCIDENT REPORT ---
    
    ISSUE: {threat_data.get('title', 'Untitled Threat')}
    SEVERITY: {threat_data.get('severity')}
    TYPE: {threat_data.get('type')}
    
    SOURCE: {threat_data.get('source')} -> TARGET: {threat_data.get('target')}
    
    EVIDENCE SUMMARY:
    {evidence_snippet}
       
    SYSTEM DATA:
    - ID: {threat_data.get('id')}
    - Credibility: {threat_data.get('credibility')}
    - Detected At: {threat_data.get('timestamp')}
    """
    msg.set_content(body)

    # 3. Send via SMTP
    try:
        with smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port) as smtp:
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)
        logger.info(f"Escalation email sent for threat {threat_data.get('id')}")
        return "Escalation Successful"
    except Exception as e:
        logger.error(f"Failed to send escalation email: {e}")
        return f"Failed to escalate: {str(e)}"
