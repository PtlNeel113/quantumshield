"""QuantumShield — Data Lifespan Intelligence Engine

Estimates how long data must remain confidential based on
retention policies, compliance frameworks, and schema analysis.
"""

import re
import structlog
from typing import Optional, List, Dict
from dataclasses import dataclass

logger = structlog.get_logger(__name__)


# ── Field-to-Data-Type Inference Rules ──
FIELD_INFERENCE_RULES: List[Dict] = [
    {"patterns": [r"ssn", r"social_security", r"sin_number"], "data_type": "pii", "secrecy_years": 50, "sensitivity": 0.95},
    {"patterns": [r"passport", r"passport_no", r"passport_number"], "data_type": "pii", "secrecy_years": 50, "sensitivity": 0.9},
    {"patterns": [r"medical", r"diagnosis", r"icd_code", r"health_record", r"patient"], "data_type": "phi", "secrecy_years": 70, "sensitivity": 0.95},
    {"patterns": [r"prescription", r"medication", r"treatment"], "data_type": "phi", "secrecy_years": 70, "sensitivity": 0.9},
    {"patterns": [r"credit_card", r"card_number", r"ccn", r"pan"], "data_type": "pci", "secrecy_years": 15, "sensitivity": 0.85},
    {"patterns": [r"cvv", r"card_expiry", r"cardholder"], "data_type": "pci", "secrecy_years": 15, "sensitivity": 0.8},
    {"patterns": [r"biometric", r"fingerprint", r"face_id", r"retina", r"iris"], "data_type": "biometric", "secrecy_years": 100, "sensitivity": 1.0},
    {"patterns": [r"email", r"email_address", r"contact_email"], "data_type": "pii", "secrecy_years": 25, "sensitivity": 0.6},
    {"patterns": [r"phone", r"mobile", r"telephone", r"cell_number"], "data_type": "pii", "secrecy_years": 20, "sensitivity": 0.5},
    {"patterns": [r"address", r"home_address", r"street", r"zip_code", r"postal"], "data_type": "pii", "secrecy_years": 25, "sensitivity": 0.55},
    {"patterns": [r"dob", r"date_of_birth", r"birthday"], "data_type": "pii", "secrecy_years": 50, "sensitivity": 0.7},
    {"patterns": [r"salary", r"income", r"compensation", r"bank_account", r"iban"], "data_type": "financial", "secrecy_years": 30, "sensitivity": 0.8},
    {"patterns": [r"trade_secret", r"proprietary", r"confidential_formula"], "data_type": "trade_secret", "secrecy_years": 100, "sensitivity": 1.0},
    {"patterns": [r"password", r"secret_key", r"api_key", r"auth_token"], "data_type": "pii", "secrecy_years": 5, "sensitivity": 0.9},
    {"patterns": [r"log_entry", r"audit_log", r"access_log", r"event_log"], "data_type": "log", "secrecy_years": 1, "sensitivity": 0.1},
    {"patterns": [r"telemetry", r"metric", r"perf_counter"], "data_type": "telemetry", "secrecy_years": 1, "sensitivity": 0.05},
    {"patterns": [r"classified", r"top_secret", r"secret_level"], "data_type": "classified", "secrecy_years": 75, "sensitivity": 1.0},
]

# ── Compliance Framework Retention Requirements ──
COMPLIANCE_RETENTION: Dict[str, Dict[str, int]] = {
    "gdpr": {"pii": 25, "phi": 70, "default": 7},
    "hipaa": {"phi": 70, "pii": 50, "default": 6},
    "pci_dss": {"pci": 15, "default": 1},
    "sox": {"financial": 30, "default": 7},
    "nist": {"classified": 75, "default": 10},
    "iso_27001": {"default": 10},
    "fedramp": {"classified": 75, "pii": 50, "default": 7},
    "ccpa": {"pii": 25, "default": 5},
}


@dataclass
class DataClassificationResult:
    """Result of data lifespan classification."""
    data_type: str = "general"
    sensitivity_score: float = 0.0
    required_secrecy_years: int = 10
    confidence: float = 0.5
    compliance_frameworks: List[str] = None
    detected_fields: List[str] = None
    inference_rules: List[str] = None
    retention_policy: Optional[str] = None

    def __post_init__(self):
        if self.compliance_frameworks is None:
            self.compliance_frameworks = []
        if self.detected_fields is None:
            self.detected_fields = []
        if self.inference_rules is None:
            self.inference_rules = []


class DataLifespanEngine:
    """Classifies data sensitivity and estimates required secrecy lifetime."""

    def classify_from_fields(
        self,
        field_names: List[str],
        compliance_frameworks: Optional[List[str]] = None,
        retention_policy: Optional[str] = None,
    ) -> DataClassificationResult:
        """
        Classify data based on detected field names and compliance context.
        Returns the highest-sensitivity classification found.
        """
        result = DataClassificationResult(retention_policy=retention_policy)
        best_sensitivity = 0.0
        best_secrecy_years = 0
        detected_types = set()
        detected_fields_matched = []
        rules_matched = []

        for field_name in field_names:
            field_lower = field_name.lower().strip()

            for rule in FIELD_INFERENCE_RULES:
                for pattern in rule["patterns"]:
                    if re.search(pattern, field_lower):
                        detected_types.add(rule["data_type"])
                        detected_fields_matched.append(field_name)
                        rules_matched.append(f"{field_name} → {rule['data_type']} ({rule['secrecy_years']}y)")

                        if rule["sensitivity"] > best_sensitivity:
                            best_sensitivity = rule["sensitivity"]
                            result.data_type = rule["data_type"]

                        if rule["secrecy_years"] > best_secrecy_years:
                            best_secrecy_years = rule["secrecy_years"]

                        break  # Only match first pattern per field

        result.sensitivity_score = best_sensitivity
        result.required_secrecy_years = best_secrecy_years if best_secrecy_years > 0 else 10
        result.detected_fields = detected_fields_matched
        result.inference_rules = rules_matched
        result.confidence = min(0.5 + (len(detected_fields_matched) * 0.1), 0.95)

        # Apply compliance framework overrides (use maximum)
        if compliance_frameworks:
            result.compliance_frameworks = compliance_frameworks
            for framework in compliance_frameworks:
                fw_rules = COMPLIANCE_RETENTION.get(framework.lower(), {})
                fw_years = fw_rules.get(result.data_type, fw_rules.get("default", 0))
                if fw_years > result.required_secrecy_years:
                    result.required_secrecy_years = fw_years

        logger.info(
            "data_classified",
            data_type=result.data_type,
            sensitivity=result.sensitivity_score,
            secrecy_years=result.required_secrecy_years,
            fields_matched=len(detected_fields_matched),
        )

        return result

    def estimate_from_asset_type(self, asset_type: str) -> DataClassificationResult:
        """Estimate data classification from asset type as a fallback."""
        ASSET_TYPE_DEFAULTS = {
            "database": DataClassificationResult(data_type="pii", sensitivity_score=0.7, required_secrecy_years=25, confidence=0.3),
            "backup": DataClassificationResult(data_type="general", sensitivity_score=0.6, required_secrecy_years=20, confidence=0.3),
            "storage": DataClassificationResult(data_type="general", sensitivity_score=0.5, required_secrecy_years=15, confidence=0.2),
            "bucket": DataClassificationResult(data_type="general", sensitivity_score=0.4, required_secrecy_years=10, confidence=0.2),
            "api": DataClassificationResult(data_type="general", sensitivity_score=0.3, required_secrecy_years=5, confidence=0.2),
            "certificate": DataClassificationResult(data_type="pii", sensitivity_score=0.5, required_secrecy_years=5, confidence=0.3),
            "repository": DataClassificationResult(data_type="ip", sensitivity_score=0.6, required_secrecy_years=30, confidence=0.3),
        }
        return ASSET_TYPE_DEFAULTS.get(
            asset_type.lower(),
            DataClassificationResult(data_type="general", sensitivity_score=0.3, required_secrecy_years=10, confidence=0.15),
        )
