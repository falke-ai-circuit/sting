import secrets
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from app.core.db import get_conn

router = APIRouter(prefix="/tokens", tags=["tokens"])


class CanaryTokenCreate(BaseModel):
    name: str
    canary_type: str  # "username", "password", "file", "api_key"


class CanaryTokenResponse(BaseModel):
    id: str
    name: str
    canary_type: str
    value: str
    created_at: str
    triggered_at: Optional[str] = None


def _generate_value(canary_type: str) -> str:
    """Generate a unique canary value based on type."""
    if canary_type == "username":
        return f"admin-{secrets.token_hex(4)}"
    elif canary_type == "password":
        return secrets.token_urlsafe(16)
    elif canary_type == "file":
        return f"/etc/passwd-{secrets.token_hex(4)}"
    elif canary_type == "api_key":
        return f"sk-{secrets.token_hex(24)}"
    else:
        return secrets.token_hex(16)


@router.get("")
async def list_tokens(limit: int = Query(50, le=200)):
    """List all canary tokens."""
    async with get_conn() as db:
        rows = await db.fetch("""
            SELECT id, name, canary_type, value, created_at, triggered_at
            FROM canaries
            ORDER BY created_at DESC
            LIMIT $1
        """, limit)

    tokens = []
    for r in rows:
        t = dict(r)
        t["id"] = str(t["id"])
        t["value"] = t["value"] if t.get("triggered_at") else "********"
        if t.get("created_at"):
            t["created_at"] = t["created_at"].isoformat()
        if t.get("triggered_at"):
            t["triggered_at"] = t["triggered_at"].isoformat()
        tokens.append(t)

    return {"tokens": tokens, "count": len(tokens)}


@router.post("")
async def create_token(req: CanaryTokenCreate):
    """Create a new canary token."""
    value = _generate_value(req.canary_type)

    async with get_conn() as db:
        row = await db.fetchrow("""
            INSERT INTO canaries (name, canary_type, value)
            VALUES ($1, $2, $3)
            RETURNING id, name, canary_type, value, created_at
        """, req.name, req.canary_type, value)

    t = dict(row)
    t["id"] = str(t["id"])
    t["created_at"] = t["created_at"].isoformat()

    return {"token": t}


@router.get("/{token_id}")
async def get_token(token_id: str):
    """Get a specific canary token."""
    async with get_conn() as db:
        row = await db.fetchrow("""
            SELECT id, name, canary_type, value, created_at, triggered_at
            FROM canaries WHERE id = $1::uuid
        """, token_id)

    if not row:
        raise HTTPException(404, "Token not found")

    t = dict(row)
    t["id"] = str(t["id"])
    t["value"] = t["value"] if t.get("triggered_at") else "********"
    if t.get("created_at"):
        t["created_at"] = t["created_at"].isoformat()
    if t.get("triggered_at"):
        t["triggered_at"] = t["triggered_at"].isoformat()

    return t


@router.delete("/{token_id}")
async def delete_token(token_id: str):
    """Delete a canary token."""
    async with get_conn() as db:
        result = await db.execute("DELETE FROM canaries WHERE id = $1::uuid", token_id)
        if result == "DELETE 0":
            raise HTTPException(404, "Token not found")

    return {"deleted": True}
