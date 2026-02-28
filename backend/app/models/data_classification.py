"""QuantumShield — Data Classification Model"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Enum, DateTime, Float, Integer, ForeignKey, JSON, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class DataType(str, enum.Enum):
    PII = "pii"
    PHI = "phi"  # Protected Health Information
    PCI = "pci"  # Payment Card Industry
    FINANCIAL = "financial"
    BIOMETRIC = "biometric"
    CLASSIFIED = "classified"
    INTELLECTUAL_PROPERTY = "ip"
    TRADE_SECRET = "trade_secret"
    GENERAL = "general"
    LOG = "log"
    TELEMETRY = "telemetry"


class ComplianceFramework(str, enum.Enum):
    GDPR = "gdpr"
    HIPAA = "hipaa"
    PCI_DSS = "pci_dss"
    SOX = "sox"
    NIST = "nist"
    ISO_27001 = "iso_27001"
    FedRAMP = "fedramp"
    CCPA = "ccpa"


class DataClassification(Base):
    """Data sensitivity and secrecy lifetime classification."""

    __tablename__ = "data_classifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Classification
    data_type: Mapped[DataType] = mapped_column(Enum(DataType), nullable=False, index=True)
    sensitivity_score: Mapped[float] = mapped_column(Float, nullable=False)
    required_secrecy_years: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5)

    # Compliance mapping
    compliance_frameworks: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    retention_policy: Mapped[Optional[str]] = mapped_column(String(255))

    # Detection details
    detected_fields: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    inference_rules: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    classified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="data_classifications")

    __table_args__ = (
        Index("ix_data_class_sensitivity", "sensitivity_score"),
        Index("ix_data_class_secrecy", "required_secrecy_years"),
    )

    def __repr__(self) -> str:
        return f"<DataClassification(id={self.id}, type={self.data_type}, secrecy_years={self.required_secrecy_years})>"
