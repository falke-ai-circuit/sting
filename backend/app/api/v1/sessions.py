from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from app.core.db import get_conn
from app.core.alerter import telegram_alerter
from app.verdict.session_layer import session_layer, VerdictAction
from app.verdict.engine import verdict_engine
from app.execution.nuke_executor import nuke_executor
import json
import asyncio

router = APIRouter(prefix="/sessions", tags=["sessions"])


class VerdictRequest(BaseModel):
    action: str  # NUKE | COMMIT | LAB


@router.get("")
async def list_sessions(
    state: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    async with get_conn() as db:
        if state:
            rows = await db.fetch("""
                SELECT * FROM sessions WHERE state = $1
                ORDER BY started_at DESC LIMIT $2 OFFSET $3
            """, state, limit, offset)
        else:
            rows = await db.fetch("""
                SELECT * FROM sessions
                ORDER BY started_at DESC LIMIT $1 OFFSET $2
            """, limit, offset)

    sessions = []
    for r in rows:
        s = dict(r)
        s["id"] = str(s["id"])
        for k in ("started_at", "ended_at", "committed_at", "nuked_at"):
            if s.get(k):
                s[k] = s[k].isoformat()
        live_score = verdict_engine.get_score(s["id"])
        s["score"] = live_score
        s["live_state"] = verdict_engine.get_state(s["id"])
        sessions.append(s)

    return {"sessions": sessions, "total": len(sessions), "offset": offset}


@router.get("/{session_id}")
async def get_session(session_id: str):
    async with get_conn() as db:
        row = await db.fetchrow("SELECT * FROM sessions WHERE id = $1::uuid", session_id)
    if not row:
        raise HTTPException(404, "Session not found")

    s = dict(row)
    s["id"] = str(s["id"])
    for k in ("started_at", "ended_at", "committed_at", "nuked_at"):
        if s.get(k):
            s[k] = s[k].isoformat()

    buf = session_layer.get(session_id)
    if buf:
        s["layer_diff"] = await buf.diff()

    return s


@router.get("/{session_id}/events")
async def get_session_events(session_id: str, limit: int = 100):
    async with get_conn() as db:
        rows = await db.fetch("""
            SELECT * FROM events WHERE session_id = $1::uuid
            ORDER BY ts DESC LIMIT $2
        """, session_id, limit)

    events = []
    for r in rows:
        e = dict(r)
        e["session_id"] = str(e["session_id"])
        if e.get("ts"):
            e["ts"] = e["ts"].isoformat()
        events.append(e)

    return {"events": events}


@router.post("/{session_id}/verdict")
async def apply_verdict(session_id: str, req: VerdictRequest):
    try:
        action = VerdictAction(req.action.upper())
    except ValueError:
        raise HTTPException(400, f"Invalid action: {req.action}. Must be NUKE, COMMIT, or LAB")

    # Get session from DB first
    async with get_conn() as db:
        row = await db.fetchrow("SELECT * FROM sessions WHERE id = $1::uuid", session_id)
        if not row:
            raise HTTPException(404, "Session not found")
        
        s = dict(row)
        src_ip = s.get("src_ip") or s.get("source_ip", "unknown")

        # Try session_layer first (for active sessions), handle gracefully if not found
        session_layer_result = None
        try:
            session_layer_result = await session_layer.apply_verdict(session_id, action)
        except KeyError:
            # Session not in active layer - this is OK for DB-only sessions
            session_layer_result = {"action": action.value, "session_id": session_id, "note": "not in active layer"}

        if action == VerdictAction.NUKE:
            await db.execute("""
                UPDATE sessions SET verdict='NUKE', state='nuked', nuked_at=NOW(), ended_at=NOW()
                WHERE id = $1::uuid
            """, session_id)

            # Execute actual NUKE — ban the IP (works for any session with source_ip)
            nuke_result = await nuke_executor.execute_nuke(session_id, src_ip)
            session_layer_result["nuke_execution"] = nuke_result

            # Record ban in DB
            if nuke_result.get("iptables_success"):
                await db.execute("""
                    INSERT INTO banned_ips (ip, session_id, reason)
                    VALUES ($1, $2::uuid, 'NUKE verdict')
                    ON CONFLICT (ip) DO UPDATE SET banned_at = NOW(), session_id = $2::uuid
                """, src_ip, session_id)

            # Send Telegram alert
            asyncio.create_task(telegram_alerter.send_nuke_alert(
                session_id=str(s["id"]),
                src_ip=src_ip,
                request_count=s.get("request_count", 0),
                first_seen=s["started_at"].isoformat() if s.get("started_at") else "unknown"
            ))

        elif action == VerdictAction.COMMIT:
            await db.execute("""
                UPDATE sessions SET verdict='COMMIT', state='committed', committed_at=NOW(), ended_at=NOW()
                WHERE id = $1::uuid
            """, session_id)

        elif action == VerdictAction.LAB:
            await db.execute("""
                UPDATE sessions SET verdict='LAB', state='lab', ended_at=NOW()
                WHERE id = $1::uuid
            """, session_id)

            # Store LAB snapshot to DB (from session_layer if available, otherwise minimal)
            snapshot = session_layer_result.get("snapshot", {}) if session_layer_result else {}
            if snapshot:
                await db.execute("""
                    INSERT INTO lab_snapshots (session_id, source_ip, snapshot)
                    VALUES ($1::uuid, $2, $3::jsonb)
                """, session_id, src_ip, json.dumps(snapshot))
                session_layer_result["snapshot_stored"] = True

    return session_layer_result
