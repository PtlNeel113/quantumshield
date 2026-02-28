'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RiskMetrics } from '@/components/dashboard/risk-metrics';
import { QuantumThreatTimeline } from '@/components/dashboard/quantum-threat-timeline';
import { HndlRiskHeatmap } from '@/components/dashboard/hndl-risk-heatmap';
import { QuickInsights } from '@/components/dashboard/quick-insights';
import { ArrowRight, Shield, Clock, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h1 className="page-title">Quantum Risk Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">
              Real-time cryptographic threat exposure assessment and mitigation planning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-badge status-badge-success">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Monitoring Active
            </div>
          </div>
        </div>

        {/* Risk Metrics Strip */}
        <div>
          <RiskMetrics />
        </div>

        {/* Charts Section + Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quantum Threat Timeline */}
          <div className="lg:col-span-2">
            <QuantumThreatTimeline />
          </div>

          {/* HNDL Risk Heatmap */}
          <div className="lg:col-span-1">
            <HndlRiskHeatmap />
          </div>

          {/* Quick Insights Panel */}
          <div className="lg:col-span-1">
            <QuickInsights />
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Insights */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide">Key Insights</h3>
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <div className="space-y-0">
              {[
                {
                  text: '3,247 systems with RSA-2048 will be vulnerable by 2030',
                  severity: 'critical',
                  color: '#ef4444',
                },
                {
                  text: '847 high-sensitivity assets at harvest risk (20+ years retention)',
                  severity: 'high',
                  color: '#f59e0b',
                },
                {
                  text: '12 critical infrastructure dependencies require migration planning',
                  severity: 'medium',
                  color: '#6366f1',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 py-3 group cursor-pointer transition-colors"
                  style={{
                    borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}40`,
                  }} />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors leading-relaxed">
                    {item.text}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-all ml-auto flex-shrink-0 mt-1 group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide">Recent Activity</h3>
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <div className="space-y-0">
              {[
                {
                  label: 'Scan completed',
                  time: '15 min ago',
                  badgeStyle: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', color: '#4ade80' },
                },
                {
                  label: '3 new weak algorithms detected',
                  time: '1h ago',
                  badgeStyle: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#fbbf24' },
                },
                {
                  label: 'Archive tier analysis updated',
                  time: '3h ago',
                  badgeStyle: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#a5b4fc' },
                },
                {
                  label: 'Migration roadmap generated',
                  time: '1d ago',
                  badgeStyle: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', color: '#94a3b8' },
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-3 group cursor-pointer"
                  style={{
                    borderBottom: idx < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex-shrink-0 ml-3"
                    style={{
                      background: item.badgeStyle.bg,
                      border: `1px solid ${item.badgeStyle.border}`,
                      color: item.badgeStyle.color,
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}
