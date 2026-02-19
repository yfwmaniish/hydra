"""
Sectors router — computes Indian infrastructure sector health
from real threat data in Firestore.

Health score logic:
  - Start each sector at 100.
  - For every threat targeting that sector, deduct severity-based penalties.
  - Clamp health to 0–100 range.
  - Derive status: Critical (<50), Warning (50–74), Stable (>=75).
"""
import logging
from fastapi import APIRouter
from app.firebase_client import get_firestore
from app.schemas.sector import SectorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sectors", tags=["Sectors"])

# ── Sector definitions ──────────────────────────────────────────────
# Maps sector name → (lucide icon key, list of target keywords that map here)
SECTOR_CONFIG: dict[str, dict] = {
    "Power Grid": {
        "icon": "zap",
        "keywords": ["power", "grid", "energy", "electricity", "power grid"],
    },
    "Finance / UPI": {
        "icon": "landmark",
        "keywords": ["finance", "upi", "banking", "bank", "financial", "payment"],
    },
    "Telecom": {
        "icon": "wifi",
        "keywords": ["telecom", "telecomm", "5g", "network", "isps"],
    },
    "Gov Data": {
        "icon": "database",
        "keywords": ["gov", "government", "aadhaar", "passport", "gov data"],
    },
    "Healthcare": {
        "icon": "activity",
        "keywords": ["health", "healthcare", "hospital", "medical", "pharma"],
    },
    "Defense": {
        "icon": "shield",
        "keywords": ["defense", "defence", "military", "drdo", "armed forces"],
    },
}

# Severity → deduction from health score per threat
SEVERITY_PENALTY = {
    "Critical": 18,
    "High": 12,
    "Medium": 6,
    "Low": 2,
}


def _match_sector(target: str) -> str | None:
    """Map a threat's target field to a known sector name."""
    target_lower = target.strip().lower()
    for sector_name, cfg in SECTOR_CONFIG.items():
        if target_lower == sector_name.lower():
            return sector_name
        for kw in cfg["keywords"]:
            if kw in target_lower:
                return sector_name
    return None


def _compute_status(health: int) -> str:
    """Derive status string from health score."""
    if health < 50:
        return "Critical"
    elif health < 75:
        return "Warning"
    return "Stable"


@router.get("", response_model=list[SectorResponse])
async def list_sectors():
    """
    Compute sector health dynamically from real threat data.
    Falls back to seeded 'sectors' collection if it has data.
    """
    db = get_firestore()

    # ── Priority 1: seeded sectors collection ──
    seeded_docs = db.collection("sectors").limit(1).get()
    if seeded_docs:
        docs = db.collection("sectors").get()
        results = []
        for doc in docs:
            data = doc.to_dict()
            try:
                results.append(SectorResponse(
                    id=data.get("id", doc.id),
                    name=data.get("name", ""),
                    icon=data.get("icon", "shield"),
                    health=int(data.get("health", 100)),
                    status=data.get("status", "Stable"),
                ))
            except Exception as e:
                logger.warning(f"Skipping malformed sector doc {doc.id}: {e}")
        if results:
            return results

    # ── Priority 2: compute from threats ──
    logger.info("No seeded sectors found, computing from threats collection")
    threat_docs = db.collection("threats").get()

    # Initialize health for every sector
    health_map: dict[str, int] = {name: 100 for name in SECTOR_CONFIG}

    for doc in threat_docs:
        data = doc.to_dict()
        target = data.get("target", "")
        severity = data.get("severity", "Medium")

        sector_name = _match_sector(target)
        if not sector_name:
            continue

        penalty = SEVERITY_PENALTY.get(severity, 4)
        health_map[sector_name] = max(0, health_map[sector_name] - penalty)

    # Build response
    results: list[SectorResponse] = []
    for idx, (name, cfg) in enumerate(SECTOR_CONFIG.items(), start=1):
        health = health_map[name]
        results.append(SectorResponse(
            id=str(idx),
            name=name,
            icon=cfg["icon"],
            health=health,
            status=_compute_status(health),
        ))

    # Sort: most impacted first
    results.sort(key=lambda s: s.health)
    return results
