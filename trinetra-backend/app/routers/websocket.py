"""
WebSocket router — real-time threat push notifications.
Connected clients receive new threats as they're detected by the crawler.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])

# Global connection manager
_connections: list[WebSocket] = []


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time threat updates.
    Clients connect to receive live threat notifications from the crawler.
    """
    await websocket.accept()
    _connections.append(websocket)
    logger.info(f"WebSocket client connected. Total clients: {len(_connections)}")

    try:
        # Keep connection alive, wait for client messages (ping/pong)
        while True:
            data = await websocket.receive_text()
            # Echo back for keep-alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        _connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(_connections)}")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        if websocket in _connections:
            _connections.remove(websocket)


async def broadcast_threat(threat_data: dict) -> None:
    """
    Broadcast a new threat to all connected WebSocket clients.
    Called by the crawler engine when a new threat is detected.
    """
    if not _connections:
        return

    message = json.dumps({
        "type": "NEW_THREAT",
        "data": threat_data,
    })

    disconnected = []
    for ws in _connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)

    # Clean up disconnected clients
    for ws in disconnected:
        _connections.remove(ws)
