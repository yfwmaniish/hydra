"""
Sources router — CRUD for data source configurations.
Manages what forums/sites the crawler monitors.
"""
from fastapi import APIRouter, HTTPException
from app.firebase_client import get_firestore
from app.schemas.source import SourceResponse, SourceCreate, SourceUpdate
import time

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get("", response_model=list[SourceResponse])
async def list_sources():
    """Get all configured data sources."""
    db = get_firestore()
    docs = db.collection("sources").get()
    return [_doc_to_source(doc) for doc in docs]


@router.post("", response_model=SourceResponse, status_code=201)
async def create_source(source: SourceCreate):
    """Add a new data source to monitor."""
    db = get_firestore()
    new_id = int(time.time() * 1000)  # Timestamp-based ID, matches frontend pattern
    doc_data = {
        "id": new_id,
        "name": source.name,
        "active": True,
        "type": source.type,
        "url": source.url,
    }
    db.collection("sources").document(str(new_id)).set(doc_data)
    return SourceResponse(**doc_data)


@router.patch("/{source_id}", response_model=SourceResponse)
async def update_source(source_id: str, update: SourceUpdate):
    """Toggle active status or update a data source."""
    db = get_firestore()
    doc_ref = db.collection("sources").document(source_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Source not found")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    return _doc_to_source(updated_doc)


@router.delete("/{source_id}", status_code=204)
async def delete_source(source_id: str):
    """Remove a data source."""
    db = get_firestore()
    doc_ref = db.collection("sources").document(source_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Source not found")

    doc_ref.delete()


def _doc_to_source(doc) -> SourceResponse:
    data = doc.to_dict()
    return SourceResponse(
        id=int(data.get("id", 0)),
        name=data.get("name", ""),
        active=data.get("active", False),
        type=data.get("type", "Custom"),
        url=data.get("url"),
    )
