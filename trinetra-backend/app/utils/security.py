"""
Security utilities for Firebase Authentication.
Provides FastAPI dependency for extracting and verifying Firebase ID tokens.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.firebase_client import verify_firebase_token

# HTTPBearer extracts token from "Authorization: Bearer <token>" header
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency: verifies the Firebase ID token from the Authorization header.
    Returns decoded token claims (uid, email, etc.).
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Provide a valid Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = verify_firebase_token(credentials.credentials)
        return decoded
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
