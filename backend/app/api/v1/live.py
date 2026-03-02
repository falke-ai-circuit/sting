import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from typing import Dict
from app.verdict.engine import verdict_engine
from app.verdict.session_layer import session_layer

router = APIRouter(prefix="/live", tags=["live"])

# Global queue for live events
_live_queue: asyncio.Queue = None


def get_live_queue() -> asyncio.Queue:
    global _live_queue
    if _live_queue is None:
        _live_queue = asyncio.Queue(maxsize=1000)
        # Register as listener to verdict engine
        verdict_engine.register_listener(_push_event)
    return _live_queue


async def _push_event(session_id: str, event_type: str, delta: int, new_score: int):
    """Push verdict engine events to the live queue."""
    queue = get_live_queue()
    event = {
        "type": "verdict_update",
        "session_id": session_id,
        "event_type": event_type,
        "delta": delta,
        "score": new_score,
        "state": verdict_engine.get_state(session_id),
    }
    try:
        queue.put_nowait(event)
    except asyncio.QueueFull:
        pass  # Drop if full


async def _event_generator():
    """SSE event generator."""
    queue = get_live_queue()
    while True:
        try:
            event = await asyncio.wait_for(queue.get(), timeout=30)
            yield f"data: {json.dumps(event)}\n\n"
        except asyncio.TimeoutError:
            # Send keepalive
            yield f": heartbeat\n\n"


@router.get("")
async def live_events():
    """Server-Sent Events stream for real-time updates."""
    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
