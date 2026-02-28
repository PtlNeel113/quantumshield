'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, X, ArrowRight, Clock, Shield, Cpu, Server } from 'lucide-react';

interface MigrationPath {
  from: string;
  to: string;
  timeline: string;
  complexity: string;
  systems: number;
  priority: string;
}

const migrationPaths: MigrationPath[] = [
  {
    from: 'RSA-2048',
    to: 'Kyber-1024 + RSA-4096',
    timeline: 'Immediate',
    complexity: 'High',
    systems: 3247,
    priority: 'critical',
  },
  {
    from: 'ECC-P256',
    to: 'Dilithium + ECC-P521',
    timeline: 'Q4 2025',
    complexity: 'Medium',
    systems: 2140,
    priority: 'high',
  },
  {
    from: 'RSA-4096',
    to: 'Falcon-1024 + RSA-6144',
    timeline: 'Q2 2026',
    complexity: 'Medium',
    systems: 1804,
    priority: 'medium',
  },
];

const roadmapData: Record<string, { phases: { title: string; duration: string; tasks: string[]; status: string }[]; risks: string[]; benefits: string[] }> = {
  'RSA-2048': {
    phases: [
      {
        title: 'Phase 1: Assessment & Planning',
        duration: '2 weeks',
        tasks: [
          'Inventory all RSA-2048 certificates and keys',
          'Map dependencies between systems',
          'Identify critical path systems',
          'Create rollback procedures',
        ],
        status: 'completed',
      },
      {
        title: 'Phase 2: Development Environment',
        duration: '4 weeks',
        tasks: [
          'Deploy Kyber-1024 in dev/staging environments',
          'Update TLS configurations for hybrid mode',
          'Run compatibility tests with all client libraries',
          'Performance benchmarking (latency, throughput)',
        ],
        status: 'in-progress',
      },
      {
        title: 'Phase 3: Staged Rollout',
        duration: '6 weeks',
        tasks: [
          'Migrate internal APIs first (low risk)',
          'Update load balancer certificates',
          'Migrate customer-facing endpoints by region',
          'Monitor for handshake failures and fallback rates',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 4: Validation & Cleanup',
        duration: '2 weeks',
        tasks: [
          'Verify all systems using post-quantum algorithms',
          'Remove legacy RSA-2048 key material',
          'Update compliance documentation',
          'Final security audit and penetration testing',
        ],
        status: 'pending',
      },
    ],
    risks: [
      'Client compatibility issues with older TLS libraries',
      'Increased handshake latency (~15-20% for hybrid mode)',
      'Certificate chain validation with legacy systems',
      'Key size increase may impact storage and bandwidth',
    ],
    benefits: [
      'Protection against "harvest now, decrypt later" attacks',
      'Future-proof against quantum computing threats',
      'Compliance with NIST PQC standards',
      'Hybrid mode ensures backward compatibility',
    ],
  },
  'ECC-P256': {
    phases: [
      {
        title: 'Phase 1: Algorithm Evaluation',
        duration: '3 weeks',
        tasks: [
          'Evaluate Dilithium variants for each use case',
          'Test signature sizes and verification times',
          'Assess impact on existing PKI infrastructure',
          'Plan hybrid ECC-P521 + Dilithium deployment',
        ],
        status: 'in-progress',
      },
      {
        title: 'Phase 2: Infrastructure Updates',
        duration: '5 weeks',
        tasks: [
          'Update HSMs to support Dilithium',
          'Modify certificate issuance workflows',
          'Deploy hybrid signing in test environment',
          'Validate with third-party integrations',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 3: Production Migration',
        duration: '8 weeks',
        tasks: [
          'Migrate code signing certificates first',
          'Update API authentication tokens',
          'Roll out to database connections by cluster',
          'Parallel run with old and new algorithms',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 4: Decommission Legacy',
        duration: '3 weeks',
        tasks: [
          'Phase out ECC-P256 entirely',
          'Rotate all remaining keys to Dilithium',
          'Archive compliance evidence',
          'Update disaster recovery procedures',
        ],
        status: 'pending',
      },
    ],
    risks: [
      'Dilithium signatures are larger (2.4KB vs 64 bytes)',
      'HSM firmware updates may cause temporary downtime',
      'Third-party API compatibility concerns',
      'Performance impact on high-throughput signing operations',
    ],
    benefits: [
      'Dilithium is NIST-standardized (FIPS 204)',
      'Stronger security margins than ECC',
      'Efficient verification despite larger signatures',
      'Well-suited for authentication and integrity use cases',
    ],
  },
  'RSA-4096': {
    phases: [
      {
        title: 'Phase 1: Planning & Preparation',
        duration: '2 weeks',
        tasks: [
          'Catalog all RSA-4096 usage across infrastructure',
          'Evaluate Falcon-1024 compatibility requirements',
          'Design hybrid transition architecture',
          'Establish monitoring and alerting baselines',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 2: Pilot Deployment',
        duration: '6 weeks',
        tasks: [
          'Deploy Falcon-1024 in isolated test environment',
          'Benchmark lattice-based operations vs RSA-4096',
          'Test with critical application workflows',
          'Validate key generation and management procedures',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 3: Gradual Migration',
        duration: '10 weeks',
        tasks: [
          'Start with non-critical internal services',
          'Migrate storage encryption keys',
          'Update SSH and VPN key infrastructure',
          'Regional rollout with canary deployments',
        ],
        status: 'pending',
      },
      {
        title: 'Phase 4: Completion',
        duration: '3 weeks',
        tasks: [
          'Full migration to Falcon-1024 + RSA-6144 hybrid',
          'Security assessment and compliance verification',
          'Remove deprecated RSA-4096 configurations',
          'Document lessons learned',
        ],
        status: 'pending',
      },
    ],
    risks: [
      'Falcon key generation is more complex than RSA',
      'Limited hardware acceleration support initially',
      'Larger key sizes impact embedded/IoT systems',
      'Extended migration timeline increases exposure window',
    ],
    benefits: [
      'RSA-4096 provides buffer time for planned migration',
      'Falcon-1024 offers compact signatures for lattice-based PQC',
      'Hybrid approach maintains full backward compatibility',
      'Aligns with NIST PQC Round 4 selections',
    ],
  },
};

function RoadmapModal({ path, onClose }: { path: MigrationPath; onClose: () => void }) {
  const data = roadmapData[path.from];
  if (!data) return null;

  const statusColors: Record<string, { bg: string; border: string; color: string; label: string }> = {
    'completed': { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#4ade80', label: 'Completed' },
    'in-progress': { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#818cf8', label: 'In Progress' },
    'pending': { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#94a3b8', label: 'Pending' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
          animation: 'fadeInUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Migration Roadmap
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {path.from} <ArrowRight className="w-3 h-3 inline mx-1" /> {path.to}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Timeline</p>
              <p className="text-sm font-bold text-white mt-1">{path.timeline}</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Complexity</p>
              <p className="text-sm font-bold text-white mt-1">{path.complexity}</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Systems Affected</p>
              <p className="text-sm font-bold text-amber-400 mt-1">{path.systems.toLocaleString()}</p>
            </div>
          </div>

          {/* Timeline Phases */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Migration Phases
            </h3>
            {data.phases.map((phase, idx) => {
              const status = statusColors[phase.status];
              return (
                <div key={idx} className="relative pl-8">
                  {/* Timeline line */}
                  {idx < data.phases.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-[2px]" style={{ background: 'rgba(99,102,241,0.2)' }} />
                  )}
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: status.bg, border: `2px solid ${status.border}`, color: status.color }}
                  >
                    {idx + 1}
                  </div>

                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{phase.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{phase.duration}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {phase.tasks.map((task, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2 text-xs text-slate-400">
                          <span className="text-indigo-500 mt-0.5">▸</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risks & Benefits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Key Risks
              </h4>
              <ul className="space-y-2">
                {data.risks.map((risk, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Benefits
              </h4>
              <ul className="space-y-2">
                {data.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MigrationAdvisorPage() {
  const [selectedPath, setSelectedPath] = useState<MigrationPath | null>(null);

  return (
    <MainLayout>
      {/* Roadmap Modal */}
      {selectedPath && (
        <RoadmapModal path={selectedPath} onClose={() => setSelectedPath(null)} />
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Post-Quantum Migration Advisor</h1>
          <p className="text-muted-foreground">Recommended cryptographic migration pathways</p>
        </div>

        <div className="space-y-4">
          {migrationPaths.map((path) => (
            <div
              key={path.from}
              className={`border rounded-lg p-4 space-y-3 ${path.priority === 'critical'
                  ? 'bg-destructive/5 border-destructive/50'
                  : path.priority === 'high'
                    ? 'bg-accent/5 border-accent/50'
                    : 'bg-primary/5 border-primary/50'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-sm font-bold text-foreground">{path.from}</p>
                  <p className="text-xs text-muted-foreground">Current Encryption</p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-semibold uppercase ${path.priority === 'critical'
                      ? 'bg-destructive/20 text-destructive'
                      : path.priority === 'high'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-primary/20 text-primary'
                    }`}
                >
                  {path.priority}
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">To</p>
                    <p className="text-sm font-mono font-bold text-primary">{path.to}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Timeline</p>
                    <p className="text-sm font-semibold text-foreground">{path.timeline}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Complexity</p>
                    <p className="text-sm font-semibold text-foreground">{path.complexity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Systems</p>
                    <p className="text-sm font-bold text-accent">{path.systems.toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
                  onClick={() => setSelectedPath(path)}
                >
                  View Roadmap
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-semibold text-foreground">Quick Wins</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Update development certificates first (low impact)</li>
              <li>• Migrate test environments in parallel</li>
              <li>• Staged rollout by region/environment</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Critical Blockers</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Database key rotation dependencies</li>
              <li>• Legacy system compatibility issues</li>
              <li>• Long-lived certificate refresh windows</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
