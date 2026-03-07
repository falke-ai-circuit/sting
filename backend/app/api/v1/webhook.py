"""
Cowrie / honeypot webhook receiver.

POST /api/v1/webhook/cowrie

Accepts Cowrie JSON events (standard eventid format or simplified format).
Feeds events into the verdict engine scoring system.
Stores raw events in webhook_events table.
"""
import json
import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.core.db import get_conn
from app.verdict.engine import verdict_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])

# Map Cowrie event IDs → STING score event types
COWRIE_EVENT_MAP = {
    # Auth events
    "cowrie.login.failed": "auth_failure",
    "cowrie.login.success": "auth_success",
    # Command events
    "cowrie.command.input": "command_executed",
    "cowrie.command.failed": "command_executed",
    # File events
    "cowrie.session.file_download": "download_tool",
    "cowrie.session.file_upload": "file_write",
    "cowrie.session.file_download.failed": "download_tool",
    # Connection events
    "cowrie.session.connect": "connection_attempt",
    "cowrie.session.closed": "idle_timeout",
    # Direct download tools
    "cowrie.direct-tcpip.data": "data_exfiltration",
    # Simplified event names (from our test format)
    "auth_failure": "auth_failure",
    "auth_success": "auth_success",
    "command_executed": "command_executed",
    "file_read_canary": "file_read_canary",
    "file_write": "file_write",
    "download_tool": "download_tool",
    "connection_attempt": "connection_attempt",
    "privilege_escalation": "privilege_escalation",
    "lateral_movement": "lateral_movement",
    "data_exfiltration": "data_exfiltration",
}


class CowrieEvent(BaseModel):
    # Cowrie standard fields
    eventid: Optional[str] = None
    src_ip: Optional[str] = None
    session: Optional[str] = None
    timestamp: Optional[str] = None
    # Simplified test format
    event: Optional[str] = None
    # Extra fields preserved as-is
    class Config:
        extra = "allow"


@router.post("/cowrie")
async def receive_cowrie_event(request: Request):
    """
    Receive a Cowrie honeypot event and feed it into the verdict engine.
    
    Accepts both standard Cowrie eventid format and simplified event format:
    - Standard: {"eventid": "cowrie.login.failed", "src_ip": "...", "session": "..."}
    - Simplified: {"event": "auth_failure", "src_ip": "...", "session": "..."}
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON body")

    # Extract key fields
    eventid = body.get("eventid") or body.get("event", "unknown")
    src_ip = body.get("src_ip") or body.get("source_ip", "unknown")
    session_ref = body.get("session") or body.get("session_id", "")

    # Map to STING event type
    sting_event = COWRIE_EVENT_MAP.get(eventid, "connection_attempt")

    # Score the event if we have a session reference
    score_result = None
    if session_ref:
        try:
            new_score = await verdict_engine.score_event(session_ref, sting_event)
            score_result = {
                "session": session_ref,
                "event_type": sting_event,
                "new_score": new_score,
                "state": verdict_engine.get_state(session_ref),
            }
            logger.info(f"[WEBHOOK] Cowrie event {eventid} → {sting_event}, session {session_ref[:8]}..., score={new_score}")
        except Exception as e:
            logger.warning(f"[WEBHOOK] Score event failed for session {session_ref}: {e}")

    # Store raw event in DB
    async with get_conn() as db:
        await db.execute("""
            INSERT INTO webhook_events (source, event_type, src_ip, session_ref, raw)
            VALUES ('cowrie', $1, $2, $3, $4::jsonb)
        """, eventid, src_ip, session_ref or None, json.dumps(body))

    return {
        "received": True,
        "eventid": eventid,
        "sting_event": sting_event,
        "src_ip": src_ip,
        "session_ref": session_ref or None,
        "scoring": score_result,
    }


@router.get("/cowrie/events")
async def list_webhook_events(limit: int = 50, offset: int = 0):
    """List recent Cowrie webhook events."""
    async with get_conn() as db:
        rows = await db.fetch("""
            SELECT id, source, event_type, src_ip, session_ref, received_at
            FROM webhook_events
            ORDER BY received_at DESC
            LIMIT $1 OFFSET $2
        """, limit, offset)

    events = []
    for r in rows:
        e = dict(r)
        if e.get("received_at"):
            e["received_at"] = e["received_at"].isoformat()
        events.append(e)

    return {"events": events, "total": len(events), "offset": offset}
