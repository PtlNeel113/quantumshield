"""QuantumShield — Data Classification Schemas"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DataClassificationResponse(BaseModel):
    id: int
    asset_id: str
    data_type: str
    sensitivity_score: float
    required_secrecy_years: int
    confidence: float
    compliance_frameworks: Optional[List[str]] = None
    retention_policy: Optional[str] = None
    detected_fields: Optional[List[str]] = None
    classified_at: datetime

    model_config = {"from_attributes": True}
