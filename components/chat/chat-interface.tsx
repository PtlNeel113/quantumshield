'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Clock,
    Wrench,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    Zap,
    Shield,
    ShieldAlert,
    Lock,
    Network,
    BookOpen,
    Scan,
    ArrowRightLeft,
    Swords,
    RotateCcw,
    Loader2,
    Terminal,
    AlertTriangle,
    Info,
} from 'lucide-react';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface ToolCall {
    tool: string;
    success: boolean;
    execution_time_ms: number;
}

interface EvidenceItem {
    type: string;
    data: Record<string, any>;
}

interface ReasoningStep {
    step: string;
    intent?: string;
    confidence?: number;
    tools_needed?: string[];
    reasoning?: string;
    parameters?: Record<string, any>;
    tools_executed?: string[];
    all_succeeded?: boolean;
    response_length?: number;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    tool_calls?: ToolCall[];
    evidence?: EvidenceItem[];
    reasoning?: ReasoningStep[];
    processing_time_ms?: number;
}

interface Suggestion {
    text: string;
    category: string;
    icon: string;
}

const SUGGESTION_ICONS: Record<string, any> = {
    'shield-alert': ShieldAlert,
    'lock': Lock,
    'swords': Swords,
    'clock': Clock,
    'network': Network,
    'arrow-right-left': ArrowRightLeft,
    'book-open': BookOpen,
    'scan': Scan,
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// ═══════════════════════════════════════════════
// SIMULATED AGENT (client-side fallback)
// ═══════════════════════════════════════════════

function simulateAgentResponse(message: string): ChatMessage {
    const msg = message.toLowerCase();
    let content = '';
    const toolCalls: ToolCall[] = [];
    const evidence: EvidenceItem[] = [];
    const reasoning: ReasoningStep[] = [];

    // Intent detection
    if (msg.includes('risk') || msg.includes('vulnerable') || msg.includes('hndl')) {
        reasoning.push({ step: 'intent_detection', intent: 'find_vulnerable_assets', confidence: 0.88, tools_needed: ['risk_intelligence', 'asset_search'] });
        toolCalls.push({ tool: 'risk_intelligence', success: true, execution_time_ms: 23.4 });
        toolCalls.push({ tool: 'asset_search', success: true, execution_time_ms: 18.7 });

        content = `## 🎯 Top Assets by Quantum Risk Score

**1. Healthcare Patient Archive** 🔴
   - Risk Score: **9.4/10** (CRITICAL)
   - Algorithm: \`RSA-2048\` | Sensitivity: critical | Exposure: hybrid
   - Data Type: phi

**2. Identity Provider Backups** 🔴
   - Risk Score: **8.9/10** (CRITICAL)
   - Algorithm: \`RSA-2048\` | Sensitivity: critical | Exposure: internal
   - Data Type: pii

**3. Corporate VPN Gateway** 🔴
   - Risk Score: **8.3/10** (CRITICAL)
   - Algorithm: \`RSA-2048\` | Sensitivity: high | Exposure: internet
   - Data Type: general

**4. Finance Data Lake** 🔴
   - Risk Score: **8.1/10** (CRITICAL)
   - Algorithm: \`AES-128\` | Sensitivity: high | Exposure: internal
   - Data Type: financial

**5. Enterprise Email Gateway** 🟠
   - Risk Score: **7.9/10** (HIGH)
   - Algorithm: \`RSA-2048\` | Sensitivity: high | Exposure: internet
   - Data Type: pii

---
📊 **Summary**: Average risk score **8.5/10** | **4** critical | **1** high`;

        evidence.push({ type: 'risk_ranking', data: { asset_name: 'Healthcare Patient Archive', risk_score: 9.4 } });
    } else if (msg.includes('rsa') && (msg.includes('where') || msg.includes('using') || msg.includes('find'))) {
        reasoning.push({ step: 'intent_detection', intent: 'find_rsa_usage', confidence: 0.92, tools_needed: ['crypto_exposure', 'asset_search'] });
        toolCalls.push({ tool: 'crypto_exposure', success: true, execution_time_ms: 15.2 });
        toolCalls.push({ tool: 'asset_search', success: true, execution_time_ms: 12.8 });

        content = `## 🔐 Cryptographic Exposure Analysis

**Total crypto instances**: 17,843
**Quantum-vulnerable instances**: 6,556 (36.7%)
**Unique algorithms detected**: 10

### RSA Usage Breakdown

- **\`RSA-2048\`** — 3,247 instances across 847 assets | ⚠️ QUANTUM VULNERABLE
- **\`RSA-4096\`** — 456 instances across 112 assets | ⚠️ QUANTUM VULNERABLE
- **\`RSA-1024\`** — 127 instances across 52 assets | 🔴 CRITICALLY WEAK

### Affected Systems

**Healthcare Patient Archive** 🔴 — RSA-2048 | Risk: **9.4/10**
**Identity Provider Backups** 🔴 — RSA-2048 | Risk: **8.9/10**
**Corporate VPN Gateway** 🔴 — RSA-2048 | Risk: **8.3/10**
**Enterprise Email Gateway** 🟠 — RSA-2048 | Risk: **7.9/10**
**Wildcard TLS Certificate** 🟠 — ECC-P256 | Risk: **7.6/10**
**Kubernetes Secrets Store** 🟠 — RSA-2048 | Risk: **7.5/10**`;

        evidence.push({ type: 'crypto_finding', data: { algorithm: 'RSA-2048', count: 3247, risk_flag: 'quantum_vulnerable' } });
    } else if (msg.includes('simulat') || msg.includes('attack') || msg.includes('what if') || msg.includes('what happens')) {
        reasoning.push({ step: 'intent_detection', intent: 'attack_simulation', confidence: 0.87, tools_needed: ['attack_simulation', 'data_longevity'] });
        toolCalls.push({ tool: 'attack_simulation', success: true, execution_time_ms: 45.3 });
        toolCalls.push({ tool: 'data_longevity', success: true, execution_time_ms: 8.1 });

        content = `## ⚔️ HNDL Attack Simulation 🔴

**Target**: Healthcare Patient Archive (\`asset-hc-archive-001\`)

### Scenario
- Attack Type: **Harvest-Now-Decrypt-Later (HNDL)**
- Data Captured in: **2026**
- Encryption: \`RSA-2048\`
- Quantum Break Window: **2033–2040**
- Earliest Decryption Possible: **2033**
- Data Must Remain Secret Until: **2096**

### Results
- Data Exposed: **YES ⚠️**
- HNDL Window: **63 years**
- Severity: **CRITICAL** 🔴
- Exposure Period: 2033–2096

### 📝 Analysis
If an adversary captures Healthcare Patient Archive data in 2026, they could decrypt it as early as 2033 using a quantum computer. The data requires secrecy until 2096, resulting in 63 years of exposure.

### 💡 Recommendation
IMMEDIATE ACTION REQUIRED: Migrate RSA-2048 to post-quantum cryptography. HNDL exposure window is 63 years.`;

        evidence.push({ type: 'attack_simulation', data: { severity: 'critical', hndl_window_years: 63 } });
    } else if (msg.includes('quantum') && msg.includes('timeline')) {
        reasoning.push({ step: 'intent_detection', intent: 'quantum_timeline', confidence: 0.9, tools_needed: ['quantum_timeline'] });
        toolCalls.push({ tool: 'quantum_timeline', success: true, execution_time_ms: 11.2 });

        content = `## ⏰ Quantum Threat Timeline

⚠️ **6 algorithm(s) at risk within the next 10 years**

- **\`3DES\`** 🔴 — Break window: **2025–2028** | Status: CRITICAL | Confidence: 95%
- **\`RSA-1024\`** 🟠 — Break window: **2028–2033** | Status: IMMINENT | Confidence: 85%
- **\`RSA-2048\`** 🟡 — Break window: **2033–2040** | Status: APPROACHING | Confidence: 75%
- **\`ECC-P256\`** 🟡 — Break window: **2033–2040** | Status: APPROACHING | Confidence: 75%
- **\`RSA-3072\`** 🔵 — Break window: **2036–2045** | Status: FUTURE | Confidence: 65%
- **\`ED25519\`** 🔵 — Break window: **2035–2043** | Status: FUTURE | Confidence: 65%
- **\`ECC-P384\`** 🔵 — Break window: **2035–2043** | Status: FUTURE | Confidence: 65%
- **\`RSA-4096\`** 🔵 — Break window: **2038–2048** | Status: FUTURE | Confidence: 60%
- **\`AES-128\`** 🟢 — Break window: **2050–2070** | Status: DISTANT | Confidence: 50%
- **\`AES-256\`** ✅ — Break window: **2060–2080** | Status: SAFE | Confidence: 45%`;

        evidence.push({ type: 'quantum_timeline', data: { 'RSA-2048': { break_window: [2033, 2040] } } });
    } else if (msg.includes('migrat') || msg.includes('pqc') || msg.includes('upgrade') || msg.includes('replace')) {
        reasoning.push({ step: 'intent_detection', intent: 'migration_advice', confidence: 0.88, tools_needed: ['migration_advisor'] });
        toolCalls.push({ tool: 'migration_advisor', success: true, execution_time_ms: 14.6 });

        content = `## 🔄 PQC Migration: \`RSA-2048\` → \`ML-KEM-768 (CRYSTALS-Kyber)\`

- **Standard**: FIPS 203
- **Complexity**: MEDIUM
- **Risk Reduction**: 80%
- **Estimated Effort**: 24 hours
- **Priority**: P1

### Migration Steps
1. Audit all RSA-2048 key exchange endpoints
2. Deploy hybrid TLS 1.3 with ML-KEM-768 key agreement
3. Update certificate chain to support PQ algorithms
4. Run backward compatibility tests
5. Phase out pure RSA key exchange over 6 months`;

        evidence.push({ type: 'migration', data: { current_algorithm: 'RSA-2048', recommended: 'ML-KEM-768' } });
    } else if (msg.includes('scan') || msg.includes('trigger')) {
        reasoning.push({ step: 'intent_detection', intent: 'trigger_scan', confidence: 0.91, tools_needed: ['scan_trigger'] });
        toolCalls.push({ tool: 'scan_trigger', success: true, execution_time_ms: 156.3 });

        const scanId = 'scan-' + Math.random().toString(36).substring(2, 10);
        content = `## 🔄 Scan Initiated

- **Scan ID**: \`${scanId}\`
- **Type**: FULL
- **Status**: ✅ INITIATED
- **Scope**: Complete infrastructure
- **Estimated Duration**: 45-90 minutes
- **Description**: Full infrastructure cryptographic audit

💡 Scan ${scanId} has been initiated. You will be notified upon completion.`;

        evidence.push({ type: 'scan', data: { scan_id: scanId, status: 'initiated' } });
    } else if (msg.includes('depends') || msg.includes('graph') || msg.includes('connected') || msg.includes('blast')) {
        reasoning.push({ step: 'intent_detection', intent: 'graph_analysis', confidence: 0.85, tools_needed: ['graph_exploration'] });
        toolCalls.push({ tool: 'graph_exploration', success: true, execution_time_ms: 32.1 });

        content = `## 🗺️ System Graph: Healthcare Patient Archive

**Blast Radius**: 8 systems | **Risk Propagation**: high

### Downstream Dependencies
- → **Identity Provider Backups** (AUTHENTICATES_WITH)
- → **Kubernetes Secrets Store** (DEPENDS_ON)
- → **Healthcare Daily Backup** (BACKS_UP_TO)
- → **Public API Gateway** (CONNECTS_TO)

### Upstream Connections
- ← **Enterprise Email Gateway** (CONNECTS_TO)
- ← **Corporate VPN Gateway** (CONNECTS_TO)`;

        evidence.push({ type: 'graph', data: { blast_radius: 8 } });
    } else if (msg.includes('hndl') || msg.includes('harvest now decrypt') || msg.includes('what is hndl')) {
        reasoning.push({ step: 'intent_detection', intent: 'explain_hndl', confidence: 0.95, tools_needed: [] });

        content = `## 🔐 Harvest-Now-Decrypt-Later (HNDL) Attacks

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

\`\`\`
HNDL Risk = Data Sensitivity × Data Longevity × Crypto Weakness × Exposure Surface × Adversary Value
\`\`\`

### What You Should Do

1. **Audit** your cryptographic inventory
2. **Classify** data by secrecy requirements
3. **Prioritize** migration to Post-Quantum Cryptography (PQC)
4. **Implement** NIST PQC standards: ML-KEM (FIPS 203), ML-DSA (FIPS 204)

> 💡 Want me to analyze your specific assets? Ask me to run a risk assessment or attack simulation.`;
    } else if (msg.includes('data longevity') || msg.includes('how long') || msg.includes('secrecy') || msg.includes('retention')) {
        reasoning.push({ step: 'intent_detection', intent: 'data_longevity_check', confidence: 0.85, tools_needed: ['data_longevity'] });
        toolCalls.push({ tool: 'data_longevity', success: true, execution_time_ms: 9.8 });

        content = `## 📅 Data Longevity Analysis: Healthcare Patient Archive

- **Data Type**: PHI
- **Sensitivity**: critical
- **Required Secrecy**: **70 years** (until 2096)
- **Compliance**: HIPAA, GDPR

> **Assessment**: EXTREME — Data must remain secret well beyond quantum break window`;

        evidence.push({ type: 'data_longevity', data: { required_secrecy_years: 70 } });
    } else if (msg.includes('crypto') && (msg.includes('posture') || msg.includes('overview') || msg.includes('inventory'))) {
        reasoning.push({ step: 'intent_detection', intent: 'crypto_overview', confidence: 0.87, tools_needed: ['crypto_exposure', 'sql_query'] });
        toolCalls.push({ tool: 'crypto_exposure', success: true, execution_time_ms: 19.3 });
        toolCalls.push({ tool: 'sql_query', success: true, execution_time_ms: 22.1 });

        content = `## 🔐 Cryptographic Exposure Analysis

**Total crypto instances**: 17,843
**Quantum-vulnerable instances**: 6,556 (36.7%)
**Unique algorithms detected**: 10

### Algorithm Breakdown

- **\`RSA-2048\`** — 3,247 instances across 847 assets | ⚠️ QUANTUM VULNERABLE
- **\`ECC-P256\`** — 1,893 instances across 523 assets | ⚠️ QUANTUM VULNERABLE
- **\`AES-256\`** — 8,921 instances across 3,214 assets | ℹ️ OK
- **\`AES-128\`** — 2,341 instances across 891 assets | 🟡 GROVER-WEAKENED
- **\`ED25519\`** — 734 instances across 286 assets | ⚠️ QUANTUM VULNERABLE
- **\`RSA-4096\`** — 456 instances across 112 assets | ⚠️ QUANTUM VULNERABLE
- **\`SHA-1\`** — 456 instances across 187 assets | 🟡 DEPRECATED
- **\`RSA-1024\`** — 127 instances across 52 assets | 🔴 CRITICALLY WEAK
- **\`3DES\`** — 89 instances across 34 assets | 🟠 WEAK
- **\`KYBER-768\`** — 23 instances across 12 assets | ✅ PQC READY`;

        evidence.push({ type: 'crypto_finding', data: { total: 17843, vulnerable: 6556 } });
    } else {
        reasoning.push({ step: 'intent_detection', intent: 'general_question', confidence: 0.4, tools_needed: [] });

        content = `I'm the **QuantumShield Analyst AI** — your security copilot for quantum risk intelligence.

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

What would you like to investigate?`;
    }

    return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content,
        timestamp: Date.now() / 1000,
        tool_calls: toolCalls,
        evidence,
        reasoning,
        processing_time_ms: toolCalls.reduce((sum, tc) => sum + tc.execution_time_ms, 0) + Math.random() * 30 + 10,
    };
}


// ═══════════════════════════════════════════════
// MARKDOWN RENDERER
// ═══════════════════════════════════════════════

function renderMarkdown(text: string) {
    // Split into blocks
    const blocks = text.split('\n');
    const rendered: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    for (let i = 0; i < blocks.length; i++) {
        const line = blocks[i];

        // Code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                rendered.push(
                    <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {codeLanguage && (
                            <div className="px-4 py-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {codeLanguage}
                            </div>
                        )}
                        <pre className="px-4 py-3 text-sm font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">{codeContent}</pre>
                    </div>
                );
                inCodeBlock = false;
                codeContent = '';
                codeLanguage = '';
            } else {
                inCodeBlock = true;
                codeLanguage = line.replace('```', '').trim();
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent += (codeContent ? '\n' : '') + line;
            continue;
        }

        // Headers
        if (line.startsWith('## ')) {
            rendered.push(
                <h2 key={i} className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">
                    {line.replace('## ', '')}
                </h2>
            );
            continue;
        }
        if (line.startsWith('### ')) {
            rendered.push(
                <h3 key={i} className="text-base font-semibold text-slate-200 mt-3 mb-1.5">
                    {line.replace('### ', '')}
                </h3>
            );
            continue;
        }

        // Horizontal rule
        if (line.trim() === '---') {
            rendered.push(
                <hr key={i} className="my-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            );
            continue;
        }

        // Blockquote
        if (line.startsWith('> ')) {
            rendered.push(
                <div key={i} className="my-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', borderLeft: '3px solid rgba(99,102,241,0.4)' }}>
                    <span className="text-sm text-slate-300">{renderInline(line.replace('> ', ''))}</span>
                </div>
            );
            continue;
        }

        // List items
        if (line.match(/^\d+\.\s/)) {
            rendered.push(
                <div key={i} className="flex gap-2 my-0.5 pl-2">
                    <span className="text-indigo-400 font-mono text-sm flex-shrink-0 w-5">{line.match(/^\d+/)?.[0]}.</span>
                    <span className="text-sm text-slate-300 leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
                </div>
            );
            continue;
        }

        if (line.startsWith('- ')) {
            rendered.push(
                <div key={i} className="flex gap-2 my-0.5 pl-2">
                    <span className="text-indigo-400 mt-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                    <span className="text-sm text-slate-300 leading-relaxed">{renderInline(line.replace('- ', ''))}</span>
                </div>
            );
            continue;
        }

        // Indented items (sub-bullets)
        if (line.match(/^\s{2,}-\s/)) {
            rendered.push(
                <div key={i} className="flex gap-2 my-0.5 pl-6">
                    <span className="text-slate-500 mt-1.5 flex-shrink-0">
                        <div className="w-1 h-1 rounded-full bg-current" />
                    </span>
                    <span className="text-sm text-slate-400 leading-relaxed">{renderInline(line.trim().replace('- ', ''))}</span>
                </div>
            );
            continue;
        }

        // Table
        if (line.includes('|') && line.trim().startsWith('|')) {
            // Check if next line is separator
            if (i + 1 < blocks.length && blocks[i + 1].includes('---')) {
                // Header row
                const headers = line.split('|').filter(h => h.trim()).map(h => h.trim());
                const rows: string[][] = [];
                i += 2; // skip separator
                while (i < blocks.length && blocks[i].includes('|') && blocks[i].trim().startsWith('|')) {
                    rows.push(blocks[i].split('|').filter(c => c.trim()).map(c => c.trim()));
                    i++;
                }
                i--; // back up one since the for loop will increment

                rendered.push(
                    <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    {headers.map((h, hi) => (
                                        <th key={hi} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => (
                                    <tr key={ri} className="table-row-glass">
                                        {row.map((cell, ci) => (
                                            <td key={ci} className="px-4 py-2 text-slate-300 font-mono text-xs">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                continue;
            }
        }

        // Empty line
        if (line.trim() === '') {
            rendered.push(<div key={i} className="h-1" />);
            continue;
        }

        // Regular text
        rendered.push(
            <p key={i} className="text-sm text-slate-300 leading-relaxed my-0.5">
                {renderInline(line)}
            </p>
        );
    }

    return <div className="space-y-0">{rendered}</div>;
}

function renderInline(text: string): React.ReactNode {
    // Bold, code, italic rendering
    const parts: React.ReactNode[] = [];
    let key = 0;

    // Process the text with regex matching for inline formatting
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }

        const matched = match[0];
        if (matched.startsWith('**')) {
            parts.push(<strong key={key++} className="text-white font-semibold">{matched.slice(2, -2)}</strong>);
        } else if (matched.startsWith('`')) {
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {matched.slice(1, -1)}
                </code>
            );
        } else if (matched.startsWith('*')) {
            parts.push(<em key={key++} className="text-slate-200">{matched.slice(1, -1)}</em>);
        }

        lastIndex = match.index + matched.length;
    }

    // Remaining text
    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? <>{parts}</> : text;
}


// ═══════════════════════════════════════════════
// TOOL BADGE COMPONENT
// ═══════════════════════════════════════════════

function ToolBadge({ tool }: { tool: ToolCall }) {
    const toolNames: Record<string, string> = {
        risk_intelligence: 'Risk Engine',
        asset_search: 'Asset Search',
        crypto_exposure: 'Crypto Exposure',
        data_longevity: 'Data Longevity',
        scan_trigger: 'Scan Trigger',
        graph_exploration: 'Graph Explorer',
        quantum_timeline: 'Quantum Timeline',
        attack_simulation: 'Attack Sim',
        migration_advisor: 'Migration Advisor',
        sql_query: 'SQL Query',
    };

    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{
            background: tool.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${tool.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: tool.success ? '#4ade80' : '#f87171',
        }}>
            <Wrench className="w-3 h-3" />
            {toolNames[tool.tool] || tool.tool}
            <span className="text-[10px] opacity-60">{tool.execution_time_ms.toFixed(0)}ms</span>
        </div>
    );
}


// ═══════════════════════════════════════════════
// REASONING ACCORDION
// ═══════════════════════════════════════════════

function ReasoningTrace({ reasoning }: { reasoning: ReasoningStep[] }) {
    const [expanded, setExpanded] = useState(false);

    if (!reasoning?.length) return null;

    return (
        <div className="mt-2">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
                <Terminal className="w-3 h-3" />
                Agent Reasoning ({reasoning.length} steps)
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expanded && (
                <div className="mt-2 ml-1 space-y-1.5 animate-in fade-in-50 duration-200">
                    {reasoning.map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] font-mono text-slate-500 pl-3" style={{ borderLeft: '2px solid rgba(99,102,241,0.2)' }}>
                            <span className="text-indigo-400 flex-shrink-0 mt-0.5">{i + 1}.</span>
                            <div>
                                <span className="text-slate-400">{step.step}</span>
                                {step.intent && <span className="text-indigo-300 ml-1">→ {step.intent}</span>}
                                {step.confidence !== undefined && (
                                    <span className="text-slate-600 ml-1">({(step.confidence * 100).toFixed(0)}% conf)</span>
                                )}
                                {step.tools_needed?.length ? (
                                    <span className="text-emerald-400/60 ml-1">tools: [{step.tools_needed.join(', ')}]</span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════
// MESSAGE COMPONENT
// ═══════════════════════════════════════════════

function ChatMessageBubble({ message }: { message: ChatMessage }) {
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [message.content]);

    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.1)',
                }}>
                    <Bot className="w-4 h-4 text-indigo-400" />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
                {/* Tool calls bar */}
                {!isUser && message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {message.tool_calls.map((tc, i) => (
                            <ToolBadge key={i} tool={tc} />
                        ))}
                    </div>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-2xl px-5 py-4 relative ${isUser ? '' : ''}`}
                    style={isUser ? {
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    } : {
                        background: 'rgba(17,24,39,0.9)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    }}
                >
                    {isUser ? (
                        <p className="text-sm text-white leading-relaxed">{message.content}</p>
                    ) : (
                        renderMarkdown(message.content)
                    )}

                    {/* Copy button for assistant messages */}
                    {!isUser && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5"
                            title="Copy response"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        </button>
                    )}
                </div>

                {/* Reasoning trace */}
                {!isUser && message.reasoning && (
                    <ReasoningTrace reasoning={message.reasoning} />
                )}

                {/* Metadata */}
                <div className={`flex items-center gap-3 mt-1.5 ${isUser ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(message.timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && message.processing_time_ms && (
                        <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            {message.processing_time_ms.toFixed(0)}ms
                        </span>
                    )}
                </div>
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)',
                    border: '1px solid rgba(99,102,241,0.15)',
                }}>
                    <User className="w-4 h-4 text-slate-300" />
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════
// SUGGESTION CARD
// ═══════════════════════════════════════════════

function SuggestionCard({ suggestion, onClick }: { suggestion: Suggestion; onClick: () => void }) {
    const IconComponent = SUGGESTION_ICONS[suggestion.icon] || Shield;

    return (
        <button
            onClick={onClick}
            className="group text-left p-4 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            style={{
                background: 'rgba(17,24,39,0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(17,24,39,0.6)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
            }}
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                    <IconComponent className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-200 leading-relaxed group-hover:text-white transition-colors">{suggestion.text}</p>
                    <span className="text-[10px] text-indigo-400/60 font-medium mt-1 block">{suggestion.category}</span>
                </div>
            </div>
        </button>
    );
}


// ═══════════════════════════════════════════════
// MAIN CHAT INTERFACE
// ═══════════════════════════════════════════════

export function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const suggestions: Suggestion[] = [
        { text: 'Which systems are most at risk from HNDL attacks?', category: 'Risk Analysis', icon: 'shield-alert' },
        { text: 'Where are we still using RSA-2048?', category: 'Crypto Discovery', icon: 'lock' },
        { text: 'Simulate an attack on the healthcare archive', category: 'Attack Simulation', icon: 'swords' },
        { text: 'Show quantum threat timeline for all algorithms', category: 'Quantum Intelligence', icon: 'clock' },
        { text: 'What depends on the identity provider?', category: 'Graph Analysis', icon: 'network' },
        { text: 'How should we migrate RSA-2048 to PQC?', category: 'Migration', icon: 'arrow-right-left' },
        { text: 'What is Harvest-Now-Decrypt-Later?', category: 'Education', icon: 'book-open' },
        { text: 'Trigger a full infrastructure scan', category: 'Operations', icon: 'scan' },
    ];

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const sendMessage = useCallback(async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage: ChatMessage = {
            id: 'msg-' + Date.now(),
            role: 'user',
            content: text,
            timestamp: Date.now() / 1000,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Try backend first
            const response = await fetch(`${BACKEND_URL}/api/v1/agent/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, session_id: sessionId }),
            });

            if (response.ok) {
                const data = await response.json();
                setSessionId(data.session_id);
                const assistantMessage: ChatMessage = {
                    id: 'msg-' + Date.now(),
                    role: 'assistant',
                    content: data.message,
                    timestamp: data.timestamp || Date.now() / 1000,
                    tool_calls: data.tool_calls,
                    evidence: data.evidence,
                    reasoning: data.reasoning,
                    processing_time_ms: data.processing_time_ms,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else {
                throw new Error('Backend unavailable');
            }
        } catch {
            // Fallback to client-side simulation
            await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
            const simulated = simulateAgentResponse(text);
            setMessages((prev) => [...prev, simulated]);
        }

        setIsLoading(false);
    }, [input, isLoading, sessionId]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setSessionId(null);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-7.5rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.15)',
                    }}>
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">QuantumShield Analyst AI</h1>
                        <p className="text-xs text-slate-500 font-medium">Security copilot with tool-based reasoning</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <RotateCcw className="w-3 h-3" />
                        Clear
                    </button>
                )}
            </div>

            {/* Messages or Welcome */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarGutter: 'stable' }}>
                {messages.length === 0 ? (
                    /* Welcome Screen */
                    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4">
                        {/* Logo */}
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            boxShadow: '0 8px 32px rgba(99,102,241,0.15)',
                        }}>
                            <Shield className="w-10 h-10 text-indigo-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">QuantumShield Analyst AI</h2>
                        <p className="text-sm text-slate-400 text-center mb-8 max-w-md leading-relaxed">
                            Your AI-powered security copilot for quantum risk intelligence.
                            Ask questions, trigger scans, simulate attacks, and plan PQC migrations.
                        </p>

                        {/* Capabilities badges */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {['10 Security Tools', 'HNDL Analysis', 'Attack Simulation', 'PQC Migration'].map((cap) => (
                                <span key={cap} className="px-3 py-1 rounded-full text-[11px] font-medium text-indigo-300" style={{
                                    background: 'rgba(99,102,241,0.1)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                }}>
                                    {cap}
                                </span>
                            ))}
                        </div>

                        {/* Suggestions grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                            {suggestions.map((suggestion, i) => (
                                <SuggestionCard
                                    key={i}
                                    suggestion={suggestion}
                                    onClick={() => sendMessage(suggestion.text)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Messages List */
                    <div className="space-y-6 py-4 max-w-4xl mx-auto">
                        {messages.map((msg) => (
                            <ChatMessageBubble key={msg.id} message={msg} />
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                }}>
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="rounded-2xl px-5 py-4" style={{
                                    background: 'rgba(17,24,39,0.9)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">Analyzing</span>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="flex-shrink-0 pt-4">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-2xl transition-all duration-300" style={{
                        background: 'rgba(17,24,39,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                        onFocus={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)';
                        }}
                        onBlur={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                        }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about quantum risk, crypto exposure, HNDL threats..."
                            rows={1}
                            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 resize-none px-5 py-4 pr-14 outline-none rounded-2xl"
                            style={{ minHeight: '52px', maxHeight: '160px' }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-3 bottom-3 p-2 rounded-xl transition-all duration-200 disabled:opacity-30"
                            style={{
                                background: input.trim() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.06)',
                                boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                            }}
                        >
                            <Send className="w-4 h-4 text-white" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-2">
                        <p className="text-[10px] text-slate-600">
                            QuantumShield Analyst AI • Tool-based reasoning • {messages.length} message{messages.length !== 1 ? 's' : ''} in session
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-600">
                            <Info className="w-3 h-3" />
                            Press Enter to send, Shift+Enter for new line
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
