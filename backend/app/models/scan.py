"""QuantumShield — Scan Job & Result Models"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Enum, DateTime, Float, Integer, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base


class ScanType(str, enum.Enum):
    TLS = "tls"
    REPOSITORY = "repository"
    STORAGE = "storage"
    DNS = "dns"
    KUBERNETES = "kubernetes"
    CLOUD = "cloud"
    FULL = "full"


class ScanStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PARTIAL = "partial"


class ScanJob(Base):
    """Async scan job tracking."""

    __tablename__ = "scan_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_type: Mapped[ScanType] = mapped_column(Enum(ScanType), nullable=False, index=True)
    status: Mapped[ScanStatus] = mapped_column(
        Enum(ScanStatus), default=ScanStatus.QUEUED, index=True
    )

    # Scan configuration
    target: Mapped[Optional[str]] = mapped_column(Text)
    config: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    # Progress
    total_targets: Mapped[int] = mapped_column(Integer, default=0)
    completed_targets: Mapped[int] = mapped_column(Integer, default=0)
    failed_targets: Mapped[int] = mapped_column(Integer, default=0)
    progress_pct: Mapped[float] = mapped_column(Float, default=0.0)

    # Results summary
    findings_count: Mapped[int] = mapped_column(Integer, default=0)
    critical_findings: Mapped[int] = mapped_column(Integer, default=0)
    high_findings: Mapped[int] = mapped_column(Integer, default=0)

    # Execution
    worker_id: Mapped[Optional[str]] = mapped_column(String(128))
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(128))
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float)

    # Metadata
    initiated_by: Mapped[Optional[str]] = mapped_column(String(128))
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_scan_status_type", "status", "scan_type"),
    )

    def __repr__(self) -> str:
        return f"<ScanJob(id={self.id}, type={self.scan_type}, status={self.status})>"


class ScanResult(Base):
    """Individual scan result entry."""

    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_job_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    # Result data
    target: Mapped[str] = mapped_column(String(512), nullable=False)
    result_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="success")
    data: Mapped[Optional[dict]] = mapped_column(JSON)
    error: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<ScanResult(id={self.id}, target={self.target})>"
