'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const retentionData = [
  { range: '<5y', count: 12400, percentage: 29 },
  { range: '5-10y', count: 10200, percentage: 24 },
  { range: '10-20y', count: 14300, percentage: 33 },
  { range: '20y+', count: 5947, percentage: 14 },
];

export default function DataLifespanPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Data Lifespan Intelligence</h1>
          <p className="text-muted-foreground">Analyze data retention and encryption exposure over time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border rounded-lg bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Data Retention Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="range" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '4px',
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} assets`}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Key Metrics</h3>
            <div className="space-y-3">
              <div className="bg-secondary/50 p-3 rounded space-y-1">
                <p className="text-xs text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold text-foreground">42,847</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/50 p-3 rounded space-y-1">
                <p className="text-xs text-muted-foreground">Long Retention (20y+)</p>
                <p className="text-2xl font-bold text-destructive">5,947</p>
              </div>
              <div className="bg-accent/10 border border-accent/50 p-3 rounded space-y-1">
                <p className="text-xs text-muted-foreground">Avg Retention</p>
                <p className="text-2xl font-bold text-accent">12.3 years</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
