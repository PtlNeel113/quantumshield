"""QuantumShield — Agent Tools Registry

Defines all 10 tools available to the AI agent for security analysis.
Each tool is self-contained with mock data fallbacks for demo mode.
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class ToolResult:
    """Standardized result from any agent tool."""
    tool_name: str
    success: bool
    data: Any = None
    error: Optional[str] = None
    execution_time_ms: float = 0.0
    metadata: Dict = field(default_factory=dict)


# ══════════════════════════════════════════════
# MOCK DATA — Realistic demo dataset
# ══════════════════════════════════════════════

MOCK_ASSETS = [
    {
        "id": "asset-hc-archive-001",
        "name": "Healthcare Patient Archive",
        "type": "database",
        "environment": "production",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "critical",
        "exposure_surface": "hybrid",
        "quantum_risk_score": 9.4,
        "owner": "Healthcare BU",
        "location": "us-east-1",
        "data_type": "phi",
        "required_secrecy_years": 70,
        "last_scanned": "2026-02-27T10:23:15Z",
        "tags": {"compliance": ["hipaa", "gdpr"], "tier": "platinum"},
    },
    {
        "id": "asset-idp-backup-002",
        "name": "Identity Provider Backups",
        "type": "backup",
        "environment": "disaster_recovery",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "critical",
        "exposure_surface": "internal",
        "quantum_risk_score": 8.9,
        "owner": "IAM Team",
        "location": "us-west-2",
        "data_type": "pii",
        "required_secrecy_years": 50,
        "last_scanned": "2026-02-26T08:12:00Z",
        "tags": {"compliance": ["sox", "gdpr"], "tier": "gold"},
    },
    {
        "id": "asset-fin-datalake-003",
        "name": "Finance Data Lake",
        "type": "storage",
        "environment": "production",
        "algorithm": "AES-128",
        "key_length": 128,
        "sensitivity": "high",
        "exposure_surface": "internal",
        "quantum_risk_score": 8.1,
        "owner": "Finance Team",
        "location": "eu-west-1",
        "data_type": "financial",
        "required_secrecy_years": 30,
        "last_scanned": "2026-02-25T14:00:00Z",
        "tags": {"compliance": ["sox", "pci_dss"], "tier": "gold"},
    },
    {
        "id": "asset-api-gateway-004",
        "name": "Public API Gateway",
        "type": "api",
        "environment": "production",
        "algorithm": "ECC-P256",
        "key_length": 256,
        "sensitivity": "high",
        "exposure_surface": "internet",
        "quantum_risk_score": 7.8,
        "owner": "Platform Team",
        "location": "us-east-1",
        "data_type": "general",
        "required_secrecy_years": 10,
        "last_scanned": "2026-02-28T06:00:00Z",
        "tags": {"compliance": [], "tier": "gold"},
    },
    {
        "id": "asset-k8s-secrets-005",
        "name": "Kubernetes Secrets Store",
        "type": "service",
        "environment": "production",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "critical",
        "exposure_surface": "internal",
        "quantum_risk_score": 7.5,
        "owner": "DevOps",
        "location": "us-east-1",
        "data_type": "pii",
        "required_secrecy_years": 15,
        "last_scanned": "2026-02-28T02:00:00Z",
        "tags": {"compliance": ["nist"], "tier": "silver"},
    },
    {
        "id": "asset-tls-lb-006",
        "name": "Production Load Balancer",
        "type": "load_balancer",
        "environment": "production",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "medium",
        "exposure_surface": "internet",
        "quantum_risk_score": 7.2,
        "owner": "Network Team",
        "location": "us-east-1",
        "data_type": "general",
        "required_secrecy_years": 5,
        "last_scanned": "2026-02-28T08:00:00Z",
        "tags": {"compliance": [], "tier": "silver"},
    },
    {
        "id": "asset-repo-core-007",
        "name": "Core Platform Repository",
        "type": "repository",
        "environment": "production",
        "algorithm": "ED25519",
        "key_length": 256,
        "sensitivity": "high",
        "exposure_surface": "internal",
        "quantum_risk_score": 6.4,
        "owner": "Engineering",
        "location": "github",
        "data_type": "ip",
        "required_secrecy_years": 30,
        "last_scanned": "2026-02-27T18:00:00Z",
        "tags": {"compliance": [], "tier": "silver"},
    },
    {
        "id": "asset-cert-wildcard-008",
        "name": "Wildcard TLS Certificate",
        "type": "certificate",
        "environment": "production",
        "algorithm": "ECC-P256",
        "key_length": 256,
        "sensitivity": "high",
        "exposure_surface": "internet",
        "quantum_risk_score": 7.6,
        "owner": "Security Team",
        "location": "us-east-1",
        "data_type": "general",
        "required_secrecy_years": 3,
        "last_scanned": "2026-02-28T08:30:00Z",
        "tags": {"compliance": ["nist"], "tier": "gold"},
    },
    {
        "id": "asset-bio-vault-009",
        "name": "Biometric Authentication Vault",
        "type": "database",
        "environment": "production",
        "algorithm": "RSA-4096",
        "key_length": 4096,
        "sensitivity": "critical",
        "exposure_surface": "air_gapped",
        "quantum_risk_score": 6.8,
        "owner": "Identity Team",
        "location": "us-gov-east-1",
        "data_type": "biometric",
        "required_secrecy_years": 100,
        "last_scanned": "2026-02-20T12:00:00Z",
        "tags": {"compliance": ["fedramp", "nist"], "tier": "platinum"},
    },
    {
        "id": "asset-cache-redis-010",
        "name": "Session Cache Cluster",
        "type": "cache",
        "environment": "production",
        "algorithm": "AES-256",
        "key_length": 256,
        "sensitivity": "low",
        "exposure_surface": "internal",
        "quantum_risk_score": 2.3,
        "owner": "Platform Team",
        "location": "us-east-1",
        "data_type": "telemetry",
        "required_secrecy_years": 1,
        "last_scanned": "2026-02-28T09:00:00Z",
        "tags": {"compliance": [], "tier": "bronze"},
    },
    {
        "id": "asset-vpn-gateway-011",
        "name": "Corporate VPN Gateway",
        "type": "service",
        "environment": "production",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "high",
        "exposure_surface": "internet",
        "quantum_risk_score": 8.3,
        "owner": "Network Team",
        "location": "us-east-1",
        "data_type": "general",
        "required_secrecy_years": 15,
        "last_scanned": "2026-02-27T14:00:00Z",
        "tags": {"compliance": ["nist"], "tier": "gold"},
    },
    {
        "id": "asset-email-server-012",
        "name": "Enterprise Email Gateway",
        "type": "service",
        "environment": "production",
        "algorithm": "RSA-2048",
        "key_length": 2048,
        "sensitivity": "high",
        "exposure_surface": "internet",
        "quantum_risk_score": 7.9,
        "owner": "IT Ops",
        "location": "us-east-1",
        "data_type": "pii",
        "required_secrecy_years": 25,
        "last_scanned": "2026-02-26T18:00:00Z",
        "tags": {"compliance": ["gdpr"], "tier": "gold"},
    },
]

CRYPTO_FINDINGS = [
    {"algorithm": "RSA-2048", "family": "rsa", "count": 3247, "risk_flag": "quantum_vulnerable", "assets_affected": 847},
    {"algorithm": "ECC-P256", "family": "ecc", "count": 1893, "risk_flag": "quantum_vulnerable", "assets_affected": 523},
    {"algorithm": "RSA-4096", "family": "rsa", "count": 456, "risk_flag": "quantum_vulnerable", "assets_affected": 112},
    {"algorithm": "AES-256", "family": "aes", "count": 8921, "risk_flag": None, "assets_affected": 3214},
    {"algorithm": "AES-128", "family": "aes", "count": 2341, "risk_flag": "grover_weakened", "assets_affected": 891},
    {"algorithm": "ED25519", "family": "ecc", "count": 734, "risk_flag": "quantum_vulnerable", "assets_affected": 286},
    {"algorithm": "3DES", "family": "3des", "count": 89, "risk_flag": "weak_key", "assets_affected": 34},
    {"algorithm": "RSA-1024", "family": "rsa", "count": 127, "risk_flag": "critical_weak", "assets_affected": 52},
    {"algorithm": "SHA-1", "family": "sha", "count": 456, "risk_flag": "weak_hash", "assets_affected": 187},
    {"algorithm": "KYBER-768", "family": "kyber", "count": 23, "risk_flag": "pqc_ready", "assets_affected": 12},
]

QUANTUM_TIMELINE = {
    "RSA-1024": {"break_window": [2028, 2033], "status": "imminent", "confidence": 0.85},
    "RSA-2048": {"break_window": [2033, 2040], "status": "approaching", "confidence": 0.75},
    "RSA-3072": {"break_window": [2036, 2045], "status": "future", "confidence": 0.65},
    "RSA-4096": {"break_window": [2038, 2048], "status": "future", "confidence": 0.60},
    "ECC-P256": {"break_window": [2033, 2040], "status": "approaching", "confidence": 0.75},
    "ECC-P384": {"break_window": [2035, 2043], "status": "future", "confidence": 0.65},
    "ED25519": {"break_window": [2035, 2043], "status": "future", "confidence": 0.65},
    "AES-128": {"break_window": [2050, 2070], "status": "distant", "confidence": 0.50},
    "AES-256": {"break_window": [2060, 2080], "status": "safe", "confidence": 0.45},
    "3DES": {"break_window": [2025, 2028], "status": "critical", "confidence": 0.95},
}

GRAPH_DATA = {
    "asset-hc-archive-001": {
        "node": {"id": "asset-hc-archive-001", "name": "Healthcare Patient Archive", "type": "database"},
        "edges": [
            {"target": "asset-idp-backup-002", "relation": "AUTHENTICATES_WITH", "target_name": "Identity Provider Backups"},
            {"target": "asset-k8s-secrets-005", "relation": "DEPENDS_ON", "target_name": "Kubernetes Secrets Store"},
            {"target": "backup-hc-daily", "relation": "BACKS_UP_TO", "target_name": "Healthcare Daily Backup"},
            {"target": "asset-api-gateway-004", "relation": "CONNECTS_TO", "target_name": "Public API Gateway"},
        ],
        "upstream": [
            {"source": "asset-email-server-012", "relation": "CONNECTS_TO", "source_name": "Enterprise Email Gateway"},
            {"source": "asset-vpn-gateway-011", "relation": "CONNECTS_TO", "source_name": "Corporate VPN Gateway"},
        ],
        "blast_radius": 8,
        "risk_propagation": "high",
    },
}


MIGRATION_RECOMMENDATIONS = {
    "RSA-2048": {
        "recommended": "ML-KEM-768 (CRYSTALS-Kyber)",
        "standard": "FIPS 203",
        "complexity": "medium",
        "risk_reduction": 0.80,
        "effort_hours": 24,
        "priority": 1,
        "steps": [
            "Audit all RSA-2048 key exchange endpoints",
            "Deploy hybrid TLS 1.3 with ML-KEM-768 key agreement",
            "Update certificate chain to support PQ algorithms",
            "Run backward compatibility tests",
            "Phase out pure RSA key exchange over 6 months",
        ],
    },
    "ECC-P256": {
        "recommended": "ML-KEM-512 (CRYSTALS-Kyber)",
        "standard": "FIPS 203",
        "complexity": "medium",
        "risk_reduction": 0.70,
        "effort_hours": 20,
        "priority": 2,
        "steps": [
            "Identify all ECDH/ECDSA key exchanges",
            "Implement hybrid key exchange (X25519 + ML-KEM-512)",
            "Update PKI infrastructure for PQ signatures",
            "Test TLS handshake performance",
            "Roll out in staging, then production",
        ],
    },
    "RSA-1024": {
        "recommended": "ML-KEM-768 (CRYSTALS-Kyber)",
        "standard": "FIPS 203",
        "complexity": "high",
        "risk_reduction": 0.95,
        "effort_hours": 40,
        "priority": 1,
        "steps": [
            "CRITICAL: RSA-1024 is already weak — immediate migration required",
            "Replace with ML-KEM-768 for key exchange",
            "Use ML-DSA-65 for digital signatures",
            "Emergency certificate rotation within 30 days",
            "Full audit and verification",
        ],
    },
    "AES-128": {
        "recommended": "AES-256",
        "standard": "NIST SP 800-38A",
        "complexity": "low",
        "risk_reduction": 0.30,
        "effort_hours": 8,
        "priority": 3,
        "steps": [
            "Upgrade AES-128 to AES-256 across all encryption layers",
            "Re-encrypt stored data with AES-256-GCM",
            "Update key management policies",
            "Verify performance impact (minimal expected)",
        ],
    },
}


# ══════════════════════════════════════════════
# TOOL IMPLEMENTATIONS
# ══════════════════════════════════════════════

class AgentTools:
    """Registry of all 10 agent tools."""

    @staticmethod
    def asset_search(
        algorithm: Optional[str] = None,
        risk_level: Optional[str] = None,
        exposure: Optional[str] = None,
        asset_type: Optional[str] = None,
        sensitivity: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 10,
    ) -> ToolResult:
        """Tool 1: Search assets matching conditions."""
        import time
        start = time.time()

        results = list(MOCK_ASSETS)

        if algorithm:
            results = [a for a in results if algorithm.upper() in (a.get("algorithm", "").upper())]
        if risk_level:
            thresholds = {"critical": 8.0, "high": 6.0, "medium": 4.0, "low": 2.0}
            threshold = thresholds.get(risk_level.lower(), 0)
            results = [a for a in results if a.get("quantum_risk_score", 0) >= threshold]
        if exposure:
            results = [a for a in results if a.get("exposure_surface", "").lower() == exposure.lower()]
        if asset_type:
            results = [a for a in results if a.get("type", "").lower() == asset_type.lower()]
        if sensitivity:
            results = [a for a in results if a.get("sensitivity", "").lower() == sensitivity.lower()]
        if query:
            results = [a for a in results if query.lower() in a.get("name", "").lower()]

        results = sorted(results, key=lambda x: x.get("quantum_risk_score", 0), reverse=True)[:limit]

        return ToolResult(
            tool_name="asset_search",
            success=True,
            data={"assets": results, "total": len(results)},
            execution_time_ms=(time.time() - start) * 1000,
            metadata={"filters": {"algorithm": algorithm, "risk_level": risk_level, "exposure": exposure}},
        )

    @staticmethod
    def crypto_exposure(algorithm: Optional[str] = None, family: Optional[str] = None) -> ToolResult:
        """Tool 2: Query cryptography usage across systems."""
        import time
        start = time.time()

        results = list(CRYPTO_FINDINGS)
        if algorithm:
            results = [f for f in results if algorithm.upper() in f["algorithm"].upper()]
        if family:
            results = [f for f in results if f["family"].lower() == family.lower()]

        total_instances = sum(f["count"] for f in results)
        vulnerable = sum(f["count"] for f in results if f.get("risk_flag") in ["quantum_vulnerable", "critical_weak", "weak_key"])

        return ToolResult(
            tool_name="crypto_exposure",
            success=True,
            data={
                "findings": results,
                "summary": {
                    "total_crypto_instances": total_instances,
                    "quantum_vulnerable_instances": vulnerable,
                    "vulnerability_percentage": round((vulnerable / total_instances * 100) if total_instances else 0, 1),
                    "unique_algorithms": len(results),
                },
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def risk_intelligence(top_n: int = 10, min_score: float = 0.0) -> ToolResult:
        """Tool 3: Retrieve risk rankings."""
        import time
        start = time.time()

        ranked = sorted(MOCK_ASSETS, key=lambda x: x.get("quantum_risk_score", 0), reverse=True)
        ranked = [a for a in ranked if a.get("quantum_risk_score", 0) >= min_score][:top_n]

        risk_items = []
        for a in ranked:
            score = a.get("quantum_risk_score", 0)
            risk_items.append({
                "asset_id": a["id"],
                "asset_name": a["name"],
                "risk_score": score,
                "severity": "critical" if score >= 8 else "high" if score >= 6 else "medium" if score >= 4 else "low",
                "algorithm": a.get("algorithm"),
                "sensitivity": a.get("sensitivity"),
                "exposure": a.get("exposure_surface"),
                "data_type": a.get("data_type"),
            })

        return ToolResult(
            tool_name="risk_intelligence",
            success=True,
            data={
                "rankings": risk_items,
                "average_risk": round(sum(r["risk_score"] for r in risk_items) / len(risk_items) if risk_items else 0, 1),
                "critical_count": len([r for r in risk_items if r["severity"] == "critical"]),
                "high_count": len([r for r in risk_items if r["severity"] == "high"]),
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def data_longevity(asset_id: Optional[str] = None, asset_name: Optional[str] = None) -> ToolResult:
        """Tool 4: Analyze data longevity for an asset."""
        import time
        start = time.time()

        asset = None
        for a in MOCK_ASSETS:
            if (asset_id and a["id"] == asset_id) or (asset_name and asset_name.lower() in a["name"].lower()):
                asset = a
                break

        if not asset:
            return ToolResult(tool_name="data_longevity", success=False, error="Asset not found. Try a different search term.")

        secrecy_years = asset.get("required_secrecy_years", 10)
        data_type = asset.get("data_type", "general")

        compliance_map = {
            "phi": ["HIPAA", "GDPR"],
            "pii": ["GDPR", "CCPA"],
            "financial": ["SOX", "PCI-DSS"],
            "biometric": ["GDPR", "FedRAMP"],
            "ip": ["Trade Secret Law"],
        }

        return ToolResult(
            tool_name="data_longevity",
            success=True,
            data={
                "asset_id": asset["id"],
                "asset_name": asset["name"],
                "data_type": data_type,
                "required_secrecy_years": secrecy_years,
                "secrecy_expiry_year": 2026 + secrecy_years,
                "sensitivity": asset.get("sensitivity"),
                "compliance_frameworks": compliance_map.get(data_type, []),
                "risk_assessment": (
                    "EXTREME — Data must remain secret well beyond quantum break window"
                    if secrecy_years > 30
                    else "HIGH — Significant overlap with quantum threat timeline"
                    if secrecy_years > 15
                    else "MODERATE — Some exposure during quantum transition"
                    if secrecy_years > 5
                    else "LOW — Short-lived data, manageable risk"
                ),
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def scan_trigger(scan_type: str = "full", target: Optional[str] = None) -> ToolResult:
        """Tool 5: Trigger infrastructure scans."""
        import time
        start = time.time()

        scan_id = f"scan-{uuid.uuid4().hex[:8]}"
        scan_types = {
            "tls": {"description": "TLS/SSL certificate and cipher scan", "estimated_duration": "5-10 minutes", "scope": "All TLS endpoints"},
            "repos": {"description": "Source code repository crypto detection scan", "estimated_duration": "15-30 minutes", "scope": "All connected repositories"},
            "full": {"description": "Full infrastructure cryptographic audit", "estimated_duration": "45-90 minutes", "scope": "Complete infrastructure"},
            "vulnerability": {"description": "Vulnerability assessment scan", "estimated_duration": "20-40 minutes", "scope": "All exposed endpoints"},
        }

        scan_info = scan_types.get(scan_type.lower(), scan_types["full"])

        return ToolResult(
            tool_name="scan_trigger",
            success=True,
            data={
                "scan_id": scan_id,
                "scan_type": scan_type,
                "status": "initiated",
                "description": scan_info["description"],
                "estimated_duration": scan_info["estimated_duration"],
                "scope": scan_info["scope"],
                "target": target or "all",
                "initiated_at": datetime.utcnow().isoformat() + "Z",
                "message": f"Scan {scan_id} has been initiated. You will be notified upon completion.",
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def graph_exploration(asset_id: Optional[str] = None, asset_name: Optional[str] = None) -> ToolResult:
        """Tool 6: Analyze system dependency graph."""
        import time
        start = time.time()

        # Find asset
        asset = None
        for a in MOCK_ASSETS:
            if (asset_id and a["id"] == asset_id) or (asset_name and asset_name.lower() in a["name"].lower()):
                asset = a
                break

        if not asset:
            return ToolResult(tool_name="graph_exploration", success=False, error="Asset not found.")

        asset_key = asset["id"]
        graph = GRAPH_DATA.get(asset_key)

        if not graph:
            # Generate synthetic graph data
            connected = random.sample(MOCK_ASSETS, min(3, len(MOCK_ASSETS)))
            graph = {
                "node": {"id": asset["id"], "name": asset["name"], "type": asset["type"]},
                "edges": [
                    {"target": c["id"], "relation": random.choice(["CONNECTS_TO", "DEPENDS_ON", "AUTHENTICATES_WITH"]), "target_name": c["name"]}
                    for c in connected if c["id"] != asset["id"]
                ],
                "upstream": [],
                "blast_radius": len(connected),
                "risk_propagation": "high" if asset.get("quantum_risk_score", 0) > 7 else "medium",
            }

        return ToolResult(
            tool_name="graph_exploration",
            success=True,
            data=graph,
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def quantum_timeline(algorithm: Optional[str] = None) -> ToolResult:
        """Tool 7: Get quantum threat timeline predictions."""
        import time
        start = time.time()

        if algorithm:
            algo_upper = algorithm.upper().replace(" ", "-")
            timeline = QUANTUM_TIMELINE.get(algo_upper)
            if timeline:
                data = {algo_upper: timeline}
            else:
                data = {algo_upper: {"break_window": [2040, 2060], "status": "unknown", "confidence": 0.3}}
        else:
            data = QUANTUM_TIMELINE

        current_year = 2026
        urgent = {k: v for k, v in data.items() if v["break_window"][0] <= current_year + 10}

        return ToolResult(
            tool_name="quantum_timeline",
            success=True,
            data={
                "timelines": data,
                "urgent_algorithms": urgent,
                "analysis_year": current_year,
                "summary": f"{len(urgent)} algorithm(s) at risk within the next 10 years",
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def attack_simulation(
        asset_id: Optional[str] = None,
        asset_name: Optional[str] = None,
        steal_year: int = 2026,
    ) -> ToolResult:
        """Tool 8: Simulate HNDL attack scenario."""
        import time
        start = time.time()

        asset = None
        for a in MOCK_ASSETS:
            if (asset_id and a["id"] == asset_id) or (asset_name and asset_name.lower() in a["name"].lower()):
                asset = a
                break

        if not asset:
            return ToolResult(tool_name="attack_simulation", success=False, error="Asset not found for simulation.")

        algorithm = asset.get("algorithm", "RSA-2048")
        timeline = QUANTUM_TIMELINE.get(algorithm.upper(), {"break_window": [2040, 2060]})
        break_low, break_high = timeline["break_window"]
        secrecy_years = asset.get("required_secrecy_years", 10)
        secrecy_expiry = steal_year + secrecy_years

        # HNDL window calculation
        hndl_window = max(0, secrecy_expiry - break_low)
        data_exposed = secrecy_expiry > break_low

        severity = "critical" if hndl_window > 20 else "high" if hndl_window > 10 else "medium" if hndl_window > 0 else "low"

        return ToolResult(
            tool_name="attack_simulation",
            success=True,
            data={
                "simulation_id": f"sim-{uuid.uuid4().hex[:8]}",
                "asset": {"id": asset["id"], "name": asset["name"], "type": asset["type"]},
                "scenario": {
                    "attack_type": "Harvest-Now-Decrypt-Later (HNDL)",
                    "steal_year": steal_year,
                    "algorithm_used": algorithm,
                    "quantum_break_window": f"{break_low}–{break_high}",
                    "earliest_decryption": break_low,
                    "data_secrecy_required_until": secrecy_expiry,
                },
                "result": {
                    "data_exposed": data_exposed,
                    "hndl_window_years": hndl_window,
                    "severity": severity,
                    "exposure_period": f"{break_low}–{secrecy_expiry}" if data_exposed else "None",
                },
                "narrative": (
                    f"If an adversary captures {asset['name']} data in {steal_year}, "
                    f"they could decrypt it as early as {break_low} using a quantum computer. "
                    f"{'The data requires secrecy until ' + str(secrecy_expiry) + ', resulting in ' + str(hndl_window) + ' years of exposure.' if data_exposed else 'However, the data secrecy period expires before quantum computers are expected to break ' + algorithm + '.'}"
                ),
                "recommendation": (
                    f"IMMEDIATE ACTION REQUIRED: Migrate {algorithm} to post-quantum cryptography. "
                    f"HNDL exposure window is {hndl_window} years."
                    if severity in ["critical", "high"]
                    else f"Plan migration of {algorithm} within the next 2-3 years to prevent future exposure."
                    if severity == "medium"
                    else f"Current crypto provides adequate protection for the data's sensitivity window."
                ),
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def migration_advisor(
        asset_id: Optional[str] = None,
        algorithm: Optional[str] = None,
        asset_name: Optional[str] = None,
    ) -> ToolResult:
        """Tool 9: Get PQC migration recommendations."""
        import time
        start = time.time()

        if asset_name or asset_id:
            asset = None
            for a in MOCK_ASSETS:
                if (asset_id and a["id"] == asset_id) or (asset_name and asset_name.lower() in a["name"].lower()):
                    asset = a
                    break
            if asset:
                algorithm = asset.get("algorithm", algorithm)

        if not algorithm:
            return ToolResult(tool_name="migration_advisor", success=False, error="No algorithm specified. Provide an asset or algorithm.")

        algo_upper = algorithm.upper()
        rec = MIGRATION_RECOMMENDATIONS.get(algo_upper)

        if not rec:
            for key in MIGRATION_RECOMMENDATIONS:
                if key in algo_upper:
                    rec = MIGRATION_RECOMMENDATIONS[key]
                    break

        if not rec:
            return ToolResult(
                tool_name="migration_advisor",
                success=True,
                data={
                    "current_algorithm": algo_upper,
                    "recommendation": "No specific PQC migration path defined. Consult NIST PQC standard documentation.",
                    "general_guidance": "Consider ML-KEM (FIPS 203) for key exchange and ML-DSA (FIPS 204) for digital signatures.",
                },
                execution_time_ms=(time.time() - start) * 1000,
            )

        return ToolResult(
            tool_name="migration_advisor",
            success=True,
            data={
                "current_algorithm": algo_upper,
                "recommendation": rec,
            },
            execution_time_ms=(time.time() - start) * 1000,
        )

    @staticmethod
    def sql_query(query_template: str = "top_risk_assets", limit: int = 10) -> ToolResult:
        """Tool 10: Execute safe SQL analytics queries."""
        import time
        start = time.time()

        SAFE_TEMPLATES = {
            "top_risk_assets": {
                "sql": f"SELECT asset_name, risk_score, algorithm, sensitivity FROM risk_scores ORDER BY risk_score DESC LIMIT {limit}",
                "description": "Top assets ranked by quantum risk score",
            },
            "crypto_inventory": {
                "sql": "SELECT algorithm, COUNT(*) as instance_count, AVG(risk_score) as avg_risk FROM encryption_inventory GROUP BY algorithm ORDER BY avg_risk DESC",
                "description": "Cryptographic algorithm inventory with risk averages",
            },
            "data_classifications": {
                "sql": "SELECT data_type, COUNT(*) as asset_count, MAX(required_secrecy_years) as max_secrecy FROM data_classifications GROUP BY data_type ORDER BY max_secrecy DESC",
                "description": "Data classification summary",
            },
            "vulnerable_assets": {
                "sql": "SELECT asset_name, algorithm, exposure_surface, risk_score FROM assets WHERE risk_score >= 7.0 AND algorithm LIKE 'RSA%' ORDER BY risk_score DESC",
                "description": "RSA-based assets with high quantum risk",
            },
            "migration_status": {
                "sql": "SELECT current_crypto, recommended_crypto, COUNT(*) as pending_count, AVG(risk_reduction) as avg_risk_reduction FROM migration_advice GROUP BY current_crypto, recommended_crypto",
                "description": "Migration recommendations summary",
            },
        }

        template = SAFE_TEMPLATES.get(query_template)
        if not template:
            return ToolResult(
                tool_name="sql_query",
                success=False,
                error=f"Unknown query template '{query_template}'. Available: {', '.join(SAFE_TEMPLATES.keys())}",
            )

        # Generate mock results based on template
        mock_results = []
        if query_template == "top_risk_assets":
            for a in sorted(MOCK_ASSETS, key=lambda x: x.get("quantum_risk_score", 0), reverse=True)[:limit]:
                mock_results.append({
                    "asset_name": a["name"],
                    "risk_score": a["quantum_risk_score"],
                    "algorithm": a.get("algorithm"),
                    "sensitivity": a.get("sensitivity"),
                })
        elif query_template == "crypto_inventory":
            algo_groups = {}
            for a in MOCK_ASSETS:
                algo = a.get("algorithm", "Unknown")
                if algo not in algo_groups:
                    algo_groups[algo] = {"count": 0, "risk_sum": 0}
                algo_groups[algo]["count"] += 1
                algo_groups[algo]["risk_sum"] += a.get("quantum_risk_score", 0)
            for algo, data in algo_groups.items():
                mock_results.append({
                    "algorithm": algo,
                    "instance_count": data["count"],
                    "avg_risk": round(data["risk_sum"] / data["count"], 1),
                })
        elif query_template == "data_classifications":
            type_groups = {}
            for a in MOCK_ASSETS:
                dt = a.get("data_type", "general")
                if dt not in type_groups:
                    type_groups[dt] = {"count": 0, "max_secrecy": 0}
                type_groups[dt]["count"] += 1
                type_groups[dt]["max_secrecy"] = max(type_groups[dt]["max_secrecy"], a.get("required_secrecy_years", 0))
            for dt, data in type_groups.items():
                mock_results.append({"data_type": dt, "asset_count": data["count"], "max_secrecy_years": data["max_secrecy"]})
        elif query_template == "vulnerable_assets":
            mock_results = [
                {"asset_name": a["name"], "algorithm": a.get("algorithm"), "exposure_surface": a.get("exposure_surface"), "risk_score": a.get("quantum_risk_score")}
                for a in MOCK_ASSETS
                if "RSA" in a.get("algorithm", "") and a.get("quantum_risk_score", 0) >= 7.0
            ]
        elif query_template == "migration_status":
            mock_results = [
                {"current_crypto": "RSA-2048", "recommended_crypto": "ML-KEM-768", "pending_count": 847, "avg_risk_reduction": 0.80},
                {"current_crypto": "ECC-P256", "recommended_crypto": "ML-KEM-512", "pending_count": 523, "avg_risk_reduction": 0.70},
                {"current_crypto": "RSA-1024", "recommended_crypto": "ML-KEM-768", "pending_count": 52, "avg_risk_reduction": 0.95},
                {"current_crypto": "AES-128", "recommended_crypto": "AES-256", "pending_count": 891, "avg_risk_reduction": 0.30},
            ]

        return ToolResult(
            tool_name="sql_query",
            success=True,
            data={
                "query": template["sql"],
                "description": template["description"],
                "results": mock_results,
                "row_count": len(mock_results),
            },
            execution_time_ms=(time.time() - start) * 1000,
        )


# ── Tool Registry for Agent ──
TOOL_REGISTRY = {
    "asset_search": {
        "function": AgentTools.asset_search,
        "description": "Search for infrastructure assets by algorithm, risk level, exposure surface, type, or name.",
        "parameters": ["algorithm", "risk_level", "exposure", "asset_type", "sensitivity", "query", "limit"],
    },
    "crypto_exposure": {
        "function": AgentTools.crypto_exposure,
        "description": "Query cryptographic algorithm usage across systems. Find weak or deprecated crypto.",
        "parameters": ["algorithm", "family"],
    },
    "risk_intelligence": {
        "function": AgentTools.risk_intelligence,
        "description": "Retrieve top assets ranked by quantum risk score.",
        "parameters": ["top_n", "min_score"],
    },
    "data_longevity": {
        "function": AgentTools.data_longevity,
        "description": "Analyze how long an asset's data must remain confidential and its HNDL exposure risk.",
        "parameters": ["asset_id", "asset_name"],
    },
    "scan_trigger": {
        "function": AgentTools.scan_trigger,
        "description": "Initiate an infrastructure scan (TLS, repository, full, or vulnerability scan).",
        "parameters": ["scan_type", "target"],
    },
    "graph_exploration": {
        "function": AgentTools.graph_exploration,
        "description": "Explore system dependency graph. Find what depends on or connects to an asset.",
        "parameters": ["asset_id", "asset_name"],
    },
    "quantum_timeline": {
        "function": AgentTools.quantum_timeline,
        "description": "Get quantum computing threat timeline predictions for cryptographic algorithms.",
        "parameters": ["algorithm"],
    },
    "attack_simulation": {
        "function": AgentTools.attack_simulation,
        "description": "Simulate a Harvest-Now-Decrypt-Later (HNDL) attack and analyze data exposure.",
        "parameters": ["asset_id", "asset_name", "steal_year"],
    },
    "migration_advisor": {
        "function": AgentTools.migration_advisor,
        "description": "Get Post-Quantum Cryptography (PQC) migration recommendations.",
        "parameters": ["asset_id", "algorithm", "asset_name"],
    },
    "sql_query": {
        "function": AgentTools.sql_query,
        "description": "Run safe SQL analytics queries. Templates: top_risk_assets, crypto_inventory, data_classifications, vulnerable_assets, migration_status.",
        "parameters": ["query_template", "limit"],
    },
}
