"""QuantumShield — HNDL Risk Scoring Engine

Computes Harvest-Now-Decrypt-Later risk scores using multi-factor analysis:
Risk = DataSensitivity × DataLongevity × CryptoWeakness × ExposureSurface × AdversaryValue
"""

import structlog
from typing import Optional, Dict
from dataclasses import dataclass

logger = structlog.get_logger(__name__)


# ── Crypto Weakness Lookup ──
CRYPTO_WEAKNESS: Dict[str, float] = {
    "RSA-1024": 1.0,
    "RSA-2048": 0.8,
    "RSA-3072": 0.6,
    "RSA-4096": 0.5,
    "ECC-P256": 0.7,
    "ECC-P384": 0.5,
    "ECC-P521": 0.4,
    "ECC-256": 0.7,
    "DSA-1024": 1.0,
    "DSA-2048": 0.8,
    "ED25519": 0.6,
    "AES-128": 0.3,
    "AES-256": 0.2,
    "AES-256-GCM": 0.2,
    "CHACHA20": 0.2,
    "3DES": 0.95,
    "DES": 1.0,
    "KYBER-512": 0.1,
    "KYBER-768": 0.05,
    "KYBER-1024": 0.03,
    "DILITHIUM-2": 0.05,
    "DILITHIUM-3": 0.03,
    "HMAC-SHA256": 0.15,
}

# ── Exposure Surface Scoring ──
EXPOSURE_SCORES: Dict[str, float] = {
    "internet": 1.0,
    "hybrid": 0.7,
    "internal": 0.4,
    "offline": 0.2,
    "air_gapped": 0.05,
}

# ── Sensitivity Tier Scoring ──
SENSITIVITY_SCORES: Dict[str, float] = {
    "critical": 1.0,
    "high": 0.8,
    "medium": 0.5,
    "low": 0.2,
}


@dataclass
class RiskComponents:
    """Individual risk factor components."""
    data_sensitivity: float = 0.0
    data_longevity: float = 0.0
    crypto_weakness: float = 0.0
    exposure_surface: float = 0.0
    adversary_value: float = 0.0


@dataclass
class RiskResult:
    """Complete risk computation result."""
    score: float = 0.0
    severity: str = "info"
    components: RiskComponents = None
    estimated_break_year_low: Optional[int] = None
    estimated_break_year_high: Optional[int] = None
    data_secrecy_expiry_year: Optional[int] = None
    hndl_window_years: Optional[float] = None

    def __post_init__(self):
        if self.components is None:
            self.components = RiskComponents()


class RiskEngine:
    """HNDL Risk scoring engine."""

    def __init__(self, model_version: str = "1.0"):
        self.model_version = model_version

    def compute_risk(
        self,
        algorithm: Optional[str] = None,
        key_length: Optional[int] = None,
        sensitivity: str = "medium",
        exposure_surface: str = "internal",
        required_secrecy_years: int = 10,
        data_year: int = 2025,
        adversary_type: str = "nation_state",
    ) -> RiskResult:
        """
        Compute HNDL risk score for an asset.

        Score = DataSensitivity × DataLongevity × CryptoWeakness × ExposureSurface × AdversaryValue
        Normalized to 0–10 scale.
        """
        result = RiskResult()
        components = RiskComponents()

        # 1. Data Sensitivity (0–1)
        components.data_sensitivity = SENSITIVITY_SCORES.get(sensitivity.lower(), 0.5)

        # 2. Data Longevity (normalized 0–1, based on years remaining)
        data_expiry_year = data_year + required_secrecy_years
        result.data_secrecy_expiry_year = data_expiry_year
        components.data_longevity = min(required_secrecy_years / 50.0, 1.0)

        # 3. Crypto Weakness (0–1)
        algo_key = algorithm.upper() if algorithm else "UNKNOWN"
        if key_length and "RSA" in algo_key:
            algo_key = f"RSA-{key_length}"
        elif key_length and "ECC" in algo_key:
            algo_key = f"ECC-P{key_length}"
        components.crypto_weakness = CRYPTO_WEAKNESS.get(algo_key, 0.5)

        # 4. Exposure Surface (0–1)
        components.exposure_surface = EXPOSURE_SCORES.get(exposure_surface.lower(), 0.4)

        # 5. Adversary Value (0–1)
        adversary_values = {
            "nation_state": 1.0,
            "criminal": 0.7,
            "competitor": 0.5,
            "academic": 0.3,
            "unknown": 0.5,
        }
        components.adversary_value = adversary_values.get(adversary_type.lower(), 0.5)

        # Compute raw score (product of factors)
        raw_score = (
            components.data_sensitivity
            * components.data_longevity
            * components.crypto_weakness
            * components.exposure_surface
            * components.adversary_value
        )

        # Normalize to 0–10 (the max product is 1.0, so scale by 10)
        # Apply a power curve to spread the distribution
        normalized = min(raw_score ** 0.4 * 10, 10.0)

        result.score = round(normalized, 1)
        result.components = components
        result.severity = self._severity_from_score(result.score)

        # Quantum break timeline
        break_years = self._estimate_break_year(algo_key)
        result.estimated_break_year_low = break_years[0]
        result.estimated_break_year_high = break_years[1]

        # HNDL window
        if result.estimated_break_year_low and result.data_secrecy_expiry_year:
            result.hndl_window_years = max(
                0, result.data_secrecy_expiry_year - result.estimated_break_year_low
            )

        logger.info(
            "risk_computed",
            algorithm=algorithm,
            score=result.score,
            severity=result.severity,
        )

        return result

    def _severity_from_score(self, score: float) -> str:
        """Map numeric score to severity label."""
        if score >= 8.0:
            return "critical"
        elif score >= 6.0:
            return "high"
        elif score >= 4.0:
            return "medium"
        elif score >= 2.0:
            return "low"
        return "info"

    def _estimate_break_year(self, algorithm: str) -> tuple:
        """Estimate quantum break timeline for a given algorithm."""
        QUANTUM_BREAK_ESTIMATES = {
            "RSA-1024": (2028, 2033),
            "RSA-2048": (2033, 2040),
            "RSA-3072": (2036, 2045),
            "RSA-4096": (2038, 2048),
            "ECC-P256": (2033, 2040),
            "ECC-P384": (2035, 2043),
            "ECC-P521": (2037, 2045),
            "DSA-1024": (2028, 2033),
            "DSA-2048": (2033, 2040),
            "ED25519": (2035, 2043),
            "AES-128": (2050, 2070),
            "AES-256": (2060, 2080),
        }
        return QUANTUM_BREAK_ESTIMATES.get(algorithm, (2040, 2060))
