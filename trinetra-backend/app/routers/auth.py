"""
Authentication router — Firebase Auth based login and user info.
Uses Firebase REST API for email/password sign-in, then verifies tokens
via Firebase Admin SDK.
"""
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.utils.security import get_current_user
from app.firebase_client import get_firebase_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate with email/password via Firebase REST Identity API.
    Returns a Firebase ID token the frontend should store and send
    as 'Authorization: Bearer <token>' on subsequent requests.
    """
    firebase_url = (
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={settings.firebase_api_key}"
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            firebase_url,
            json={
                "email": request.email,
                "password": request.password,
                "returnSecureToken": True,
            },
        )

    if resp.status_code != 200:
        error_msg = resp.json().get("error", {}).get("message", "Authentication failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {error_msg}",
        )

    data = resp.json()
    return LoginResponse(
        token=data["idToken"],
        email=data["email"],
        uid=data["localId"],
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    uid = current_user.get("uid", "")
    try:
        user_record = get_firebase_user(uid)
        return UserResponse(
            uid=user_record.uid,
            email=user_record.email or "",
            display_name=user_record.display_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found: {str(exc)}",
        )
