"""
Keywords router — CRUD for monitored threat keywords.
"""
from fastapi import APIRouter, HTTPException
from app.firebase_client import get_firestore
from app.schemas.keyword import KeywordResponse, KeywordCreate, KeywordUpdate
import time

router = APIRouter(prefix="/keywords", tags=["Keywords"])


@router.get("", response_model=list[KeywordResponse])
async def list_keywords():
    """Get all monitored keywords."""
    db = get_firestore()
    docs = db.collection("keywords").get()
    return [_doc_to_keyword(doc) for doc in docs]


@router.post("", response_model=KeywordResponse, status_code=201)
async def create_keyword(keyword: KeywordCreate):
    """Add a new keyword to monitor."""
    db = get_firestore()
    new_id = int(time.time() * 1000)
    doc_data = {
        "id": new_id,
        "term": keyword.term,
        "active": True,
    }
    db.collection("keywords").document(str(new_id)).set(doc_data)
    return KeywordResponse(**doc_data)


@router.patch("/{keyword_id}", response_model=KeywordResponse)
async def update_keyword(keyword_id: str, update: KeywordUpdate):
    """Toggle a keyword's active status or update its term."""
    db = get_firestore()
    doc_ref = db.collection("keywords").document(keyword_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Keyword not found")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    return _doc_to_keyword(updated_doc)


@router.delete("/{keyword_id}", status_code=204)
async def delete_keyword(keyword_id: str):
    """Remove a monitored keyword."""
    db = get_firestore()
    doc_ref = db.collection("keywords").document(keyword_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Keyword not found")

    doc_ref.delete()


def _doc_to_keyword(doc) -> KeywordResponse:
    data = doc.to_dict()
    return KeywordResponse(
        id=int(data.get("id", 0)),
        term=data.get("term", ""),
        active=data.get("active", False),
    )
