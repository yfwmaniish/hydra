"""Pydantic schemas for authentication."""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    email: str
    uid: str


class UserResponse(BaseModel):
    uid: str
    email: str
    display_name: str | None = None
