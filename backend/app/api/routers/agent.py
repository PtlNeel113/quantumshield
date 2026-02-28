"""QuantumShield — Agent Chat API Router

Provides REST API endpoints for the AI Analyst chatbot.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.services.agent.controller import process_message
from app.services.agent.memory import session_memory


router = APIRouter(prefix="/agent", tags=["AI Analyst"])


# ── Request / Response Models ──

class ChatRequest(BaseModel):
    """Chat message request."""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")


class ToolCallInfo(BaseModel):
    """Info about a tool call made during processing."""
    tool: str
    success: bool
    execution_time_ms: float = 0.0


class EvidenceItem(BaseModel):
    """Evidence supporting the response."""
    type: str
    data: Dict[str, Any]


class ReasoningStep(BaseModel):
    """A step in the agent's reasoning chain."""
    step: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    tools_needed: Optional[List[str]] = None
    reasoning: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    tools_executed: Optional[List[str]] = None
    all_succeeded: Optional[bool] = None
    response_length: Optional[int] = None


class ChatResponse(BaseModel):
    """Chat response from the AI agent."""
    message: str
    tool_calls: List[ToolCallInfo] = []
    evidence: List[EvidenceItem] = []
    reasoning: List[ReasoningStep] = []
    session_id: Optional[str] = None
    processing_time_ms: float = 0.0
    timestamp: float = 0.0


class SessionInfo(BaseModel):
    """Session summary information."""
    session_id: str
    turns: int
    recent_assets: List[str] = []
    recent_algorithms: List[str] = []
    duration_seconds: int = 0


class QuerySuggestion(BaseModel):
    """Suggested query for the user."""
    text: str
    category: str
    icon: str


# ── Endpoints ──

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the QuantumShield AI Analyst.
    
    The agent will:
    1. Detect intent from your message
    2. Execute relevant security tools
    3. Synthesize findings into a structured response
    """
    # Get or create session
    session = session_memory.get_or_create_session(request.session_id)
    
    # Add user turn to memory
    session.add_turn("user", request.message)
    
    # Get conversation history for context
    history = [
        {"role": t.role, "content": t.content}
        for t in session.conversation[-10:]  # Last 10 turns for context
    ]
    
    # Process through agent controller
    result = process_message(
        user_message=request.message,
        session_id=session.session_id,
        conversation_history=history,
    )
    
    # Add assistant turn to memory
    session.add_turn(
        "assistant",
        result.get("message", ""),
        tool_calls=result.get("tool_calls", []),
        evidence=result.get("evidence", []),
    )
    
    # Track discussed assets from evidence
    for ev in result.get("evidence", []):
        data = ev.get("data", {})
        if "asset_name" in data:
            session.add_recent_asset(data["asset_name"])
        elif "name" in data:
            session.add_recent_asset(data["name"])
        if "algorithm" in data:
            session.add_recent_algorithm(data["algorithm"])
    
    return ChatResponse(
        message=result.get("message", "I couldn't process that request."),
        tool_calls=[
            ToolCallInfo(**tc) for tc in result.get("tool_calls", [])
        ],
        evidence=[
            EvidenceItem(**ev) for ev in result.get("evidence", [])
        ],
        reasoning=[
            ReasoningStep(**rs) for rs in result.get("reasoning", [])
        ],
        session_id=session.session_id,
        processing_time_ms=result.get("processing_time_ms", 0),
        timestamp=result.get("timestamp", 0),
    )


@router.get("/sessions", response_model=List[SessionInfo])
async def list_sessions():
    """List all active chat sessions."""
    sessions = session_memory.list_sessions()
    return [SessionInfo(**s) for s in sessions]


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session."""
    session_memory.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


@router.get("/suggestions", response_model=List[QuerySuggestion])
async def get_suggestions():
    """Get suggested queries for the chat interface."""
    return [
        QuerySuggestion(
            text="Which systems are most at risk from HNDL attacks?",
            category="Risk Analysis",
            icon="shield-alert",
        ),
        QuerySuggestion(
            text="Where are we still using RSA-2048?",
            category="Crypto Discovery",
            icon="lock",
        ),
        QuerySuggestion(
            text="Simulate an attack on the healthcare archive",
            category="Attack Simulation",
            icon="swords",
        ),
        QuerySuggestion(
            text="Show quantum threat timeline for all algorithms",
            category="Quantum Intelligence",
            icon="clock",
        ),
        QuerySuggestion(
            text="What depends on the identity provider?",
            category="Graph Analysis",
            icon="network",
        ),
        QuerySuggestion(
            text="How should we migrate RSA-2048 to PQC?",
            category="Migration",
            icon="arrow-right-left",
        ),
        QuerySuggestion(
            text="What is Harvest-Now-Decrypt-Later?",
            category="Education",
            icon="book-open",
        ),
        QuerySuggestion(
            text="Trigger a full infrastructure scan",
            category="Operations",
            icon="scan",
        ),
    ]
