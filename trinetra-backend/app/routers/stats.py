"""
Stats router — provides dashboard-level aggregated statistics.
"""
from fastapi import APIRouter
from app.firebase_client import get_firestore
from app.schemas.stats import DashboardStats

router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get aggregated dashboard statistics."""
    db = get_firestore()

    # Count active threats (non-resolved)
    all_threats = db.collection("threats").get()
    active_threats = 0
    critical_count = 0
    for doc in all_threats:
        data = doc.to_dict()
        if data.get("status") != "Resolved":
            active_threats += 1
        if data.get("severity") == "Critical":
            critical_count += 1

    # Count active sources
    all_sources = db.collection("sources").get()
    active_sources = sum(
        1 for doc in all_sources if doc.to_dict().get("active", False)
    )

    return DashboardStats(
        active_threats=active_threats,
        critical_incidents=critical_count,
        monitored_sources=active_sources,
        system_status="Nominal",
    )
