"""Pydantic schemas for dashboard statistics."""
from pydantic import BaseModel


class DashboardStats(BaseModel):
    active_threats: int
    critical_incidents: int
    monitored_sources: int
    system_status: str = "Nominal"
