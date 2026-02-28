"""QuantumShield — Migration Schemas"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MigrationAdviceResponse(BaseModel):
    id: int
    asset_id: str
    current_crypto: str
    current_key_length: Optional[int] = None
    recommended_crypto: str
    recommended_key_length: Optional[int] = None
    migration_standard: Optional[str] = None
    complexity: str
    risk_reduction: float
    estimated_effort_hours: Optional[int] = None
    priority: int
    rationale: Optional[str] = None
    implementation_notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MigrationSummaryResponse(BaseModel):
    total_recommendations: int
    by_complexity: dict
    average_risk_reduction: float
    total_effort_hours: int
    top_priority: List[MigrationAdviceResponse]
