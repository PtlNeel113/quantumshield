'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const systemDependencies = [
  { id: 'tls-01', name: 'TLS Gateway', type: 'Network', riskScore: 8.7, dependencies: 3 },
  { id: 'db-01', name: 'Database Cluster', type: 'Data', riskScore: 9.2, dependencies: 5 },
  { id: 'cache-01', name: 'Redis Cluster', type: 'Cache', riskScore: 6.1, dependencies: 2 },
  { id: 'backup-01', name: 'Backup Archive', type: 'Storage', riskScore: 7.4, dependencies: 1 },
  { id: 'messaging-01', name: 'Message Queue', type: 'Messaging', riskScore: 5.2, dependencies: 4 },
];

export default function QuantumTimelinePage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Quantum Timeline Lab</h1>
          <p className="text-muted-foreground">System dependency graph and quantum risk exposure</p>
        </div>

        <Alert className="bg-primary/10 border-primary/50 text-primary">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Graph visualization coming soon. This view will display interactive system dependencies with quantum-safe migration pathways.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border rounded-lg bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">System Dependencies</h3>
            <div className="space-y-2">
              {systemDependencies.map((system) => (
                <div key={system.id} className="flex items-center justify-between p-3 bg-secondary rounded border border-border hover:border-primary/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-primary">{system.name}</p>
                    <p className="text-xs text-muted-foreground">{system.type} • {system.dependencies} dependencies</p>
                  </div>
                  <div className={`text-center rounded border px-2 py-1 font-bold text-xs ${
                    system.riskScore >= 8 ? 'bg-destructive/20 text-destructive border-destructive/50' :
                    system.riskScore >= 6 ? 'bg-accent/20 text-accent border-accent/50' :
                    'bg-primary/20 text-primary border-primary/50'
                  }`}>
                    {system.riskScore.toFixed(1)}/10
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Statistics</h3>
            <div className="space-y-2">
              <div className="bg-secondary/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Total Systems</p>
                <p className="text-2xl font-bold text-foreground">42</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Critical Risk</p>
                <p className="text-2xl font-bold text-destructive">12</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Avg Risk Score</p>
                <p className="text-2xl font-bold text-accent">7.3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
