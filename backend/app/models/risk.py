"""QuantumShield — Risk Score Model"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, DateTime, Float, Integer, ForeignKey, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class RiskSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class RiskScore(Base):
    """HNDL risk score computation result."""

    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Overall risk
    score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    severity: Mapped[RiskSeverity] = mapped_column(
        Enum(RiskSeverity), nullable=False, index=True
    )

    # Component scores (0–10 scale)
    data_sensitivity_score: Mapped[float] = mapped_column(Float, default=0.0)
    data_longevity_score: Mapped[float] = mapped_column(Float, default=0.0)
    crypto_weakness_score: Mapped[float] = mapped_column(Float, default=0.0)
    exposure_surface_score: Mapped[float] = mapped_column(Float, default=0.0)
    adversary_value_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Quantum specific
    estimated_break_year_low: Mapped[Optional[int]] = mapped_column(Integer)
    estimated_break_year_high: Mapped[Optional[int]] = mapped_column(Integer)
    data_secrecy_expiry_year: Mapped[Optional[int]] = mapped_column(Integer)
    hndl_window_years: Mapped[Optional[float]] = mapped_column(Float)

    # Metadata
    model_version: Mapped[str] = mapped_column(String(32), default="1.0")
    breakdown: Mapped[Optional[dict]] = mapped_column(JSON)

    # Timestamps
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="risk_scores")

    __table_args__ = (
        Index("ix_risk_severity_score", "severity", "score"),
    )

    @staticmethod
    def severity_from_score(score: float) -> RiskSeverity:
        """Derive severity from numeric score."""
        if score >= 8.0:
            return RiskSeverity.CRITICAL
        elif score >= 6.0:
            return RiskSeverity.HIGH
        elif score >= 4.0:
            return RiskSeverity.MEDIUM
        elif score >= 2.0:
            return RiskSeverity.LOW
        return RiskSeverity.INFO

    def __repr__(self) -> str:
        return f"<RiskScore(id={self.id}, asset={self.asset_id}, score={self.score}, severity={self.severity})>"
