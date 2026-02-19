"""Pydantic schemas for Entity and Link data."""
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional


class EntityType(str, Enum):
    ACTOR = "actor"
    IP = "ip"
    DOMAIN = "domain"
    TARGET = "target"
    CREDENTIAL = "credential"


class EntityResponse(BaseModel):
    id: int
    label: str
    type: EntityType
    x: float = Field(default=0.0)
    y: float = Field(default=0.0)
    size: float = Field(default=30.0)
    status: Optional[str] = None


class LinkResponse(BaseModel):
    source: int
    target: int
