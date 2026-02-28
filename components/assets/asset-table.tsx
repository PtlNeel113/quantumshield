'use client';

import { useState, Fragment } from 'react';
import { Search, ChevronDown, Zap, Activity, Globe, Server, Database, HardDrive, Terminal, X, Shield, AlertTriangle, Clock, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Asset } from '@/types';

// Region flag emoji map
const regionFlags: Record<string, { flag: string; label: string }> = {
  'us-east-1': { flag: '🇺🇸', label: 'Virginia' },
  'us-west-2': { flag: '🇺🇸', label: 'Oregon' },
  'eu-west-1': { flag: '🇪🇺', label: 'Ireland' },
  'ap-south-1': { flag: '🇮🇳', label: 'Mumbai' },
};

// Mock asset data
const mockAssets: Asset[] = [
  {
    id: 'ASSET-001',
    name: 'api-gateway-prod',
    type: 'Load Balancer',
    location: 'us-east-1',
    algorithm: 'RSA-2048',
    keyLength: 2048,
    exposureSurface: 'Internet',
    sensitivity: 'Critical',
    retentionPeriod: '7 years',
    quantumRiskScore: 8.7,
    dependencies: ['db-cluster-1', 'cache-redis-1'],
    lastScanned: '2025-02-28T14:23:15Z',
  },
  {
    id: 'ASSET-002',
    name: 'db-cluster-1',
    type: 'Database',
    location: 'us-east-1',
    algorithm: 'ECC-256',
    keyLength: 256,
    exposureSurface: 'Internal',
    sensitivity: 'Critical',
    retentionPeriod: '20+ years',
    quantumRiskScore: 9.2,
    dependencies: [],
    lastScanned: '2025-02-28T14:20:00Z',
  },
  {
    id: 'ASSET-003',
    name: 'cache-redis-1',
    type: 'Cache',
    location: 'us-west-2',
    algorithm: 'RSA-4096',
    keyLength: 4096,
    exposureSurface: 'Internal',
    sensitivity: 'High',
    retentionPeriod: '5 years',
    quantumRiskScore: 6.1,
    dependencies: [],
    lastScanned: '2025-02-28T14:15:00Z',
  },
  {
    id: 'ASSET-004',
    name: 'backup-archive-001',
    type: 'Storage',
    location: 'us-east-1',
    algorithm: 'AES-256',
    keyLength: 256,
    exposureSurface: 'Offline',
    sensitivity: 'High',
    retentionPeriod: '20+ years',
    quantumRiskScore: 4.2,
    dependencies: [],
    lastScanned: '2025-02-27T10:00:00Z',
  },
  {
    id: 'ASSET-005',
    name: 'ssh-bastion-prod',
    type: 'Bastion Host',
    location: 'eu-west-1',
    algorithm: 'RSA-2048',
    keyLength: 2048,
    exposureSurface: 'Internet',
    sensitivity: 'Medium',
    retentionPeriod: '3 years',
    quantumRiskScore: 7.8,
    dependencies: [],
    lastScanned: '2025-02-28T13:45:00Z',
  },
];

function getAlgorithmBadge(algorithm: string) {
  if (algorithm.includes('RSA-2048') || algorithm.includes('RSA-3072'))
    return { class: 'algo-badge-red', label: 'Vulnerable' };
  if (algorithm.includes('ECC'))
    return { class: 'algo-badge-orange', label: 'At Risk' };
  if (algorithm.includes('AES'))
    return { class: 'algo-badge-blue', label: 'Quantum-Safe' };
  return { class: 'algo-badge-gray', label: 'Unknown' };
}

function getRiskBarStyle(score: number) {
  if (score >= 8) return {
    gradient: 'linear-gradient(90deg, #ef4444, #f87171)',
    glow: '0 0 8px rgba(239,68,68,0.3)',
    color: '#fca5a5',
  };
  if (score >= 6) return {
    gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    glow: '0 0 8px rgba(245,158,11,0.3)',
    color: '#fcd34d',
  };
  if (score >= 4) return {
    gradient: 'linear-gradient(90deg, #6366f1, #818cf8)',
    glow: '0 0 8px rgba(99,102,241,0.3)',
    color: '#a5b4fc',
  };
  return {
    gradient: 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
    glow: '0 0 8px rgba(56,189,248,0.2)',
    color: '#7dd3fc',
  };
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'Load Balancer': return <Globe className="w-3.5 h-3.5" />;
    case 'Database': return <Database className="w-3.5 h-3.5" />;
    case 'Cache': return <Server className="w-3.5 h-3.5" />;
    case 'Storage': return <HardDrive className="w-3.5 h-3.5" />;
    case 'Bastion Host': return <Terminal className="w-3.5 h-3.5" />;
    default: return <Server className="w-3.5 h-3.5" />;
  }
}

function getSensitivityStyle(sensitivity: string) {
  if (sensitivity === 'Critical') return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#fca5a5' };
  if (sensitivity === 'High') return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#fcd34d' };
  if (sensitivity === 'Medium') return { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#a5b4fc' };
  return { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#94a3b8' };
}

// Asset Detail Modal
function AssetDetailModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const algoBadge = getAlgorithmBadge(asset.algorithm);
  const riskStyle = getRiskBarStyle(asset.quantumRiskScore);
  const region = regionFlags[asset.location] || { flag: '🌐', label: asset.location };
  const sensitivityStyle = getSensitivityStyle(asset.sensitivity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
          animation: 'fadeInUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.15)' }}>
              {getTypeIcon(asset.type)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{asset.name}</h2>
              <p className="text-xs font-mono text-indigo-400">{asset.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Score Banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums" style={{ color: riskStyle.color }}>{asset.quantumRiskScore.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Score</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(asset.quantumRiskScore / 10) * 100}%`, background: riskStyle.gradient, boxShadow: riskStyle.glow }} />
              </div>
              <p className="text-xs text-slate-400">
                {asset.quantumRiskScore >= 8 ? '⚠️ Critical risk — immediate migration recommended' :
                  asset.quantumRiskScore >= 6 ? '🔶 High risk — plan migration within 6 months' :
                    asset.quantumRiskScore >= 4 ? '🔵 Moderate risk — schedule migration' :
                      '✅ Low risk — monitor periodically'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"><Lock className="w-3 h-3" /> Algorithm</p>
              <p className="text-sm font-mono font-bold text-white">{asset.algorithm}</p>
              <span className={`${algoBadge.class} text-[10px]`}>{algoBadge.label}</span>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Key Length</p>
              <p className="text-sm font-mono font-bold text-white">{asset.keyLength} bits</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Type</p>
              <p className="text-sm font-medium text-white">{asset.type}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Region</p>
              <p className="text-sm text-white">{region.flag} {region.label}</p>
              <p className="text-[10px] font-mono text-slate-500">{asset.location}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"><Shield className="w-3 h-3" /> Sensitivity</p>
              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: sensitivityStyle.bg, border: `1px solid ${sensitivityStyle.border}`, color: sensitivityStyle.color }}>{asset.sensitivity}</span>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Exposure</p>
              <p className="text-sm font-medium text-white">{asset.exposureSurface}</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Retention Period</p>
              <p className="text-sm font-medium text-white">{asset.retentionPeriod}</p>
            </div>
            <div className="space-y-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Last Scanned</p>
              <p className="text-sm font-mono text-white">{new Date(asset.lastScanned).toLocaleString()}</p>
            </div>
          </div>

          {/* Dependencies */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Dependencies</p>
            {asset.dependencies.length === 0 ? (
              <p className="text-sm text-slate-400">No dependencies linked</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {asset.dependencies.map((dep) => (
                  <span key={dep} className="px-3 py-1 rounded-lg text-xs font-mono text-indigo-300" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {dep}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-2 font-semibold">Migration Recommendation</p>
            <p className="text-sm text-slate-300">
              {asset.algorithm.includes('RSA-2048') ? 'Migrate to Kyber-1024 + RSA-4096 hybrid scheme immediately. This algorithm is vulnerable to Shor\'s algorithm on quantum computers.' :
                asset.algorithm.includes('ECC') ? 'Migrate to Dilithium + ECC-P521 hybrid. ECC is vulnerable to quantum attacks. Plan migration within Q4 2025.' :
                  asset.algorithm.includes('RSA-4096') ? 'Upgrade to Falcon-1024 + RSA-6144. While RSA-4096 offers some buffer, quantum migration should be planned for Q2 2026.' :
                    asset.algorithm.includes('AES') ? 'AES-256 is considered quantum-safe against Grover\'s algorithm. Continue monitoring for new developments.' :
                      'Review algorithm and plan for post-quantum migration.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssetTable() {
  const [assets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}

      <div className="glass-card overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search assets by name, ID, or algorithm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 py-2.5 h-10 text-sm placeholder:text-slate-500 transition-all duration-200 border-0"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                }}
              />
            </div>
            <div className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
              {filteredAssets.length} results
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <th className="px-6 py-3.5 text-left table-label">Asset</th>
                <th className="px-6 py-3.5 text-left table-label">Type</th>
                <th className="px-6 py-3.5 text-left table-label">Algorithm</th>
                <th className="px-6 py-3.5 text-left table-label">Region</th>
                <th className="px-6 py-3.5 text-left table-label">Sensitivity</th>
                <th className="px-6 py-3.5 text-left table-label">Retention</th>
                <th className="px-6 py-3.5 text-center table-label" style={{ minWidth: '140px' }}>Risk Score</th>
                <th className="px-6 py-3.5 text-left table-label" />
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const algoBadge = getAlgorithmBadge(asset.algorithm);
                const riskStyle = getRiskBarStyle(asset.quantumRiskScore);
                const region = regionFlags[asset.location] || { flag: '🌐', label: asset.location };
                const sensitivityStyle = getSensitivityStyle(asset.sensitivity);
                const isExpanded = expandedRow === asset.id;

                return (
                  <Fragment key={asset.id}>
                    <tr
                      className="group cursor-pointer transition-all duration-200"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                      }}
                      onClick={() => setExpandedRow(isExpanded ? null : asset.id)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Asset Name */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="font-mono text-xs text-indigo-400 font-semibold group-hover:text-indigo-300 transition-colors">
                            {asset.id}
                          </p>
                          <p className="text-sm text-slate-300 font-medium">{asset.name}</p>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            {getTypeIcon(asset.type)}
                          </div>
                          <span className="text-sm text-slate-300">{asset.type}</span>
                        </div>
                      </td>

                      {/* Algorithm Badge */}
                      <td className="px-6 py-4">
                        <span className={algoBadge.class}>{asset.algorithm}</span>
                      </td>

                      {/* Region */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{region.flag}</span>
                          <div>
                            <span className="text-xs text-slate-400 font-mono">{asset.location}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sensitivity */}
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: sensitivityStyle.bg,
                            border: `1px solid ${sensitivityStyle.border}`,
                            color: sensitivityStyle.color,
                          }}
                        >
                          {asset.sensitivity}
                        </span>
                      </td>

                      {/* Retention */}
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {asset.retentionPeriod}
                      </td>

                      {/* Risk Score with animated bar */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-sm tabular-nums" style={{ color: riskStyle.color }}>
                              {asset.quantumRiskScore.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-600">/10</span>
                          </div>
                          <div
                            className="h-1.5 w-full rounded-full overflow-hidden mx-auto"
                            style={{ background: 'rgba(255,255,255,0.06)', maxWidth: '100px' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${(asset.quantumRiskScore / 10) * 100}%`,
                                background: riskStyle.gradient,
                                boxShadow: riskStyle.glow,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expand */}
                      <td className="px-6 py-4 text-right">
                        <ChevronDown
                          className={`w-4 h-4 transition-all duration-300 text-slate-600 group-hover:text-slate-400 ${isExpanded ? 'rotate-180' : ''
                            }`}
                        />
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <tr key={`${asset.id}-details`}>
                        <td colSpan={8}>
                          <div
                            className="px-6 py-5 space-y-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(99,102,241,0.01) 100%)',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              animation: 'fadeInUp 0.3s ease-out',
                            }}
                          >
                            <div className="grid grid-cols-4 gap-6 text-sm">
                              <div className="space-y-1.5">
                                <p className="table-label">Exposure Surface</p>
                                <p className="text-slate-200 font-medium">{asset.exposureSurface}</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="table-label">Key Length</p>
                                <p className="text-slate-200 font-mono text-xs">{asset.keyLength} bits</p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="table-label">Last Scanned</p>
                                <p className="text-slate-200 font-mono text-xs"
                                  style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    display: 'inline-block',
                                  }}
                                >
                                  {new Date(asset.lastScanned).toLocaleString()}
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <p className="table-label">Dependencies</p>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                                  <p className="text-slate-200 text-sm">
                                    {asset.dependencies.length === 0
                                      ? 'No dependencies'
                                      : `${asset.dependencies.length} linked assets`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="h-9 text-xs font-semibold text-white rounded-xl transition-all duration-300"
                              style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAsset(asset);
                              }}
                            >
                              <Zap className="w-3.5 h-3.5 mr-1.5" />
                              View Full Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 text-[11px] text-slate-500 font-mono tabular-nums" style={{
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          Showing {filteredAssets.length} of {assets.length} assets · Last updated 2 min ago
        </div>
      </div>
    </>
  );
}
