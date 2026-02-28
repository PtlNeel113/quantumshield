"""QuantumShield — Post-Quantum Migration Advisor

Provides recommendations for replacing legacy cryptography with
quantum-safe alternatives based on NIST PQC standards.
"""

from typing import Optional, Dict, Tuple
from dataclasses import dataclass
from app.models.migration import MigrationComplexity

# ── NIST PQC Mapping Reference ──
# Current -> (Recommended, Recommended Key Length, Standard, Complexity, Risk Reduction, Effort Hours)
MIGRATION_MAPPINGS: Dict[str, Tuple[str, int, str, MigrationComplexity, float, int]] = {
    "RSA-1024": ("ML-KEM-768", 0, "FIPS 203", MigrationComplexity.HIGH, 0.95, 40),
    "RSA-2048": ("ML-KEM-768", 0, "FIPS 203", MigrationComplexity.MEDIUM, 0.8, 24),
    "RSA-3072": ("ML-KEM-1024", 0, "FIPS 203", MigrationComplexity.MEDIUM, 0.6, 24),
    "RSA-4096": ("ML-KEM-1024", 0, "FIPS 203", MigrationComplexity.MEDIUM, 0.5, 24),
    
    "ECC-P256": ("ML-KEM-512", 0, "FIPS 203", MigrationComplexity.MEDIUM, 0.7, 20),
    "ECC-P384": ("ML-KEM-768", 0, "FIPS 203", MigrationComplexity.MEDIUM, 0.5, 20),
    
    "DSA-1024": ("ML-DSA-65", 0, "FIPS 204", MigrationComplexity.HIGH, 0.95, 30),
    "DSA-2048": ("ML-DSA-65", 0, "FIPS 204", MigrationComplexity.MEDIUM, 0.8, 20),
    
    "ED25519": ("ML-DSA-44", 0, "FIPS 204", MigrationComplexity.MEDIUM, 0.6, 16),
    "AES-128": ("AES-256", 256, "NIST SP 800-38A", MigrationComplexity.LOW, 0.3, 8),
}

@dataclass
class MigrationRecommendation:
    current_crypto: str
    recommended_crypto: str
    recommended_key_length: int
    migration_standard: str
    complexity: MigrationComplexity
    risk_reduction: float
    estimated_effort_hours: int
    rationale: str
    priority: int = 5


class MigrationAdvisor:
    """Generates migration recommendations for post-quantum readiness."""

    def generate_advice(
        self,
        algorithm: str,
        asset_type: str = "api",
        exposure_surface: str = "internet",
        sensitivity: str = "high",
        key_length: Optional[int] = None,
    ) -> Optional[MigrationRecommendation]:
        """Generate migration advice based on current algorithm and asset context."""
        
        algo_key = algorithm.upper()
        if key_length and "RSA" in algo_key:
            algo_key = f"RSA-{key_length}"
        elif key_length and "ECC" in algo_key:
            algo_key = f"ECC-P{key_length}"
            
        mapping = MIGRATION_MAPPINGS.get(algo_key)
        
        # Determine fallback if exact match not found
        if not mapping:
            if "RSA" in algo_key:
                mapping = MIGRATION_MAPPINGS["RSA-2048"]
            elif "ECC" in algo_key or "ECDSA" in algo_key:
                mapping = MIGRATION_MAPPINGS["ECC-P256"]
            elif "AES" in algo_key and key_length == 128:
                mapping = MIGRATION_MAPPINGS["AES-128"]
            else:
                return None  # No recommendation available

        recommended, rec_length, standard, complexity, risk_reduction, effort = mapping
        
        # Adjust complexity/effort based on asset type
        efforts = effort
        if asset_type in ["database", "storage"]:
            efforts = int(effort * 1.5)  # Data migration is harder
            if complexity == MigrationComplexity.MEDIUM:
                complexity = MigrationComplexity.HIGH
        elif asset_type == "repository":
            efforts = int(effort * 0.5)  # Code updates are easier
            complexity = MigrationComplexity.LOW
            
        # Priority mapping (1=highest, 5=lowest)
        priority = 3
        if exposure_surface == "internet" and sensitivity in ["critical", "high"]:
            priority = 1
        elif sensitivity == "critical":
            priority = 2
            
        rationale = (
            f"Migrate from {algo_key} to {recommended} ({standard}) to mitigate Harvest-Now-Decrypt-Later "
            f"risks for {sensitivity} sensitivity data."
        )

        return MigrationRecommendation(
            current_crypto=algo_key,
            recommended_crypto=recommended,
            recommended_key_length=rec_length or 0,
            migration_standard=standard,
            complexity=complexity,
            risk_reduction=risk_reduction,
            estimated_effort_hours=efforts,
            rationale=rationale,
            priority=priority,
        )
