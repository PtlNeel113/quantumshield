'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

const migrationPaths = [
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

export default function MigrationAdvisorPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Post-Quantum Migration Advisor</h1>
          <p className="text-muted-foreground">Recommended cryptographic migration pathways</p>
        </div>

        <div className="space-y-4">
          {migrationPaths.map((path) => (
            <div
              key={path.from}
              className={`border rounded-lg p-4 space-y-3 ${
                path.priority === 'critical'
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
                  className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                    path.priority === 'critical'
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

                <Button className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
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
