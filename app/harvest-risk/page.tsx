'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Zap } from 'lucide-react';

const harvestRiskAssets = [
  { rank: 1, name: 'Backup Archive Tier 1', algorithm: 'RSA-2048', retentionYears: 30, risk: 9.8 },
  { rank: 2, name: 'Historical Database', algorithm: 'ECC-P256', retentionYears: 25, risk: 9.5 },
  { rank: 3, name: 'Long-term Backups', algorithm: 'RSA-2048', retentionYears: 22, risk: 9.2 },
  { rank: 4, name: 'Archive Storage', algorithm: 'RSA-4096', retentionYears: 20, risk: 8.7 },
  { rank: 5, name: 'Data Lake Legacy', algorithm: 'AES-128', retentionYears: 18, risk: 6.4 },
];

export default function HarvestRiskPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Harvest-Now-Decrypt-Later Risk</h1>
          <p className="text-muted-foreground">Critical assets vulnerable to HNDL attacks over long retention periods</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="border border-border rounded-lg bg-card overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/50">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Top Risk Assets</h3>
              </div>
              <div className="divide-y divide-border">
                {harvestRiskAssets.map((asset) => (
                  <div key={asset.rank} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <p className="font-mono text-sm text-primary">#{asset.rank} {asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.algorithm} • {asset.retentionYears} years retention</p>
                      </div>
                      <div className={`text-center rounded border px-2 py-1 font-bold text-xs ${
                        asset.risk >= 9 ? 'bg-destructive/20 text-destructive border-destructive/50' :
                        'bg-accent/20 text-accent border-accent/50'
                      }`}>
                        {asset.risk.toFixed(1)}/10
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded h-1">
                      <div
                        className={`h-1 rounded transition-all ${
                          asset.risk >= 9 ? 'bg-destructive' : 'bg-accent'
                        }`}
                        style={{ width: `${(asset.risk / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Key Findings</h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <Zap className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p>847 high-sensitivity assets with 20+ year retention</p>
              </div>
              <div className="flex gap-2">
                <Zap className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <p>Avg 8+ vulnerability score for archives</p>
              </div>
              <div className="flex gap-2">
                <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p>3,247 systems need immediate PQC migration</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="bg-destructive/10 border border-destructive/50 rounded p-3 space-y-1">
                <p className="text-xs font-semibold text-destructive uppercase">Recommendation</p>
                <p className="text-xs text-destructive/90">Begin harvest-resistant encryption migration for assets with retention &gt; 20 years</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
