"""QuantumShield — Source Code Crypto Detection Engine

Identifies cryptographic primitives embedded in application source code
using regex patterns, with extensibility for AST parsing and Semgrep rules.
"""

import re
import structlog
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple

logger = structlog.get_logger(__name__)


@dataclass
class CryptoDetection:
    """A single cryptographic usage detection in source code."""
    file_path: str
    line_number: int
    algorithm: str
    algorithm_family: str
    purpose: Optional[str] = None
    key_length: Optional[int] = None
    risk_flag: Optional[str] = None
    confidence: float = 0.5
    detection_method: str = "regex"
    matched_pattern: str = ""
    context_snippet: str = ""


# ── Detection Patterns ──
# Pattern → (algorithm, family, purpose, default_key_length, risk_flag, confidence)
CRYPTO_PATTERNS: List[Tuple[str, str, str, Optional[str], Optional[int], Optional[str], float]] = [
    # RSA
    (r"RSA_generate_key\s*\(", "RSA", "rsa", "key_generation", 2048, "quantum_vulnerable", 0.9),
    (r"rsa\.GenerateKey\s*\(", "RSA", "rsa", "key_generation", 2048, "quantum_vulnerable", 0.9),
    (r"crypto/rsa", "RSA", "rsa", "import", None, "quantum_vulnerable", 0.8),
    (r"RSA\.new\s*\(", "RSA", "rsa", "key_generation", 2048, "quantum_vulnerable", 0.85),
    (r"RSASSA-PKCS1", "RSA-PKCS1", "rsa", "signature", 2048, "quantum_vulnerable", 0.85),
    (r"RSA-OAEP", "RSA-OAEP", "rsa", "encryption", 2048, "quantum_vulnerable", 0.85),

    # ECDSA / ECC
    (r"ECDSA_sign", "ECDSA", "ecc", "signature", 256, "quantum_vulnerable", 0.9),
    (r"ec\.GenerateKey\s*\(", "ECC", "ecc", "key_generation", 256, "quantum_vulnerable", 0.85),
    (r"crypto/ecdsa", "ECDSA", "ecc", "import", 256, "quantum_vulnerable", 0.8),
    (r"EC_KEY_new_by_curve_name", "ECC", "ecc", "key_generation", 256, "quantum_vulnerable", 0.9),
    (r"secp256k1|secp384r1|secp521r1|prime256v1", "ECC", "ecc", "curve", 256, "quantum_vulnerable", 0.85),

    # Diffie-Hellman
    (r"DiffieHellman|DH_generate", "DH", "dh", "key_exchange", 2048, "quantum_vulnerable", 0.85),
    (r"crypto/dh|ECDH_compute_key", "ECDH", "dh", "key_exchange", 256, "quantum_vulnerable", 0.85),

    # AES
    (r"AES\.new\s*\(|aes\.NewCipher", "AES", "aes", "encryption", 256, None, 0.85),
    (r"AES-256-GCM|AES-256-CBC", "AES-256", "aes", "encryption", 256, None, 0.9),
    (r"AES-128-GCM|AES-128-CBC", "AES-128", "aes", "encryption", 128, None, 0.9),
    (r"javax\.crypto\.Cipher", "AES/Generic", "aes", "encryption", None, None, 0.6),

    # DES / 3DES (weak)
    (r"DES\.new|DES3\.new|DES_ede3", "3DES", "3des", "encryption", 168, "weak_key", 0.9),
    (r"DES_ecb_encrypt|DES_cbc_encrypt", "DES", "des", "encryption", 56, "weak_key", 0.95),

    # ChaCha20
    (r"ChaCha20|chacha20poly1305", "ChaCha20", "chacha20", "encryption", 256, None, 0.85),

    # SHA / MD5 (hashing)
    (r"MD5\s*\(|md5\.New|hashlib\.md5", "MD5", "md5", "hashing", None, "weak_hash", 0.9),
    (r"SHA-1|sha1\.New|hashlib\.sha1", "SHA-1", "sha", "hashing", None, "weak_hash", 0.85),
    (r"SHA-256|sha256\.New|hashlib\.sha256", "SHA-256", "sha", "hashing", None, None, 0.85),

    # HMAC
    (r"HMAC\s*\(|hmac\.New|crypto/hmac", "HMAC", "hmac", "mac", None, None, 0.8),

    # JWT
    (r"jwt\.sign|jwt\.encode|jsonwebtoken\.sign", "JWT-Signing", "rsa", "jwt", None, "quantum_vulnerable", 0.7),
    (r"RS256|RS384|RS512", "RSA-JWT", "rsa", "jwt_signature", 2048, "quantum_vulnerable", 0.85),
    (r"ES256|ES384|ES512", "ECC-JWT", "ecc", "jwt_signature", 256, "quantum_vulnerable", 0.85),

    # SSH
    (r"ssh-keygen|ssh-rsa|ssh-ed25519", "SSH", "rsa", "ssh_key", 2048, "quantum_vulnerable", 0.7),
    (r"crypto/ssh|golang\.org/x/crypto/ssh", "SSH-lib", "rsa", "ssh", None, "quantum_vulnerable", 0.75),

    # Post-Quantum
    (r"kyber|CRYSTALS-Kyber|pqc\.kyber", "Kyber", "kyber", "key_exchange", 768, "pqc_ready", 0.9),
    (r"dilithium|CRYSTALS-Dilithium", "Dilithium", "dilithium", "signature", None, "pqc_ready", 0.9),
    (r"sphincs|SPHINCS\+", "SPHINCS+", "sphincs", "signature", None, "pqc_ready", 0.9),

    # TLS config
    (r"TLSv1\.0|TLSv1\.1|ssl\.PROTOCOL_TLSv1", "TLS-Legacy", "unknown", "protocol", None, "deprecated_protocol", 0.9),
    (r"tls\.Config|ssl_context|SSLContext", "TLS-Config", "unknown", "tls_config", None, None, 0.5),
]


class CryptoDetectionEngine:
    """Scans source code files for cryptographic primitive usage."""

    def __init__(self):
        self.compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), algo, family, purpose, key_len, flag, conf)
            for pattern, algo, family, purpose, key_len, flag, conf in CRYPTO_PATTERNS
        ]

    def scan_file_content(self, file_path: str, content: str) -> List[CryptoDetection]:
        """Scan file content for cryptographic patterns."""
        detections: List[CryptoDetection] = []
        lines = content.split("\n")

        for line_num, line in enumerate(lines, start=1):
            stripped = line.strip()

            # Skip comments and empty lines
            if not stripped or stripped.startswith("//") or stripped.startswith("#"):
                continue

            for compiled, algo, family, purpose, key_len, flag, confidence in self.compiled_patterns:
                match = compiled.search(line)
                if match:
                    # Get context (surrounding lines)
                    start = max(0, line_num - 3)
                    end = min(len(lines), line_num + 2)
                    context = "\n".join(lines[start:end])

                    detection = CryptoDetection(
                        file_path=file_path,
                        line_number=line_num,
                        algorithm=algo,
                        algorithm_family=family,
                        purpose=purpose,
                        key_length=key_len,
                        risk_flag=flag,
                        confidence=confidence,
                        detection_method="regex",
                        matched_pattern=compiled.pattern,
                        context_snippet=context[:500],
                    )
                    detections.append(detection)

        logger.info(
            "crypto_scan_file",
            file=file_path,
            detections=len(detections),
        )
        return detections

    def scan_files(self, files: Dict[str, str]) -> List[CryptoDetection]:
        """Scan multiple files. files = {path: content}."""
        all_detections: List[CryptoDetection] = []
        for path, content in files.items():
            detections = self.scan_file_content(path, content)
            all_detections.extend(detections)

        logger.info(
            "crypto_scan_batch",
            total_files=len(files),
            total_detections=len(all_detections),
        )
        return all_detections
