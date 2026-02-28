'use client';

import { useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Server,
  Lock,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';

// ── Simulation logic ──

interface SimulationParams {
  qubits: number;
  errorRate: number;
  timelineYears: number;
}

interface SimulationResult {
  systemsAtRisk: number;
  dataExposed: number;
  decryptionTimeHours: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  algorithmsBreakable: { name: string; broken: boolean; timeToBreak: string }[];
  attackSuccess: number; // percentage
  recommendation: string;
}

function runSimulation(params: SimulationParams): SimulationResult {
  const { qubits, errorRate, timelineYears } = params;

  // Effective qubit power (error correction reduces usable qubits)
  const effectiveQubits = qubits * (1 - errorRate / 100) * 0.8;
  const yearFactor = Math.min(timelineYears / 10, 3);

  // Algorithm breakability thresholds (effective qubits needed)
  const algorithms = [
    { name: '3DES', threshold: 100, assets: 89 },
    { name: 'RSA-1024', threshold: 200, assets: 127 },
    { name: 'RSA-2048', threshold: 400, assets: 3247 },
    { name: 'ECC-P256', threshold: 350, assets: 1893 },
    { name: 'RSA-3072', threshold: 600, assets: 456 },
    { name: 'ED25519', threshold: 500, assets: 734 },
    { name: 'RSA-4096', threshold: 800, assets: 456 },
    { name: 'ECC-P384', threshold: 700, assets: 312 },
    { name: 'AES-128', threshold: 1200, assets: 2341 },
    { name: 'AES-256', threshold: 1800, assets: 8921 },
  ];

  const projectedQubits = effectiveQubits * (1 + yearFactor * 0.6);

  const algorithmsBreakable = algorithms.map((algo) => {
    const broken = projectedQubits >= algo.threshold;
    const ratio = projectedQubits / algo.threshold;
    let timeToBreak: string;
    if (ratio >= 2) timeToBreak = '< 1 hour';
    else if (ratio >= 1.5) timeToBreak = '~2-6 hours';
    else if (ratio >= 1) timeToBreak = '~12-48 hours';
    else if (ratio >= 0.8) timeToBreak = '~1-3 years';
    else timeToBreak = 'Not feasible';
    return { name: algo.name, broken, timeToBreak };
  });

  const brokenAlgos = algorithms.filter((a) => projectedQubits >= a.threshold);
  const systemsAtRisk = brokenAlgos.reduce((sum, a) => sum + a.assets, 0);
  const totalAssets = algorithms.reduce((sum, a) => sum + a.assets, 0);
  const dataExposed = Math.round(systemsAtRisk * 0.26);
  const attackSuccess = Math.min(Math.round((systemsAtRisk / totalAssets) * 100), 100);

  // Decryption time estimate
  const avgDecryptionHours = brokenAlgos.length > 0
    ? brokenAlgos.reduce((sum, a) => {
      const ratio = projectedQubits / a.threshold;
      if (ratio >= 2) return sum + 0.5;
      if (ratio >= 1.5) return sum + 4;
      return sum + 24;
    }, 0) / brokenAlgos.length
    : 0;

  let riskLevel: SimulationResult['riskLevel'];
  if (attackSuccess >= 60) riskLevel = 'CRITICAL';
  else if (attackSuccess >= 40) riskLevel = 'HIGH';
  else if (attackSuccess >= 15) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  let recommendation: string;
  if (riskLevel === 'CRITICAL') {
    recommendation = 'IMMEDIATE ACTION: Begin emergency PQC migration. Prioritize internet-facing RSA-2048 and ECC systems. Deploy hybrid TLS with ML-KEM-768 within 90 days.';
  } else if (riskLevel === 'HIGH') {
    recommendation = 'HIGH PRIORITY: Schedule PQC migration for all RSA and ECC assets within 6 months. Focus on critical data systems first.';
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'PLAN AHEAD: Begin PQC migration planning. Audit all legacy cryptographic implementations and create a phased migration roadmap.';
  } else {
    recommendation = 'MONITOR: Current cryptographic posture is adequate for this scenario. Continue monitoring quantum computing developments.';
  }

  return {
    systemsAtRisk,
    dataExposed,
    decryptionTimeHours: Math.round(avgDecryptionHours * 10) / 10,
    riskLevel,
    algorithmsBreakable,
    attackSuccess,
    recommendation,
  };
}

// ── Risk level styling ──

function getRiskStyle(level: string) {
  switch (level) {
    case 'CRITICAL': return { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', glow: 'rgba(239,68,68,0.2)' };
    case 'HIGH': return { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', glow: 'rgba(245,158,11,0.2)' };
    case 'MEDIUM': return { color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', glow: 'rgba(99,102,241,0.2)' };
    default: return { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', glow: 'rgba(34,197,94,0.2)' };
  }
}

// ── Main page component ──

export default function AttackSimulationPage() {
  const [qubits, setQubits] = useState(500);
  const [errorRate, setErrorRate] = useState(5);
  const [timelineYears, setTimelineYears] = useState(5);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const handleRunSimulation = useCallback(() => {
    setIsRunning(true);
    setResult(null);

    // Simulate processing time for realism
    setTimeout(() => {
      const simResult = runSimulation({ qubits, errorRate, timelineYears });
      setResult(simResult);
      setIsRunning(false);
      setHasRun(true);
    }, 1200 + Math.random() * 800);
  }, [qubits, errorRate, timelineYears]);

  const riskStyle = result ? getRiskStyle(result.riskLevel) : null;
  const currentYear = new Date().getFullYear();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(245,158,11,0.15) 100%)',
                border: '1px solid rgba(239,68,68,0.25)',
                boxShadow: '0 4px 16px rgba(239,68,68,0.15)',
              }}
            >
              <Zap className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Attack Simulation Lab</h1>
              <p className="text-sm text-slate-400">Model quantum cryptographic attack scenarios against your infrastructure</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Scenario Configuration Panel ── */}
          <div
            className="lg:col-span-2 glass-card p-6 space-y-6"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Scenario Configuration</h3>
            </div>

            {/* Slider: Quantum Computer Power */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Quantum Computer Power (Logical Qubits)
                </label>
                <span className="text-xs font-mono text-indigo-300 px-2 py-0.5 rounded-md" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {qubits.toLocaleString()} qubits
                </span>
              </div>
              <Slider
                value={[qubits]}
                onValueChange={([v]) => setQubits(v)}
                min={50}
                max={4000}
                step={50}
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>50</span>
                <span>1,000</span>
                <span>2,000</span>
                <span>3,000</span>
                <span>4,000</span>
              </div>
            </div>

            {/* Slider: Error Correction Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  Error Correction Rate
                </label>
                <span className="text-xs font-mono text-amber-300 px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {errorRate}% logical error rate
                </span>
              </div>
              <Slider
                value={[errorRate]}
                onValueChange={([v]) => setErrorRate(v)}
                min={0.1}
                max={20}
                step={0.5}
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>0.1%</span>
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Slider: Attack Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Attack Timeline
                </label>
                <span className="text-xs font-mono text-sky-300 px-2 py-0.5 rounded-md" style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  Year {currentYear + timelineYears} ({timelineYears}yr from now)
                </span>
              </div>
              <Slider
                value={[timelineYears]}
                onValueChange={([v]) => setTimelineYears(v)}
                min={1}
                max={30}
                step={1}
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>{currentYear + 1}</span>
                <span>{currentYear + 10}</span>
                <span>{currentYear + 20}</span>
                <span>{currentYear + 30}</span>
              </div>
            </div>

            {/* Run Button */}
            <Button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full h-12 text-sm font-bold text-white rounded-xl transition-all duration-300"
              style={{
                background: isRunning
                  ? 'rgba(99,102,241,0.3)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                boxShadow: isRunning
                  ? 'none'
                  : '0 4px 20px rgba(239,68,68,0.3), 0 0 0 1px rgba(239,68,68,0.1)',
              }}
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Simulation...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Run Simulation
                </span>
              )}
            </Button>
          </div>

          {/* ── Results Panel ── */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Results</h3>
            </div>

            {!hasRun && !isRunning && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <Zap className="w-7 h-7 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">Configure parameters and click<br /><strong className="text-slate-400">Run Simulation</strong> to see results</p>
              </div>
            )}

            {isRunning && (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-400">Computing attack vectors...</p>
              </div>
            )}

            {result && !isRunning && (
              <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">
                {/* Risk Level Badge */}
                <div
                  className="p-4 rounded-xl text-center"
                  style={{
                    background: riskStyle!.bg,
                    border: `1px solid ${riskStyle!.border}`,
                    boxShadow: `0 4px 16px ${riskStyle!.glow}`,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Overall Risk</p>
                  <p className="text-2xl font-black" style={{ color: riskStyle!.color }}>
                    {result.riskLevel}
                  </p>
                </div>

                {/* Metric Cards */}
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">Systems at Risk</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{result.systemsAtRisk.toLocaleString()}</p>
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">Data Records Exposed</p>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{result.dataExposed.toLocaleString()}</p>
                  </div>

                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">Avg. Decryption Time</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {result.decryptionTimeHours > 0 ? `~${result.decryptionTimeHours} hours` : 'N/A'}
                    </p>
                  </div>

                  {/* Attack Success Rate */}
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">Attack Success</p>
                      <span className="text-sm font-bold" style={{ color: riskStyle!.color }}>
                        {result.attackSuccess}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${result.attackSuccess}%`,
                          background: `linear-gradient(90deg, ${riskStyle!.color}, ${riskStyle!.color}88)`,
                          boxShadow: `0 0 8px ${riskStyle!.glow}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Algorithm Breakability Table ── */}
        {result && !isRunning && (
          <div className="glass-card overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="p-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Algorithm Vulnerability Analysis</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th className="px-6 py-3 text-left table-label">Algorithm</th>
                    <th className="px-6 py-3 text-center table-label">Status</th>
                    <th className="px-6 py-3 text-center table-label">Time to Break</th>
                  </tr>
                </thead>
                <tbody>
                  {result.algorithmsBreakable.map((algo) => (
                    <tr
                      key={algo.name}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <td className="px-6 py-3">
                        <span className="font-mono text-xs text-slate-200">{algo.name}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {algo.broken ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            BROKEN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            SAFE
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-xs font-mono ${algo.broken ? 'text-red-300' : 'text-slate-500'}`}>
                          {algo.timeToBreak}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendation */}
            <div className="p-5 border-t border-white/[0.04]">
              <div
                className="p-4 rounded-xl"
                style={{
                  background: riskStyle!.bg,
                  borderLeft: `3px solid ${riskStyle!.color}`,
                }}
              >
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Recommendation</p>
                <p className="text-sm text-slate-200 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
