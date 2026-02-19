"""Pydantic schemas for data source configuration."""
from pydantic import BaseModel
from typing import Optional


class SourceResponse(BaseModel):
    id: int
    name: str
    active: bool
    type: str  # Social, Scraper, Intel, Custom
    url: Optional[str] = None


class SourceCreate(BaseModel):
    name: str
    type: str = "Custom"
    url: Optional[str] = None


class SourceUpdate(BaseModel):
    active: Optional[bool] = None
    name: Optional[str] = None
    url: Optional[str] = None
