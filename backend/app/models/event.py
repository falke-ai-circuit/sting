from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any
from uuid import UUID

@dataclass
class Event:
    id: int
    session_id: UUID
    event_type: str
    data: Dict[str, Any]
    score_delta: int
    ts: datetime

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "session_id": str(self.session_id),
            "event_type": self.event_type,
            "data": self.data,
            "score_delta": self.score_delta,
            "ts": self.ts.isoformat() if self.ts else None,
        }
