"""QuantumShield — Assets Router"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.asset import Asset, AssetType, AssetEnvironment, ExposureSurface, Sensitivity
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, AssetListResponse

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=AssetListResponse)
async def list_assets(
    type: Optional[AssetType] = None,
    environment: Optional[AssetEnvironment] = None,
    exposure: Optional[ExposureSurface] = None,
    sensitivity: Optional[Sensitivity] = None,
    query: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a paginated list of assets with optional filtering."""
    stmt = select(Asset).where(Asset.is_active == True)
    
    if type:
        stmt = stmt.where(Asset.type == type)
    if environment:
        stmt = stmt.where(Asset.environment == environment)
    if exposure:
        stmt = stmt.where(Asset.exposure_surface == exposure)
    if sensitivity:
        stmt = stmt.where(Asset.sensitivity == sensitivity)
    if query:
        stmt = stmt.where(Asset.name.ilike(f"%{query}%"))
        
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt)
    
    # Get items
    stmt = stmt.order_by(Asset.quantum_risk_score.desc().nulls_last()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return AssetListResponse(
        items=items,
        total=total or 0,
        page=(skip // limit) + 1,
        page_size=limit
    )

@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(asset_in: AssetCreate, db: AsyncSession = Depends(get_db)):
    """Manually register a new asset."""
    asset = Asset(**asset_in.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed information about a specific asset."""
    stmt = select(Asset).where(Asset.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
