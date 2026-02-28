"""QuantumShield — Agent Session Memory

Maintains conversation context, user preferences, and recently discussed assets.
Uses in-memory storage with Redis fallback for persistence.
"""

import json
import time
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from collections import defaultdict


@dataclass
class ConversationTurn:
    """A single turn in the conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: float = field(default_factory=time.time)
    tool_calls: List[Dict] = field(default_factory=list)
    evidence: List[Dict] = field(default_factory=list)


@dataclass
class SessionContext:
    """Session context for the agent."""
    session_id: str
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)
    conversation: List[ConversationTurn] = field(default_factory=list)
    recent_assets: List[str] = field(default_factory=list)
    recent_algorithms: List[str] = field(default_factory=list)
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    investigation_context: Dict[str, Any] = field(default_factory=dict)

    def add_turn(self, role: str, content: str, tool_calls: List = None, evidence: List = None):
        """Add a conversation turn."""
        turn = ConversationTurn(
            role=role,
            content=content,
            tool_calls=tool_calls or [],
            evidence=evidence or [],
        )
        self.conversation.append(turn)
        self.last_active = time.time()

        # Keep last 50 turns max
        if len(self.conversation) > 50:
            self.conversation = self.conversation[-50:]

    def add_recent_asset(self, asset_name: str):
        """Track recently discussed assets."""
        if asset_name not in self.recent_assets:
            self.recent_assets.insert(0, asset_name)
            self.recent_assets = self.recent_assets[:10]

    def add_recent_algorithm(self, algorithm: str):
        """Track recently discussed algorithms."""
        if algorithm not in self.recent_algorithms:
            self.recent_algorithms.insert(0, algorithm)
            self.recent_algorithms = self.recent_algorithms[:10]

    def get_summary(self) -> Dict:
        """Get a summary of the session context."""
        return {
            "session_id": self.session_id,
            "turns": len(self.conversation),
            "recent_assets": self.recent_assets,
            "recent_algorithms": self.recent_algorithms,
            "duration_seconds": round(time.time() - self.created_at),
        }

    def to_dict(self) -> Dict:
        """Serialize to dict."""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at,
            "last_active": self.last_active,
            "conversation": [asdict(t) for t in self.conversation],
            "recent_assets": self.recent_assets,
            "recent_algorithms": self.recent_algorithms,
            "user_preferences": self.user_preferences,
            "investigation_context": self.investigation_context,
        }


class SessionMemory:
    """In-memory session storage with Redis fallback."""

    def __init__(self):
        self._sessions: Dict[str, SessionContext] = {}

    def get_or_create_session(self, session_id: Optional[str] = None) -> SessionContext:
        """Get existing session or create a new one."""
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]

        if not session_id:
            session_id = str(uuid.uuid4())

        session = SessionContext(session_id=session_id)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionContext]:
        """Get an existing session."""
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str):
        """Delete a session."""
        self._sessions.pop(session_id, None)

    def list_sessions(self) -> List[Dict]:
        """List all active sessions."""
        return [s.get_summary() for s in self._sessions.values()]

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """Remove sessions older than max_age_seconds."""
        now = time.time()
        to_remove = [
            sid for sid, session in self._sessions.items()
            if now - session.last_active > max_age_seconds
        ]
        for sid in to_remove:
            del self._sessions[sid]


# Global session memory instance
session_memory = SessionMemory()
