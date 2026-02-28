"""QuantumShield — Crypto Schemas"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CryptoFindingResponse(BaseModel):
    id: int
    asset_id: str
    domain: Optional[str] = None
    ip_address: Optional[str] = None
    port: int = 443
    protocol: Optional[str] = None
    tls_version: Optional[str] = None
    certificate_algorithm: Optional[str] = None
    certificate_key_length: Optional[int] = None
    signature_algorithm: Optional[str] = None
    certificate_issuer: Optional[str] = None
    certificate_expiry: Optional[datetime] = None
    cipher_suite: Optional[str] = None
    forward_secrecy: bool = False
    algorithm_family: str = "unknown"
    risk_flags: Optional[List[str]] = None
    crypto_weakness_score: Optional[float] = None
    discovered_at: datetime

    model_config = {"from_attributes": True}


class CryptoSummaryResponse(BaseModel):
    total_findings: int
    quantum_vulnerable: int
    pqc_ready: int
    by_algorithm_family: dict
    by_protocol: dict
    weak_key_count: int
    deprecated_protocol_count: int
    no_forward_secrecy_count: int
    average_weakness_score: float


class CryptoUsageResponse(BaseModel):
    id: int
    repo: str
    file_path: str
    line_number: Optional[int] = None
    algorithm: str
    algorithm_family: str = "unknown"
    purpose: Optional[str] = None
    key_length: Optional[int] = None
    risk_flag: Optional[str] = None
    confidence: float = 0.5
    detection_method: Optional[str] = None
    context_snippet: Optional[str] = None
    discovered_at: datetime

    model_config = {"from_attributes": True}
