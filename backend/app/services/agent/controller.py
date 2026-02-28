"""QuantumShield — Agent Controller

Implements the tool-based agent architecture:
  User question → Intent detection → Task decomposition →
  Tool execution → Result synthesis → Response

The LLM acts as a planner, not a data source.
"""

import json
import re
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict

from app.services.agent.tools import TOOL_REGISTRY, AgentTools, ToolResult


# ══════════════════════════════════════════════
# SYSTEM PROMPT
# ══════════════════════════════════════════════

SYSTEM_PROMPT = """You are QuantumShield Analyst AI.

Your role is to assist security teams in identifying
Harvest-Now-Decrypt-Later exposure.

You have access to infrastructure intelligence tools.

You must:
• prefer tool execution over guessing
• use structured queries
• reason step-by-step
• show evidence when possible
• explain risk factors clearly

When users ask questions:
1. Determine if tools are needed
2. Call tools with precise parameters
3. Interpret results
4. Provide concise technical answers

Never fabricate infrastructure data.
If information is missing, request additional scans."""


# ══════════════════════════════════════════════
# INTENT DETECTION
# ══════════════════════════════════════════════

@dataclass
class DetectedIntent:
    """Detected user intent with confidence."""
    intent: str
    confidence: float
    tools_needed: List[str]
    parameters: Dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""


INTENT_PATTERNS = {
    "find_vulnerable_assets": {
        "patterns": [
            r"vulnerable|at risk|most at risk|highest risk|top risk|critical assets",
            r"which.*systems.*risk|what.*vulnerable|find.*risk",
            r"hndl.*risk|harvest.now|quantum.*threat.*assets",
        ],
        "tools": ["risk_intelligence", "asset_search"],
        "confidence": 0.85,
    },
    "find_rsa_usage": {
        "patterns": [
            r"where.*rsa|using rsa|rsa.*usage|rsa.*systems",
            r"find.*rsa|locate.*rsa|which.*rsa",
        ],
        "tools": ["crypto_exposure", "asset_search"],
        "parameters": {"algorithm": "RSA"},
        "confidence": 0.9,
    },
    "find_ecc_usage": {
        "patterns": [
            r"where.*ecc|using ecc|ecc.*usage|ecdsa|elliptic.*curve",
            r"find.*ecc|locate.*ecc|which.*ecc",
        ],
        "tools": ["crypto_exposure", "asset_search"],
        "parameters": {"algorithm": "ECC"},
        "confidence": 0.9,
    },
    "crypto_overview": {
        "patterns": [
            r"crypto.*posture|cryptograph.*overview|crypto.*inventory",
            r"what.*algorithms|encryption.*usage|crypto.*landscape",
            r"weak.*algorithm|deprecated.*crypto|ancient.*crypto",
        ],
        "tools": ["crypto_exposure", "sql_query"],
        "confidence": 0.85,
    },
    "explain_hndl": {
        "patterns": [
            r"what.*hndl|explain.*harvest|how.*hndl.*work",
            r"harvest.now.decrypt|what.*hndl.*attack",
        ],
        "tools": [],
        "confidence": 0.95,
    },
    "attack_simulation": {
        "patterns": [
            r"simulat.*attack|what.*happen.*if|what.*if.*stole",
            r"hndl.*simulat|attack.*scenario|adversary.*capture",
            r"if.*attackers|what.*if.*captured|simulate.*breach",
        ],
        "tools": ["attack_simulation", "data_longevity"],
        "confidence": 0.85,
    },
    "data_longevity_check": {
        "patterns": [
            r"data.*longevity|how.*long.*sensitive|secrecy.*year",
            r"data.*lifespan|retention.*period|how.*long.*protected",
            r"data.*classification|sensitivity.*check",
        ],
        "tools": ["data_longevity"],
        "confidence": 0.85,
    },
    "trigger_scan": {
        "patterns": [
            r"trigger.*scan|start.*scan|run.*scan|initiate.*scan",
            r"scan.*infrastructure|scan.*tls|scan.*repo",
        ],
        "tools": ["scan_trigger"],
        "confidence": 0.9,
    },
    "graph_analysis": {
        "patterns": [
            r"depend.*on|connected.*to|blast.*radius|impact.*analysis",
            r"system.*graph|which.*systems.*inherit|dependency.*chain",
            r"what.*depends|upstream|downstream|relationship",
        ],
        "tools": ["graph_exploration"],
        "confidence": 0.85,
    },
    "quantum_timeline": {
        "patterns": [
            r"quantum.*timeline|when.*quantum|break.*window",
            r"when.*rsa.*broken|quantum.*computer.*year|timeline.*prediction",
            r"how.*long.*until.*quantum|quantum.*forecast",
        ],
        "tools": ["quantum_timeline"],
        "confidence": 0.85,
    },
    "migration_advice": {
        "patterns": [
            r"migrat.*pqc|post.quantum.*migrat|upgrade.*crypto",
            r"how.*migrat|recommend.*migrat|pqc.*upgrade",
            r"what.*replace|switch.*from|transition.*to",
            r"migrat.*reduce.*risk|which.*migrat",
        ],
        "tools": ["migration_advisor"],
        "confidence": 0.85,
    },
    "risk_comparison": {
        "patterns": [
            r"compare.*risk|risk.*comparison|versus|vs\.",
            r"difference.*between.*risk|which.*more.*risk",
        ],
        "tools": ["risk_intelligence", "asset_search"],
        "confidence": 0.8,
    },
    "analytics_query": {
        "patterns": [
            r"sql.*query|database.*query|analytics|report.*data",
            r"show.*table|query.*assets|run.*query",
        ],
        "tools": ["sql_query"],
        "confidence": 0.8,
    },
    "general_question": {
        "patterns": [
            r"what.*is|how.*does|explain|tell.*me.*about",
            r"overview|summary|describe|define",
        ],
        "tools": [],
        "confidence": 0.5,
    },
}


def detect_intent(user_message: str) -> List[DetectedIntent]:
    """Detect user intent from natural language input."""
    message_lower = user_message.lower()
    detected = []

    for intent_name, config in INTENT_PATTERNS.items():
        for pattern in config["patterns"]:
            if re.search(pattern, message_lower):
                detected.append(DetectedIntent(
                    intent=intent_name,
                    confidence=config["confidence"],
                    tools_needed=config["tools"],
                    parameters=config.get("parameters", {}),
                    reasoning=f"Matched pattern '{pattern}' for intent '{intent_name}'",
                ))
                break

    # Sort by confidence
    detected.sort(key=lambda x: x.confidence, reverse=True)

    if not detected:
        detected.append(DetectedIntent(
            intent="general_question",
            confidence=0.3,
            tools_needed=[],
            reasoning="No specific intent detected. Using general response.",
        ))

    return detected


# ══════════════════════════════════════════════
# PARAMETER EXTRACTION
# ══════════════════════════════════════════════

def extract_parameters(user_message: str, intent: DetectedIntent) -> Dict[str, Any]:
    """Extract tool parameters from user message."""
    params = dict(intent.parameters)
    msg_lower = user_message.lower()

    # Extract algorithm names
    algo_patterns = {
        r"rsa[-\s]?1024": "RSA-1024",
        r"rsa[-\s]?2048": "RSA-2048",
        r"rsa[-\s]?3072": "RSA-3072",
        r"rsa[-\s]?4096": "RSA-4096",
        r"\brsa\b": "RSA",
        r"ecc[-\s]?p?256": "ECC-P256",
        r"ecc[-\s]?p?384": "ECC-P384",
        r"\becc\b|\becdsa\b": "ECC",
        r"aes[-\s]?128": "AES-128",
        r"aes[-\s]?256": "AES-256",
        r"\baes\b": "AES",
        r"ed25519": "ED25519",
        r"3des|triple.des": "3DES",
        r"kyber": "KYBER-768",
        r"dilithium": "DILITHIUM",
    }

    for pattern, algo in algo_patterns.items():
        if re.search(pattern, msg_lower):
            params["algorithm"] = algo
            break

    # Extract asset names
    asset_keywords = [
        "healthcare", "patient", "archive", "identity", "idp", "backup",
        "finance", "data lake", "api gateway", "kubernetes", "k8s",
        "load balancer", "repository", "certificate", "biometric",
        "cache", "redis", "vpn", "email",
    ]
    for kw in asset_keywords:
        if kw in msg_lower:
            params["asset_name"] = kw
            break

    # Extract year
    year_match = re.search(r"\b(20[2-9]\d)\b", user_message)
    if year_match:
        params["steal_year"] = int(year_match.group(1))

    # Extract scan type
    scan_types = {"tls": "tls", "repo": "repos", "repository": "repos", "full": "full", "vulnerability": "vulnerability"}
    for kw, stype in scan_types.items():
        if kw in msg_lower:
            params["scan_type"] = stype
            break

    # Extract risk level
    for level in ["critical", "high", "medium", "low"]:
        if level in msg_lower:
            params["risk_level"] = level
            break

    # Extract query templates for SQL
    sql_templates = {
        "top risk": "top_risk_assets",
        "crypto inventory": "crypto_inventory",
        "data classification": "data_classifications",
        "vulnerable": "vulnerable_assets",
        "migration status": "migration_status",
    }
    for kw, template in sql_templates.items():
        if kw in msg_lower:
            params["query_template"] = template
            break

    return params


# ══════════════════════════════════════════════
# TOOL EXECUTOR
# ══════════════════════════════════════════════

def execute_tools(tools_needed: List[str], params: Dict[str, Any]) -> List[ToolResult]:
    """Execute the required tools with extracted parameters."""
    results = []

    for tool_name in tools_needed:
        tool_config = TOOL_REGISTRY.get(tool_name)
        if not tool_config:
            results.append(ToolResult(tool_name=tool_name, success=False, error=f"Tool '{tool_name}' not found"))
            continue

        func = tool_config["function"]
        valid_params = tool_config["parameters"]

        # Filter params to only those accepted by the tool
        tool_params = {k: v for k, v in params.items() if k in valid_params}

        try:
            result = func(**tool_params)
            results.append(result)
        except Exception as e:
            results.append(ToolResult(tool_name=tool_name, success=False, error=str(e)))

    return results


# ══════════════════════════════════════════════
# RESPONSE SYNTHESIZER
# ══════════════════════════════════════════════

def synthesize_response(
    user_message: str,
    intents: List[DetectedIntent],
    tool_results: List[ToolResult],
    conversation_history: List[Dict] = None,
) -> Dict[str, Any]:
    """Synthesize a structured response from tool results."""
    primary_intent = intents[0] if intents else None

    if not primary_intent:
        return _build_response("I'm not sure what you're asking. Could you rephrase?", [], [])

    # Handle informational intents (no tools needed)
    if primary_intent.intent == "explain_hndl" and not tool_results:
        return _build_hndl_explanation()

    if primary_intent.intent == "general_question" and not tool_results:
        return _build_general_response(user_message)

    # Build response from tool results
    response_parts = []
    evidence_items = []
    tool_calls_summary = []

    for result in tool_results:
        tool_calls_summary.append({
            "tool": result.tool_name,
            "success": result.success,
            "execution_time_ms": round(result.execution_time_ms, 1),
        })

        if not result.success:
            response_parts.append(f"⚠️ Tool `{result.tool_name}` encountered an error: {result.error}")
            continue

        # Format based on tool type
        formatter = TOOL_FORMATTERS.get(result.tool_name)
        if formatter:
            text, evidence = formatter(result)
            response_parts.append(text)
            evidence_items.extend(evidence)
        else:
            response_parts.append(f"Results from **{result.tool_name}**:\n```json\n{json.dumps(result.data, indent=2, default=str)[:1500]}\n```")

    final_text = "\n\n".join(response_parts)

    return _build_response(final_text, tool_calls_summary, evidence_items)


def _build_response(text: str, tool_calls: List[Dict], evidence: List[Dict]) -> Dict[str, Any]:
    """Build standardized response structure."""
    return {
        "message": text,
        "tool_calls": tool_calls,
        "evidence": evidence,
        "timestamp": time.time(),
    }


# ══════════════════════════════════════════════
# TOOL RESULT FORMATTERS
# ══════════════════════════════════════════════

def _format_risk_intelligence(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format risk intelligence results."""
    data = result.data
    rankings = data.get("rankings", [])

    if not rankings:
        return "No assets found matching the risk criteria.", []

    lines = ["## 🎯 Top Assets by Quantum Risk Score\n"]
    for i, item in enumerate(rankings, 1):
        severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(item["severity"], "⚪")
        lines.append(
            f"**{i}. {item['asset_name']}** {severity_icon}\n"
            f"   - Risk Score: **{item['risk_score']}/10** ({item['severity'].upper()})\n"
            f"   - Algorithm: `{item['algorithm']}` | Sensitivity: {item['sensitivity']} | Exposure: {item['exposure']}\n"
            f"   - Data Type: {item.get('data_type', 'N/A')}"
        )

    summary = (
        f"\n---\n📊 **Summary**: Average risk score **{data['average_risk']}/10** | "
        f"**{data['critical_count']}** critical | **{data['high_count']}** high"
    )
    lines.append(summary)

    evidence = [{"type": "risk_ranking", "data": item} for item in rankings[:3]]
    return "\n\n".join(lines), evidence


def _format_asset_search(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format asset search results."""
    data = result.data
    assets = data.get("assets", [])

    if not assets:
        return "No assets found matching the search criteria.", []

    lines = [f"## 🔍 Found {data['total']} matching asset(s)\n"]
    for a in assets:
        score = a.get("quantum_risk_score", 0)
        severity_icon = "🔴" if score >= 8 else "🟠" if score >= 6 else "🟡" if score >= 4 else "🟢"
        lines.append(
            f"**{a['name']}** {severity_icon} `{a.get('id', '')}`\n"
            f"   - Type: {a['type']} | Env: {a['environment']} | Location: {a.get('location', 'N/A')}\n"
            f"   - Algorithm: `{a.get('algorithm', 'N/A')}` | Risk: **{score}/10**\n"
            f"   - Sensitivity: {a.get('sensitivity', 'N/A')} | Exposure: {a.get('exposure_surface', 'N/A')}"
        )

    evidence = [{"type": "asset", "data": a} for a in assets[:3]]
    return "\n\n".join(lines), evidence


def _format_crypto_exposure(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format crypto exposure results."""
    data = result.data
    findings = data.get("findings", [])
    summary = data.get("summary", {})

    lines = ["## 🔐 Cryptographic Exposure Analysis\n"]

    if summary:
        lines.append(
            f"**Total crypto instances**: {summary.get('total_crypto_instances', 0):,}\n"
            f"**Quantum-vulnerable instances**: {summary.get('quantum_vulnerable_instances', 0):,} "
            f"({summary.get('vulnerability_percentage', 0)}%)\n"
            f"**Unique algorithms detected**: {summary.get('unique_algorithms', 0)}\n"
        )

    lines.append("### Algorithm Breakdown\n")
    for f in findings:
        flag_icon = {
            "quantum_vulnerable": "⚠️ QUANTUM VULNERABLE",
            "critical_weak": "🔴 CRITICALLY WEAK",
            "weak_key": "🟠 WEAK",
            "weak_hash": "🟡 DEPRECATED",
            "grover_weakened": "🟡 GROVER-WEAKENED",
            "pqc_ready": "✅ PQC READY",
        }.get(f.get("risk_flag"), "ℹ️ OK")

        lines.append(
            f"- **`{f['algorithm']}`** — {f['count']:,} instances across {f['assets_affected']} assets | {flag_icon}"
        )

    evidence = [{"type": "crypto_finding", "data": f} for f in findings[:5]]
    return "\n\n".join(lines), evidence


def _format_data_longevity(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format data longevity results."""
    data = result.data
    lines = [
        f"## 📅 Data Longevity Analysis: {data.get('asset_name', 'Unknown')}\n",
        f"- **Data Type**: {data.get('data_type', 'N/A').upper()}",
        f"- **Sensitivity**: {data.get('sensitivity', 'N/A')}",
        f"- **Required Secrecy**: **{data.get('required_secrecy_years', 0)} years** (until {data.get('secrecy_expiry_year', 'N/A')})",
        f"- **Compliance**: {', '.join(data.get('compliance_frameworks', [])) or 'None specified'}",
        f"\n> **Assessment**: {data.get('risk_assessment', 'N/A')}",
    ]
    return "\n".join(lines), [{"type": "data_longevity", "data": data}]


def _format_scan_trigger(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format scan trigger results."""
    data = result.data
    lines = [
        f"## 🔄 Scan Initiated\n",
        f"- **Scan ID**: `{data.get('scan_id')}`",
        f"- **Type**: {data.get('scan_type', 'full').upper()}",
        f"- **Status**: ✅ {data.get('status', 'initiated').upper()}",
        f"- **Scope**: {data.get('scope', 'N/A')}",
        f"- **Estimated Duration**: {data.get('estimated_duration', 'N/A')}",
        f"- **Description**: {data.get('description', 'N/A')}",
        f"\n💡 {data.get('message', '')}",
    ]
    return "\n".join(lines), [{"type": "scan", "data": data}]


def _format_graph_exploration(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format graph exploration results."""
    data = result.data
    node = data.get("node", {})
    edges = data.get("edges", [])
    upstream = data.get("upstream", [])

    lines = [
        f"## 🗺️ System Graph: {node.get('name', 'Unknown')}\n",
        f"**Blast Radius**: {data.get('blast_radius', 0)} systems | **Risk Propagation**: {data.get('risk_propagation', 'N/A')}\n",
    ]

    if edges:
        lines.append("### Downstream Dependencies")
        for e in edges:
            lines.append(f"- → **{e.get('target_name', e.get('target', '?'))}** ({e.get('relation', 'CONNECTS_TO')})")

    if upstream:
        lines.append("\n### Upstream Connections")
        for u in upstream:
            lines.append(f"- ← **{u.get('source_name', u.get('source', '?'))}** ({u.get('relation', 'CONNECTS_TO')})")

    return "\n".join(lines), [{"type": "graph", "data": data}]


def _format_quantum_timeline(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format quantum timeline results."""
    data = result.data
    timelines = data.get("timelines", {})
    urgent = data.get("urgent_algorithms", {})

    lines = ["## ⏰ Quantum Threat Timeline\n"]

    if urgent:
        lines.append(f"⚠️ **{len(urgent)} algorithm(s) at risk within the next 10 years**\n")

    for algo, info in timelines.items():
        status_icon = {
            "critical": "🔴",
            "imminent": "🟠",
            "approaching": "🟡",
            "future": "🔵",
            "distant": "🟢",
            "safe": "✅",
        }.get(info.get("status"), "⚪")

        bw = info.get("break_window", [0, 0])
        lines.append(
            f"- **`{algo}`** {status_icon} — Break window: **{bw[0]}–{bw[1]}** | "
            f"Status: {info.get('status', 'unknown').upper()} | Confidence: {info.get('confidence', 0):.0%}"
        )

    return "\n".join(lines), [{"type": "quantum_timeline", "data": timelines}]


def _format_attack_simulation(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format attack simulation results."""
    data = result.data
    asset = data.get("asset", {})
    scenario = data.get("scenario", {})
    sim_result = data.get("result", {})

    severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(sim_result.get("severity"), "⚪")

    lines = [
        f"## ⚔️ HNDL Attack Simulation {severity_icon}\n",
        f"**Target**: {asset.get('name', 'Unknown')} (`{asset.get('id', '')}`)\n",
        "### Scenario",
        f"- Attack Type: **{scenario.get('attack_type', 'HNDL')}**",
        f"- Data Captured in: **{scenario.get('steal_year', 2026)}**",
        f"- Encryption: `{scenario.get('algorithm_used', 'Unknown')}`",
        f"- Quantum Break Window: **{scenario.get('quantum_break_window', 'N/A')}**",
        f"- Earliest Decryption Possible: **{scenario.get('earliest_decryption', 'N/A')}**",
        f"- Data Must Remain Secret Until: **{scenario.get('data_secrecy_required_until', 'N/A')}**\n",
        "### Results",
        f"- Data Exposed: **{'YES ⚠️' if sim_result.get('data_exposed') else 'NO ✅'}**",
        f"- HNDL Window: **{sim_result.get('hndl_window_years', 0)} years**",
        f"- Severity: **{sim_result.get('severity', 'unknown').upper()}** {severity_icon}",
        f"- Exposure Period: {sim_result.get('exposure_period', 'None')}\n",
        f"### 📝 Analysis\n{data.get('narrative', '')}\n",
        f"### 💡 Recommendation\n{data.get('recommendation', '')}",
    ]

    return "\n".join(lines), [{"type": "attack_simulation", "data": data}]


def _format_migration_advisor(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format migration advisor results."""
    data = result.data
    algo = data.get("current_algorithm", "Unknown")
    rec = data.get("recommendation", {})

    if isinstance(rec, str):
        return f"## 🔄 Migration Advice for `{algo}`\n\n{rec}\n{data.get('general_guidance', '')}", []

    lines = [
        f"## 🔄 PQC Migration: `{algo}` → `{rec.get('recommended', 'Unknown')}`\n",
        f"- **Standard**: {rec.get('standard', 'N/A')}",
        f"- **Complexity**: {rec.get('complexity', 'N/A').upper()}",
        f"- **Risk Reduction**: {rec.get('risk_reduction', 0):.0%}",
        f"- **Estimated Effort**: {rec.get('effort_hours', 'N/A')} hours",
        f"- **Priority**: P{rec.get('priority', 5)}\n",
    ]

    steps = rec.get("steps", [])
    if steps:
        lines.append("### Migration Steps")
        for i, step in enumerate(steps, 1):
            lines.append(f"{i}. {step}")

    return "\n".join(lines), [{"type": "migration", "data": data}]


def _format_sql_query(result: ToolResult) -> Tuple[str, List[Dict]]:
    """Format SQL query results."""
    data = result.data
    query_results = data.get("results", [])

    lines = [
        f"## 📊 Analytics Query: {data.get('description', 'Query Results')}\n",
        f"```sql\n{data.get('query', '')}\n```\n",
        f"**Rows returned**: {data.get('row_count', 0)}\n",
    ]

    if query_results:
        # Build a markdown table
        if query_results:
            headers = list(query_results[0].keys())
            lines.append("| " + " | ".join(headers) + " |")
            lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
            for row in query_results:
                lines.append("| " + " | ".join(str(row.get(h, "")) for h in headers) + " |")

    return "\n".join(lines), [{"type": "sql_result", "data": data}]


TOOL_FORMATTERS = {
    "risk_intelligence": _format_risk_intelligence,
    "asset_search": _format_asset_search,
    "crypto_exposure": _format_crypto_exposure,
    "data_longevity": _format_data_longevity,
    "scan_trigger": _format_scan_trigger,
    "graph_exploration": _format_graph_exploration,
    "quantum_timeline": _format_quantum_timeline,
    "attack_simulation": _format_attack_simulation,
    "migration_advisor": _format_migration_advisor,
    "sql_query": _format_sql_query,
}


# ══════════════════════════════════════════════
# BUILT-IN RESPONSES
# ══════════════════════════════════════════════

def _build_hndl_explanation() -> Dict[str, Any]:
    """Build an explanation of HNDL attacks."""
    text = """## 🔐 Harvest-Now-Decrypt-Later (HNDL) Attacks

**HNDL** is a quantum computing threat model where adversaries:

1. **Harvest** encrypted data traffic and stored ciphertext **today**
2. **Store** it until powerful quantum computers become available
3. **Decrypt** the data using quantum algorithms (e.g., Shor's algorithm) to break RSA/ECC

### Why It Matters

- Current encryption (RSA-2048, ECC-P256) **will be broken** by quantum computers
- Data captured today can be decrypted in **7-15 years**
- Sensitive data (medical, financial, biometric) must remain secret for **decades**
- The HNDL window = **Data Secrecy Period - Quantum Break Year**

### Risk Formula

```
HNDL Risk = Data Sensitivity × Data Longevity × Crypto Weakness × Exposure Surface × Adversary Value
```

### What You Should Do

1. **Audit** your cryptographic inventory
2. **Classify** data by secrecy requirements
3. **Prioritize** migration to Post-Quantum Cryptography (PQC)
4. **Implement** NIST PQC standards: ML-KEM (FIPS 203), ML-DSA (FIPS 204)

> 💡 Want me to analyze your specific assets? Ask me to run a risk assessment or attack simulation."""

    return _build_response(text, [], [])


def _build_general_response(user_message: str) -> Dict[str, Any]:
    """Build a general response when no specific tools are needed."""
    text = """I'm the **QuantumShield Analyst AI** — your security copilot for quantum risk intelligence.

Here's what I can help you with:

### 🔍 Infrastructure Intelligence
- *"Find vulnerable assets"* — Search assets by risk, algorithm, exposure
- *"Where are we using RSA?"* — Discover cryptographic usage across systems

### 🛡️ Security Analysis
- *"What is HNDL?"* — Explain Harvest-Now-Decrypt-Later exposure
- *"Show top risks"* — Rank critical assets by quantum risk score
- *"Analyze crypto posture"* — Overview of cryptographic landscape

### ⚡ Operational Control
- *"Trigger a TLS scan"* — Initiate infrastructure scans
- *"Simulate attack on healthcare archive"* — HNDL attack simulation

### 📐 Architecture
- *"What depends on the identity provider?"* — Dependency graph analysis
- *"Quantum timeline for RSA-2048"* — Break window predictions

### 🔄 Migration
- *"How to migrate RSA to PQC?"* — Post-quantum migration recommendations

What would you like to investigate?"""

    return _build_response(text, [], [])


# ══════════════════════════════════════════════
# MAIN AGENT FUNCTION
# ══════════════════════════════════════════════

@dataclass
class AgentResponse:
    """Complete agent response structure."""
    message: str
    tool_calls: List[Dict]
    evidence: List[Dict]
    reasoning: List[Dict]
    timestamp: float
    session_id: Optional[str] = None


def process_message(
    user_message: str,
    session_id: Optional[str] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Main agent entry point. Processes a user message through the full pipeline:
    Intent detection → Parameter extraction → Tool execution → Response synthesis.
    """
    start_time = time.time()
    reasoning_trace = []

    # Step 1: Intent detection
    intents = detect_intent(user_message)
    primary_intent = intents[0]
    reasoning_trace.append({
        "step": "intent_detection",
        "intent": primary_intent.intent,
        "confidence": primary_intent.confidence,
        "tools_needed": primary_intent.tools_needed,
        "reasoning": primary_intent.reasoning,
    })

    # Step 2: Parameter extraction
    params = extract_parameters(user_message, primary_intent)
    reasoning_trace.append({
        "step": "parameter_extraction",
        "parameters": params,
    })

    # Step 3: Tool execution
    tool_results = execute_tools(primary_intent.tools_needed, params)
    reasoning_trace.append({
        "step": "tool_execution",
        "tools_executed": [r.tool_name for r in tool_results],
        "all_succeeded": all(r.success for r in tool_results),
    })

    # Step 4: Response synthesis
    response = synthesize_response(user_message, intents, tool_results, conversation_history)
    reasoning_trace.append({
        "step": "response_synthesis",
        "response_length": len(response.get("message", "")),
    })

    total_time = (time.time() - start_time) * 1000

    return {
        "message": response["message"],
        "tool_calls": response.get("tool_calls", []),
        "evidence": response.get("evidence", []),
        "reasoning": reasoning_trace,
        "timestamp": time.time(),
        "session_id": session_id,
        "processing_time_ms": round(total_time, 1),
    }
