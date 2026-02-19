"""Pydantic schemas for Threat data — matches frontend Threat interface."""
from pydantic import BaseModel
from typing import Optional
from enum import Enum


class SeverityLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class ThreatStatus(str, Enum):
    NEW = "New"
    INVESTIGATING = "Investigating"
    ESCALATED = "Escalated"
    RESOLVED = "Resolved"


class LocationSchema(BaseModel):
    lat: float
    lng: float
    name: str


class ThreatResponse(BaseModel):
    """Response schema matching frontend Threat interface exactly."""
    id: str
    title: str
    source: str
    target: str
    type: str
    severity: SeverityLevel
    credibility: int  # 0-100
    timestamp: str
    status: ThreatStatus
    rawEvidence: str
    location: Optional[LocationSchema] = None
    details: Optional[str] = None


class ThreatCreate(BaseModel):
    """Schema for creating a new threat (used internally by crawler)."""
    title: str
    source: str
    target: str
    type: str
    severity: SeverityLevel
    credibility: int
    rawEvidence: str
    location: Optional[LocationSchema] = None
    details: Optional[str] = None


class TimelineDataResponse(BaseModel):
    time: str
    value: int
