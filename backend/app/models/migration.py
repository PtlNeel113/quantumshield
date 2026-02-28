"""QuantumShield — Migration Advice Model"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, DateTime, Float, Integer, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MigrationComplexity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class MigrationAdvice(Base):
    """Post-Quantum migration recommendation for an asset."""

    __tablename__ = "migration_advice"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Current state
    current_crypto: Mapped[str] = mapped_column(String(128), nullable=False)
    current_key_length: Mapped[Optional[int]] = mapped_column(Integer)

    # Recommendation
    recommended_crypto: Mapped[str] = mapped_column(String(128), nullable=False)
    recommended_key_length: Mapped[Optional[int]] = mapped_column(Integer)
    migration_standard: Mapped[Optional[str]] = mapped_column(String(64))  # NIST PQC, etc.

    # Impact assessment
    complexity: Mapped[MigrationComplexity] = mapped_column(
        Enum(MigrationComplexity), default=MigrationComplexity.MEDIUM
    )
    risk_reduction: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_effort_hours: Mapped[Optional[int]] = mapped_column(Integer)
    priority: Mapped[int] = mapped_column(Integer, default=5)  # 1=highest

    # Implementation details
    rationale: Mapped[Optional[str]] = mapped_column(Text)
    implementation_notes: Mapped[Optional[str]] = mapped_column(Text)
    dependencies: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="migration_advice")

    __table_args__ = (
        Index("ix_migration_priority", "priority"),
    )

    def __repr__(self) -> str:
        return f"<MigrationAdvice(id={self.id}, {self.current_crypto} → {self.recommended_crypto})>"
