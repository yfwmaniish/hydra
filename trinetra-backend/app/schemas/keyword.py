"""Pydantic schemas for monitored keyword configuration."""
from pydantic import BaseModel
from typing import Optional


class KeywordResponse(BaseModel):
    id: int
    term: str
    active: bool


class KeywordCreate(BaseModel):
    term: str


class KeywordUpdate(BaseModel):
    active: Optional[bool] = None
    term: Optional[str] = None
