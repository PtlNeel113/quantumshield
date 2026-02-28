"""QuantumShield — TLS/Crypto Scanner Service

Detects cryptography used across infrastructure via TLS handshake inspection,
certificate parsing, cipher detection, and key size extraction.
"""

import ssl
import socket
import asyncio
import structlog
from datetime import datetime
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field, asdict

from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa, ed25519, ed448
from cryptography.x509.oid import NameOID

logger = structlog.get_logger(__name__)


# ── Crypto Weakness Scores ──
CRYPTO_WEAKNESS_MAP: Dict[str, float] = {
    "RSA-1024": 1.0,
    "RSA-2048": 0.8,
    "RSA-3072": 0.6,
    "RSA-4096": 0.5,
    "ECC-P256": 0.7,
    "ECC-P384": 0.5,
    "ECC-P521": 0.4,
    "DSA-1024": 1.0,
    "DSA-2048": 0.8,
    "ED25519": 0.6,
    "ED448": 0.5,
    "AES-128": 0.3,
    "AES-256": 0.2,
    "CHACHA20": 0.2,
    "3DES": 0.95,
    "DES": 1.0,
    "KYBER-512": 0.1,
    "KYBER-768": 0.05,
    "KYBER-1024": 0.03,
    "DILITHIUM-2": 0.05,
    "DILITHIUM-3": 0.03,
}


@dataclass
class TLSScanResult:
    """Result of a TLS endpoint scan."""
    domain: str
    ip_address: Optional[str] = None
    port: int = 443
    tls_version: Optional[str] = None
    certificate_algorithm: Optional[str] = None
    certificate_key_length: Optional[int] = None
    signature_algorithm: Optional[str] = None
    cipher_suite: Optional[str] = None
    cipher_strength: Optional[int] = None
    forward_secrecy: bool = False
    certificate_issuer: Optional[str] = None
    certificate_subject: Optional[str] = None
    certificate_expiry: Optional[datetime] = None
    certificate_serial: Optional[str] = None
    algorithm_family: str = "unknown"
    risk_flags: List[str] = field(default_factory=list)
    crypto_weakness_score: float = 0.5
    error: Optional[str] = None
    scan_time_ms: int = 0

    def to_dict(self) -> dict:
        result = asdict(self)
        if self.certificate_expiry:
            result["certificate_expiry"] = self.certificate_expiry.isoformat()
        return result


class TLSScanner:
    """Service for scanning TLS endpoints and extracting cryptographic details."""

    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    async def scan_domain(self, domain: str, port: int = 443) -> TLSScanResult:
        """Perform a TLS handshake and extract cryptographic information."""
        start_time = asyncio.get_event_loop().time()
        result = TLSScanResult(domain=domain, port=port)

        try:
            # Resolve IP
            try:
                infos = await asyncio.get_event_loop().getaddrinfo(domain, port)
                if infos:
                    result.ip_address = infos[0][4][0]
            except Exception:
                pass

            # Create SSL context
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE

            # Perform TLS handshake
            conn = asyncio.open_connection(
                domain, port, ssl=ctx, server_hostname=domain
            )
            reader, writer = await asyncio.wait_for(conn, timeout=self.timeout)

            # Extract TLS info from the SSL object
            ssl_object = writer.transport.get_extra_info("ssl_object")
            if ssl_object:
                result.tls_version = ssl_object.version()
                result.cipher_suite = ssl_object.cipher()[0] if ssl_object.cipher() else None
                result.cipher_strength = ssl_object.cipher()[2] if ssl_object.cipher() else None

                # Check forward secrecy
                cipher_name = result.cipher_suite or ""
                result.forward_secrecy = any(
                    kw in cipher_name for kw in ["ECDHE", "DHE", "ECDH"]
                )

                # Parse certificate
                cert_der = ssl_object.getpeercert(binary_form=True)
                if cert_der:
                    cert = x509.load_der_x509_certificate(cert_der)
                    self._parse_certificate(cert, result)

            writer.close()
            await writer.wait_closed()

        except asyncio.TimeoutError:
            result.error = f"Connection timed out after {self.timeout}s"
            logger.warning("tls_scan_timeout", domain=domain, port=port)
        except ConnectionRefusedError:
            result.error = "Connection refused"
        except Exception as e:
            result.error = str(e)
            logger.error("tls_scan_error", domain=domain, error=str(e))

        # Calculate scan duration
        end_time = asyncio.get_event_loop().time()
        result.scan_time_ms = int((end_time - start_time) * 1000)

        # Assess risk
        self._assess_risk(result)

        return result

    def _parse_certificate(self, cert: x509.Certificate, result: TLSScanResult):
        """Extract key algorithm, size, and metadata from X.509 certificate."""
        pub_key = cert.public_key()

        # Determine algorithm and key size
        if isinstance(pub_key, rsa.RSAPublicKey):
            result.algorithm_family = "rsa"
            result.certificate_key_length = pub_key.key_size
            result.certificate_algorithm = f"RSA-{pub_key.key_size}"
        elif isinstance(pub_key, ec.EllipticCurvePublicKey):
            result.algorithm_family = "ecc"
            result.certificate_key_length = pub_key.key_size
            result.certificate_algorithm = f"ECC-P{pub_key.key_size}"
        elif isinstance(pub_key, dsa.DSAPublicKey):
            result.algorithm_family = "dsa"
            result.certificate_key_length = pub_key.key_size
            result.certificate_algorithm = f"DSA-{pub_key.key_size}"
        elif isinstance(pub_key, ed25519.Ed25519PublicKey):
            result.algorithm_family = "ed25519"
            result.certificate_key_length = 256
            result.certificate_algorithm = "ED25519"
        elif isinstance(pub_key, ed448.Ed448PublicKey):
            result.algorithm_family = "ed25519"
            result.certificate_key_length = 448
            result.certificate_algorithm = "ED448"

        # Signature algorithm
        result.signature_algorithm = cert.signature_algorithm_oid._name

        # Certificate metadata
        result.certificate_serial = str(cert.serial_number)
        result.certificate_expiry = cert.not_valid_after_utc

        # Issuer
        try:
            issuer_cn = cert.issuer.get_attributes_for_oid(NameOID.COMMON_NAME)
            result.certificate_issuer = issuer_cn[0].value if issuer_cn else None
        except Exception:
            pass

        # Subject
        try:
            subject_cn = cert.subject.get_attributes_for_oid(NameOID.COMMON_NAME)
            result.certificate_subject = subject_cn[0].value if subject_cn else None
        except Exception:
            pass

    def _assess_risk(self, result: TLSScanResult):
        """Compute crypto weakness score and risk flags."""
        flags = []

        # Weakness score lookup
        algo_key = result.certificate_algorithm or "unknown"
        result.crypto_weakness_score = CRYPTO_WEAKNESS_MAP.get(algo_key, 0.5)

        # Risk flags
        if result.certificate_algorithm and "RSA" in result.certificate_algorithm:
            kl = result.certificate_key_length or 0
            if kl <= 2048:
                flags.append("quantum_vulnerable")
            if kl <= 1024:
                flags.append("weak_key")

        if result.certificate_algorithm and "ECC" in result.certificate_algorithm:
            flags.append("quantum_vulnerable")

        if result.certificate_algorithm and "DSA" in result.certificate_algorithm:
            flags.append("quantum_vulnerable")

        if not result.forward_secrecy:
            flags.append("no_forward_secrecy")

        if result.tls_version and result.tls_version in ("TLSv1", "TLSv1.0", "TLSv1.1"):
            flags.append("deprecated_protocol")

        if result.certificate_expiry and result.certificate_expiry < datetime.utcnow():
            flags.append("expired_cert")

        # Check for PQC readiness
        if result.certificate_algorithm and any(
            pqc in result.certificate_algorithm.upper()
            for pqc in ["KYBER", "DILITHIUM", "SPHINCS"]
        ):
            flags.append("pqc_ready")

        result.risk_flags = flags

    async def scan_batch(self, domains: List[str], port: int = 443) -> List[TLSScanResult]:
        """Scan multiple domains concurrently."""
        tasks = [self.scan_domain(domain, port) for domain in domains]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        final_results = []
        for domain, result in zip(domains, results):
            if isinstance(result, Exception):
                final_results.append(TLSScanResult(
                    domain=domain, port=port, error=str(result)
                ))
            else:
                final_results.append(result)

        return final_results
