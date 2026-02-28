"""QuantumShield — Risk Schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RiskScoreResponse(BaseModel):
    id: int
    asset_id: str
    score: float
    severity: str
    data_sensitivity_score: float
    data_longevity_score: float
    crypto_weakness_score: float
    exposure_surface_score: float
    adversary_value_score: float
    estimated_break_year_low: Optional[int] = None
    estimated_break_year_high: Optional[int] = None
    data_secrecy_expiry_year: Optional[int] = None
    hndl_window_years: Optional[float] = None
    computed_at: datetime

    model_config = {"from_attributes": True}


class TopRiskResponse(BaseModel):
    items: List[RiskScoreResponse]
    total: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    average_score: float


class SimulationRequest(BaseModel):
    asset_id: str
    steal_year: int = Field(..., ge=2024, le=2060)
    quantum_break_year: Optional[int] = None
    adversary_capability: str = "nation_state"  # nation_state | criminal | academic


class SimulationResponse(BaseModel):
    asset_id: str
    asset_name: str
    algorithm: Optional[str] = None
    steal_year: int
    break_year: int
    data_expiry_year: int
    records_exposed: int
    time_to_break_years: float
    time_at_risk_years: float
    impact: str  # critical | high | medium | low | safe
    exposure_window: str
    recommendation: str


class QuantumTimelineEntry(BaseModel):
    algorithm: str
    logical_qubits_required: int
    estimated_break_year_low: int
    estimated_break_year_high: int
    confidence: float
    vulnerability_pct_by_year: dict


class QuantumTimelineResponse(BaseModel):
    algorithms: List[QuantumTimelineEntry]
    model_version: str
    last_updated: datetime
