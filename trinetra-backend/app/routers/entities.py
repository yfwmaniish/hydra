"""
Entities router — serves entity graph data for the Investigation page.

Strategy:
1. If the 'entities' collection has seeded/manual data, serve it.
2. Otherwise, dynamically build an entity graph from the 'threats' collection
   by extracting actors (sources), targets, IPs, and domains from threat records.
"""
import re
import math
import hashlib
import logging
from fastapi import APIRouter
from app.firebase_client import get_firestore
from app.schemas.entity import EntityResponse, LinkResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/entities", tags=["Entities"])

# ── Regex patterns for extracting entity mentions from threat evidence ──
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
DOMAIN_PATTERN = re.compile(
    r'\b(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|in|gov|io|info|co)\b',
    re.IGNORECASE,
)


def _stable_id(label: str) -> int:
    """Generate a stable integer ID from a label string."""
    return int(hashlib.md5(label.encode()).hexdigest()[:8], 16)


def _layout_positions(entities: list[dict]) -> list[dict]:
    """
    Assign radial layout positions to entities that don't have them.
    Preserves existing x/y for manual/seeded nodes.
    """
    center_x, center_y = 400, 300
    radius = 250
    
    # Separate entities that need positioning
    to_position = [e for e in entities if "x" not in e or e["x"] == 0]
    n = len(to_position)
    
    if n > 0:
        for i, entity in enumerate(to_position):
            # Spiral layout for better distribution of new nodes
            angle = (2 * math.pi * i) / max(n, 1) + (i * 0.5) 
            # Distribute radius slightly to avoid perfect circle crowding
            r = radius + (i % 3) * 40
            
            entity["x"] = round(center_x + r * math.cos(angle), 1)
            entity["y"] = round(center_y + r * math.sin(angle), 1)

    return entities



def _build_entities_from_threats(threats: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Extract entities and links from actual threat data.
    Extracts: source (actor), target (target sector), IPs, domains from evidence.
    """
    entity_map: dict[str, dict] = {}  # label -> entity dict
    links: list[dict] = []
    seen_links: set[tuple[int, int]] = set()

    for threat in threats:
        # Fallback to 'Unknown Actor' or Title snippet if source is missing
        source_label = threat.get("source") or "Unknown Threat"
        if len(source_label) > 20: source_label = source_label[:20] + "..."

        target_label = threat.get("target") or "General"
        
        raw_evidence = str(threat.get("rawEvidence", "") or threat.get("raw_evidence", "") or "")
        title = threat.get("title", "")
        severity = threat.get("severity", "Medium")

        # Size weighting by severity
        size_map = {"Critical": 55, "High": 45, "Medium": 35, "Low": 25}
        source_size = size_map.get(severity, 35)

        # ── Extract source as actor ──
        if source_label not in entity_map:
            entity_map[source_label] = {
                "id": _stable_id(source_label),
                "label": source_label,
                "type": "actor",
                "size": source_size,
                "status": "Active Monitoring",
            }

        # ── Extract target sector ──
        if target_label not in entity_map:
            entity_map[target_label] = {
                "id": _stable_id(target_label),
                "label": target_label,
                "type": "target",
                "size": 40,
                "status": "Monitored",
            }

        # ── Link source → target ──
        src_id = _stable_id(source_label)
        tgt_id = _stable_id(target_label)
        if src_id != tgt_id and (src_id, tgt_id) not in seen_links:
            links.append({"source": src_id, "target": tgt_id})
            seen_links.add((src_id, tgt_id))

        # ── Extract IPs from evidence ──
        evidence_text = f"{raw_evidence} {title}"
        ips = IP_PATTERN.findall(evidence_text)
        for ip in ips:
            if ip not in entity_map:
                entity_map[ip] = {
                    "id": _stable_id(ip),
                    "label": ip,
                    "type": "ip",
                    "size": 30,
                    "status": "Detected",
                }
            # Link IP → source actor
            ip_id = _stable_id(ip)
            if ip_id != src_id and (ip_id, src_id) not in seen_links:
                links.append({"source": ip_id, "target": src_id})
                seen_links.add((ip_id, src_id))

        # ── Extract domains from evidence ──
        domains = DOMAIN_PATTERN.findall(evidence_text)
        for domain in domains:
            # Skip common non-entity domains
            if domain.lower() in ("localhost", "example.com", "t.me"):
                continue
            if domain not in entity_map:
                entity_map[domain] = {
                    "id": _stable_id(domain),
                    "label": domain,
                    "type": "domain",
                    "size": 35,
                    "status": "Tracking",
                }
            # Link domain → target sector
            dom_id = _stable_id(domain)
            if dom_id != tgt_id and (dom_id, tgt_id) not in seen_links:
                links.append({"source": dom_id, "target": tgt_id})
                seen_links.add((dom_id, tgt_id))

    return list(entity_map.values()), links


@router.get("", response_model=list[EntityResponse])
async def list_entities():
    """
    Get all entities for the investigation graph.
    Merges seeded/manual entities with live entities dynamically 
    extracted from the 'threats' collection.
    """
    db = get_firestore()
    results_map = {} # Label -> Entity

    # 1. Load Seeded/Manual Entities (Base Layer)
    try:
        docs = db.collection("entities").get()
        for doc in docs:
            data = doc.to_dict()
            label = data.get("label", "")
            if label:
                results_map[label] = {
                    "id": int(data.get("id", _stable_id(label))),
                    "label": label,
                    "type": data.get("type", "actor"),
                    "x": float(data.get("x", 0)),
                    "y": float(data.get("y", 0)),
                    "size": float(data.get("size", 30)),
                    "status": data.get("status"),
                }
    except Exception as e:
        logger.warning(f"Error loading manual entities: {e}")

    # 2. Build Dynamic Entities from 'threats' (Live Layer)
    try:
        threat_docs = db.collection("threats").get()
        threats = [doc.to_dict() for doc in threat_docs]
        dynamic_entities, _ = _build_entities_from_threats(threats)
        
        for entity in dynamic_entities:
            label = entity["label"]
            # Only add if not already present (Manual overrides Dynamic)
            # OR if we want to update status/size? For now, manual wins for stability.
            if label not in results_map:
                results_map[label] = entity
            else:
                # Optional: Update status if dynamic has something interesting?
                pass
                
    except Exception as e:
        logger.error(f"Error building dynamic entities: {e}")

    # 3. Finalize and Layout
    final_entities = list(results_map.values())
    final_entities = _layout_positions(final_entities)
    
    return [EntityResponse(**e) for e in final_entities]


@router.get("/links", response_model=list[LinkResponse])
async def list_links():
    """
    Get all entity relationship links.
    Merges seeded links with dynamic links from threats.
    """
    db = get_firestore()
    unique_links = set() # (source, target) tuples

    # 1. Load Seeded/Manual Links
    try:
        docs = db.collection("links").get()
        for doc in docs:
            data = doc.to_dict()
            s, t = int(data.get("source", 0)), int(data.get("target", 0))
            if s and t:
                unique_links.add((s, t))
    except Exception as e:
        logger.warning(f"Error loading manual links: {e}")

    # 2. Build Dynamic Links from 'threats'
    try:
        threat_docs = db.collection("threats").get()
        threats = [doc.to_dict() for doc in threat_docs]
        _, dynamic_links = _build_entities_from_threats(threats)
        
        for link in dynamic_links:
            s, t = link["source"], link["target"]
            # Check if reverse link exists? Graph is usually undirected visually but directed data.
            # We'll valid raw source-target.
            unique_links.add((s, t))
            
    except Exception as e:
        logger.error(f"Error building dynamic links: {e}")

    return [LinkResponse(source=s, target=t) for s, t in unique_links]
