"""QuantumShield — Scan Schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ScanRequest(BaseModel):
    scan_type: str = Field(..., description="tls | repository | storage | dns | kubernetes | cloud | full")
    targets: Optional[List[str]] = None
    config: Optional[dict] = None


class ScanStatusResponse(BaseModel):
    id: int
    scan_type: str
    status: str
    total_targets: int
    completed_targets: int
    failed_targets: int
    progress_pct: float
    findings_count: int
    critical_findings: int
    high_findings: int
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ScanJobResponse(BaseModel):
    id: int
    scan_type: str
    status: str
    progress_pct: float
    findings_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
