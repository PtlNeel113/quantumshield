"""QuantumShield — Asset Domain Model"""

import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Enum, DateTime, Float, Integer, Boolean, ForeignKey, JSON, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class AssetType(str, enum.Enum):
    API = "api"
    DATABASE = "database"
    BUCKET = "bucket"
    BACKUP = "backup"
    REPOSITORY = "repository"
    CERTIFICATE = "certificate"
    KUBERNETES_SERVICE = "kubernetes_service"
    VM = "vm"
    LOAD_BALANCER = "load_balancer"
    CACHE = "cache"
    BASTION_HOST = "bastion_host"
    STORAGE = "storage"
    SERVICE = "service"
    DOMAIN = "domain"


class AssetEnvironment(str, enum.Enum):
    PRODUCTION = "production"
    STAGING = "staging"
    DEVELOPMENT = "development"
    DR = "disaster_recovery"
    ARCHIVE = "archive"


class ExposureSurface(str, enum.Enum):
    INTERNET = "internet"
    INTERNAL = "internal"
    HYBRID = "hybrid"
    AIR_GAPPED = "air_gapped"
    OFFLINE = "offline"


class Sensitivity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Asset(Base):
    """Infrastructure asset under cryptographic risk management."""

    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[AssetType] = mapped_column(Enum(AssetType), nullable=False, index=True)
    environment: Mapped[AssetEnvironment] = mapped_column(
        Enum(AssetEnvironment), default=AssetEnvironment.PRODUCTION
    )
    owner: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    exposure_surface: Mapped[ExposureSurface] = mapped_column(
        Enum(ExposureSurface), default=ExposureSurface.INTERNAL
    )
    sensitivity: Mapped[Sensitivity] = mapped_column(
        Enum(Sensitivity), default=Sensitivity.MEDIUM
    )

    # Crypto metadata
    algorithm: Mapped[Optional[str]] = mapped_column(String(64))
    key_length: Mapped[Optional[int]] = mapped_column(Integer)
    retention_period: Mapped[Optional[str]] = mapped_column(String(64))

    # Scoring
    quantum_risk_score: Mapped[Optional[float]] = mapped_column(Float, index=True)

    # Metadata
    tags: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    metadata_extra: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_scanned: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    crypto_findings: Mapped[List["CryptoFinding"]] = relationship(
        "CryptoFinding", back_populates="asset", cascade="all, delete-orphan"
    )
    risk_scores: Mapped[List["RiskScore"]] = relationship(
        "RiskScore", back_populates="asset", cascade="all, delete-orphan"
    )
    data_classifications: Mapped[List["DataClassification"]] = relationship(
        "DataClassification", back_populates="asset", cascade="all, delete-orphan"
    )
    migration_advice: Mapped[List["MigrationAdvice"]] = relationship(
        "MigrationAdvice", back_populates="asset", cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index("ix_assets_type_env", "type", "environment"),
        Index("ix_assets_risk", "quantum_risk_score"),
        Index("ix_assets_location_type", "location", "type"),
    )

    def __repr__(self) -> str:
        return f"<Asset(id={self.id}, name={self.name}, type={self.type})>"
