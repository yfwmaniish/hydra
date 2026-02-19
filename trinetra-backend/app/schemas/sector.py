"""Pydantic schemas for Sector health data."""
from pydantic import BaseModel
from enum import Enum


class SectorStatus(str, Enum):
    STABLE = "Stable"
    WARNING = "Warning"
    CRITICAL = "Critical"


class SectorResponse(BaseModel):
    id: str
    name: str
    icon: str
    health: int  # 0-100
    status: SectorStatus
