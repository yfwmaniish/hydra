"""
Seed utility — populates Firestore with initial data if collections are empty.
This ensures the dashboard has data to display on first run.
Uses the same data structures as the frontend mockData.ts.
"""
import logging
from app.firebase_client import get_firestore

logger = logging.getLogger(__name__)


async def seed_initial_data() -> None:
    """Seed Firestore with initial data if collections are empty."""
    db = get_firestore()

    await _seed_collection(db, "threats", _SEED_THREATS)
    await _seed_collection(db, "entities", _SEED_ENTITIES)
    await _seed_collection(db, "links", _SEED_LINKS)
    await _seed_collection(db, "sectors", _SEED_SECTORS)
    await _seed_collection(db, "sources", _SEED_SOURCES)
    await _seed_collection(db, "keywords", _SEED_KEYWORDS)


async def _seed_collection(db, collection_name: str, data: list[dict]) -> None:
    """Seed a single collection if it's empty."""
    existing = db.collection(collection_name).limit(1).get()
    if existing:
        logger.info(f"Collection '{collection_name}' already has data, skipping seed")
        return

    for doc_data in data:
        doc_id = str(doc_data.get("id", ""))
        if doc_id:
            db.collection(collection_name).document(doc_id).set(doc_data)
        else:
            db.collection(collection_name).add(doc_data)

    logger.info(f"Seeded '{collection_name}' with {len(data)} documents")


# ═══ Seed Data (mirrors frontend mockData.ts) ═══

_SEED_THREATS = [
    {
        "id": "THR-2024-001",
        "title": "Credential dump detected on dark web forum",
        "source": "Dark Web Forum",
        "target": "Government",
        "type": "Credential Leak",
        "severity": "Critical",
        "credibility": 92,
        "timestamp": "2024-12-15T10:30:00Z",
        "status": "Investigating",
        "rawEvidence": ">>> INTERCEPT LOG [2024-12-15T10:30:00Z]\\n"
            "Source: DarkForum://thread/45892\\n"
            "Author: shadow_vendor_91\\n"
            "---BEGIN DUMP---\\n"
            "admin@gov-portal.in:P@$$w0rd123!\\n"
            "supervisor@nic-mail.gov.in:Welcome2024#\\n"
            "---END DUMP---",
        "details": "Multiple .gov.in credentials found in a paste on a known dark web forum.",
    },
    {
        "id": "THR-2024-002",
        "title": "DDoS attack planning discussion detected",
        "source": "Underground IRC",
        "target": "Banking & Finance",
        "type": "Attack Planning",
        "severity": "High",
        "credibility": 78,
        "timestamp": "2024-12-14T08:15:00Z",
        "status": "New",
        "rawEvidence": ">>> INTERCEPT LOG [2024-12-14T08:15:00Z]\\n"
            "Source: IRC://darknet-ops/#attack-planning\\n"
            "---TRANSCRIPT---\\n"
            "<cyb3r_king>: Target locked. Indian banking portal.\\n"
            "<phantom_x>: DDoS vectors ready. Layer 7 flood.\\n"
            "---END TRANSCRIPT---",
        "details": "IRC channel discussion about planned DDoS attack on Indian banking infrastructure.",
    },
    {
        "id": "THR-2024-003",
        "title": "API keys exposed in public GitHub repository",
        "source": "GitHub",
        "target": "Energy & Power",
        "type": "Data Exposure",
        "severity": "Critical",
        "credibility": 95,
        "timestamp": "2024-12-13T14:45:00Z",
        "status": "Escalated",
        "rawEvidence": ">>> INTERCEPT LOG [2024-12-13T14:45:00Z]\\n"
            "Source: github.com/energy-monitor/config\\n"
            "File: .env.production\\n"
            "AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE\\n"
            "DATABASE_URL=postgres://admin:secretpass@db.power-grid.internal:5432/scada",
        "details": "AWS and database credentials from energy infrastructure project found in public repository.",
    },
    {
        "id": "THR-2024-004",
        "title": "Phishing campaign targeting defense sector personnel",
        "source": "Email Intercept",
        "target": "Defense",
        "type": "Phishing",
        "severity": "High",
        "credibility": 85,
        "timestamp": "2024-12-12T16:20:00Z",
        "status": "New",
        "rawEvidence": ">>> INTERCEPT LOG [2024-12-12T16:20:00Z]\\n"
            "From: admin@drdo-secure.org.in.fake-domain.com\\n"
            "Subject: Urgent: Security Update Required\\n"
            "Payload link: hxxps://drdo-secure-login[.]com/verify",
        "details": "Phishing emails mimicking DRDO domain detected targeting defense personnel.",
    },
    {
        "id": "THR-2024-005",
        "title": "Malware C2 communication detected from telecom network",
        "source": "Network Monitor",
        "target": "Telecom",
        "type": "Malware",
        "severity": "Medium",
        "credibility": 65,
        "timestamp": "2024-12-11T22:10:00Z",
        "status": "Resolved",
        "rawEvidence": ">>> INTERCEPT LOG [2024-12-11T22:10:00Z]\\n"
            "Suspicious C2 beacon detected\\n"
            "Source IP: 192.168.45.120\\n"
            "Dest IP: 45.33.49.119:8443\\n"
            "Interval: 60s heartbeat",
        "details": "C2 communication pattern detected from within a telecom provider's network segment.",
    },
]

_SEED_ENTITIES = [
    {"id": 1, "label": "shadow_vendor_91", "type": "actor", "x": 300, "y": 200, "size": 45},
    {"id": 2, "label": "gov-portal.in", "type": "target", "x": 500, "y": 150, "size": 55},
    {"id": 3, "label": "AKIAIOSFODNN7EXAMPLE", "type": "credential", "x": 200, "y": 350, "size": 35},
    {"id": 4, "label": "cyb3r_king", "type": "actor", "x": 450, "y": 400, "size": 40},
    {"id": 5, "label": "45.33.49.119", "type": "ip", "x": 600, "y": 300, "size": 30},
    {"id": 6, "label": "drdo-secure.org.in", "type": "target", "x": 350, "y": 500, "size": 50},
]

_SEED_LINKS = [
    {"source": 1, "target": 2},
    {"source": 1, "target": 3},
    {"source": 4, "target": 2},
    {"source": 4, "target": 5},
    {"source": 5, "target": 6},
    {"source": 3, "target": 6},
]

_SEED_SECTORS = [
    {"id": "gov", "name": "Government", "icon": "shield", "health": 72, "status": "At Risk"},
    {"id": "banking", "name": "Banking & Finance", "icon": "landmark", "health": 85, "status": "Moderate"},
    {"id": "defense", "name": "Defense", "icon": "swords", "health": 68, "status": "At Risk"},
    {"id": "energy", "name": "Energy & Power", "icon": "zap", "health": 45, "status": "Critical"},
    {"id": "telecom", "name": "Telecom", "icon": "radio", "health": 90, "status": "Stable"},
    {"id": "health", "name": "Healthcare", "icon": "heart-pulse", "health": 92, "status": "Stable"},
    {"id": "transport", "name": "Transportation", "icon": "train", "health": 88, "status": "Stable"},
]

_SEED_SOURCES = [
    {"id": 1, "name": "Dark Web Forums", "active": True, "type": "Forum"},
    {"id": 2, "name": "Pastebin Monitor", "active": True, "type": "Pastebin"},
    {"id": 3, "name": "GitHub Exposure Scanner", "active": True, "type": "GitHub"},
    {"id": 4, "name": "IRC Channel Monitor", "active": False, "type": "IRC"},
    {"id": 5, "name": "Telegram Intel Feed", "active": True, "type": "Telegram"},
    {"id": 6, "name": "Reddit CyberSec", "active": True, "type": "Reddit"},
]

_SEED_KEYWORDS = [
    {"id": 1, "term": "india cyber attack", "active": True},
    {"id": 2, "term": "credential dump .gov.in", "active": True},
    {"id": 3, "term": "aadhaar leak", "active": True},
    {"id": 4, "term": "banking trojan india", "active": True},
    {"id": 5, "term": "apt india", "active": True},
    {"id": 6, "term": "drdo hack", "active": True},
    {"id": 7, "term": "isro breach", "active": True},
    {"id": 8, "term": "power grid scada", "active": True},
]
