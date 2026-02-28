"""QuantumShield — Cryptographic Finding Models"""

import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Text, Enum, DateTime, Float, Integer, Boolean, ForeignKey, JSON, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base


class CryptoAlgorithmFamily(str, enum.Enum):
    RSA = "rsa"
    ECC = "ecc"
    AES = "aes"
    DES = "des"
    TRIPLE_DES = "3des"
    CHACHA20 = "chacha20"
    DIFFIE_HELLMAN = "dh"
    DSA = "dsa"
    ED25519 = "ed25519"
    KYBER = "kyber"
    DILITHIUM = "dilithium"
    SPHINCS = "sphincs"
    HMAC = "hmac"
    SHA = "sha"
    MD5 = "md5"
    UNKNOWN = "unknown"


class CryptoProtocol(str, enum.Enum):
    TLS_1_0 = "tls_1.0"
    TLS_1_1 = "tls_1.1"
    TLS_1_2 = "tls_1.2"
    TLS_1_3 = "tls_1.3"
    SSH = "ssh"
    IPSEC = "ipsec"
    SMTPS = "smtps"
    FTPS = "ftps"
    APPLICATION = "application"
    STORAGE = "storage"
    DATABASE = "database"


class RiskFlag(str, enum.Enum):
    QUANTUM_VULNERABLE = "quantum_vulnerable"
    WEAK_KEY = "weak_key"
    DEPRECATED_PROTOCOL = "deprecated_protocol"
    NO_FORWARD_SECRECY = "no_forward_secrecy"
    EXPIRED_CERT = "expired_cert"
    SELF_SIGNED = "self_signed"
    SHORT_KEY = "short_key"
    WEAK_HASH = "weak_hash"
    PQC_READY = "pqc_ready"


class CryptoFinding(Base):
    """TLS/certificate cryptographic finding from infrastructure scanning."""

    __tablename__ = "crypto_findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Endpoint info
    domain: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    port: Mapped[int] = mapped_column(Integer, default=443)

    # Protocol
    protocol: Mapped[Optional[CryptoProtocol]] = mapped_column(Enum(CryptoProtocol))
    tls_version: Mapped[Optional[str]] = mapped_column(String(16))

    # Certificate details
    certificate_algorithm: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    certificate_key_length: Mapped[Optional[int]] = mapped_column(Integer)
    signature_algorithm: Mapped[Optional[str]] = mapped_column(String(128))
    certificate_issuer: Mapped[Optional[str]] = mapped_column(String(512))
    certificate_subject: Mapped[Optional[str]] = mapped_column(String(512))
    certificate_expiry: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    certificate_serial: Mapped[Optional[str]] = mapped_column(String(128))

    # Cipher details
    cipher_suite: Mapped[Optional[str]] = mapped_column(String(256))
    cipher_strength: Mapped[Optional[int]] = mapped_column(Integer)
    forward_secrecy: Mapped[bool] = mapped_column(Boolean, default=False)

    # Risk assessment
    algorithm_family: Mapped[CryptoAlgorithmFamily] = mapped_column(
        Enum(CryptoAlgorithmFamily), default=CryptoAlgorithmFamily.UNKNOWN
    )
    risk_flags: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    crypto_weakness_score: Mapped[Optional[float]] = mapped_column(Float)

    # Metadata
    raw_scan_output: Mapped[Optional[dict]] = mapped_column(JSON)
    scan_job_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("scan_jobs.id"), nullable=True
    )

    # Timestamps
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="crypto_findings")

    __table_args__ = (
        Index("ix_crypto_algo_family", "algorithm_family"),
        Index("ix_crypto_weakness", "crypto_weakness_score"),
    )

    def __repr__(self) -> str:
        return f"<CryptoFinding(id={self.id}, domain={self.domain}, algo={self.certificate_algorithm})>"


class CryptoUsage(Base):
    """Source code cryptographic usage detection from repository scanning."""

    __tablename__ = "crypto_usages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Source location
    repo: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    line_number: Mapped[Optional[int]] = mapped_column(Integer)
    function_name: Mapped[Optional[str]] = mapped_column(String(255))

    # Crypto details
    algorithm: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    algorithm_family: Mapped[CryptoAlgorithmFamily] = mapped_column(
        Enum(CryptoAlgorithmFamily), default=CryptoAlgorithmFamily.UNKNOWN
    )
    purpose: Mapped[Optional[str]] = mapped_column(String(128))
    key_length: Mapped[Optional[int]] = mapped_column(Integer)

    # Risk
    risk_flag: Mapped[Optional[RiskFlag]] = mapped_column(Enum(RiskFlag))
    confidence: Mapped[float] = mapped_column(Float, default=0.5)

    # Detection method
    detection_method: Mapped[Optional[str]] = mapped_column(String(32))  # ast, semgrep, regex
    matched_pattern: Mapped[Optional[str]] = mapped_column(Text)
    context_snippet: Mapped[Optional[str]] = mapped_column(Text)

    # Timestamps
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<CryptoUsage(id={self.id}, repo={self.repo}, algo={self.algorithm})>"
