"""QuantumShield — Asset Schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.asset import AssetType, AssetEnvironment, ExposureSurface, Sensitivity


class AssetBase(BaseModel):
    name: str = Field(..., max_length=255)
    type: AssetType
    environment: AssetEnvironment = AssetEnvironment.PRODUCTION
    owner: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    exposure_surface: ExposureSurface = ExposureSurface.INTERNAL
    sensitivity: Sensitivity = Sensitivity.MEDIUM
    algorithm: Optional[str] = None
    key_length: Optional[int] = None
    retention_period: Optional[str] = None
    tags: Optional[dict] = None


class AssetCreate(AssetBase):
    id: str = Field(..., max_length=64)


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AssetType] = None
    environment: Optional[AssetEnvironment] = None
    owner: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    exposure_surface: Optional[ExposureSurface] = None
    sensitivity: Optional[Sensitivity] = None
    algorithm: Optional[str] = None
    key_length: Optional[int] = None
    retention_period: Optional[str] = None
    tags: Optional[dict] = None


class AssetResponse(AssetBase):
    id: str
    quantum_risk_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    last_scanned: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int


class AssetDiscoverRequest(BaseModel):
    """Request to trigger asset discovery from cloud/infra sources."""
    source: str = Field(..., description="cloud_aws | cloud_gcp | cloud_azure | kubernetes | dns | repository")
    config: Optional[dict] = None
    targets: Optional[List[str]] = None
