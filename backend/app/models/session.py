from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

@dataclass
class Session:
    id: UUID
    source_ip: str
    source_port: Optional[int]
    protocol: str
    score: int
    state: str  # hostile | suspicious | clean | committed | nuked | lab
    verdict: Optional[str]
    username: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    committed_at: Optional[datetime]
    nuked_at: Optional[datetime]
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_hostile(self) -> bool:
        return self.score >= 30

    @property
    def is_active(self) -> bool:
        return self.ended_at is None and self.state not in ('committed', 'nuked', 'lab')

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "source_ip": self.source_ip,
            "source_port": self.source_port,
            "protocol": self.protocol,
            "score": self.score,
            "state": self.state,
            "verdict": self.verdict,
            "username": self.username,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "committed_at": self.committed_at.isoformat() if self.committed_at else None,
            "nuked_at": self.nuked_at.isoformat() if self.nuked_at else None,
            "metadata": self.metadata,
            "is_hostile": self.is_hostile,
            "is_active": self.is_active,
        }
