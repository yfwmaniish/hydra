"""
Firebase Admin SDK initialization.
Provides Firestore client and Auth verification helpers.
"""
import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.config import settings
import os

_app: firebase_admin.App | None = None
_db: firestore.Client | None = None


def init_firebase() -> None:
    """Initialize Firebase Admin SDK with service account credentials."""
    global _app

    if _app is not None:
        return

    key_path = settings.firebase_service_account_key
    if not os.path.isabs(key_path):
        # Resolve relative to the backend root directory
        key_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            key_path,
        )

    if not os.path.exists(key_path):
        raise FileNotFoundError(
            f"Firebase service account key not found at: {key_path}\n"
            "Download it from Firebase Console > Project Settings > Service Accounts"
        )

    cred = credentials.Certificate(key_path)
    _app = firebase_admin.initialize_app(cred)


def get_firestore() -> firestore.Client:
    """Get the Firestore client. Creates it lazily on first call."""
    global _db
    if _db is None:
        if _app is None:
            init_firebase()
        _db = firestore.client()
    return _db


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    Raises firebase_admin.auth.InvalidIdTokenError on failure.
    """
    if _app is None:
        init_firebase()
    return auth.verify_id_token(id_token)


# Alias for main.py compatibility
initialize_firebase = init_firebase


def get_firebase_user(uid: str) -> auth.UserRecord:
    """Get Firebase user record by UID."""
    if _app is None:
        init_firebase()
    return auth.get_user(uid)
