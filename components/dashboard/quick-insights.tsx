'use client';

import { AlertTriangle, Shield, ArrowUpRight, Cpu, TrendingUp, Zap } from 'lucide-react';

interface InsightItem {
    label: string;
    value: string;
    detail: string;
    severity: 'critical' | 'high' | 'medium';
    icon: React.ReactNode;
}

export function QuickInsights() {
    const insights: InsightItem[] = [
        {
            label: 'Highest Risk Asset',
            value: 'db-cluster-1',
            detail: 'ECC-256 · Risk Score 9.2/10',
            severity: 'critical',
            icon: <AlertTriangle className="w-4 h-4" />,
        },
        {
            label: 'Most Vulnerable Algorithm',
            value: 'RSA-2048',
            detail: '3,247 systems affected',
            severity: 'critical',
            icon: <Shield className="w-4 h-4" />,
        },
        {
            label: 'Migration Priority',
            value: 'TLS Infrastructure',
            detail: '847 endpoints require PQC migration',
            severity: 'high',
            icon: <Zap className="w-4 h-4" />,
        },
    ];

    const getSeverityStyle = (severity: string) => {
        if (severity === 'critical') return {
            iconBg: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 100%)',
            iconColor: '#f87171',
            badge: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', color: '#fca5a5' },
        };
        if (severity === 'high') return {
            iconBg: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)',
            iconColor: '#fbbf24',
            badge: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#fcd34d' },
        };
        return {
            iconBg: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
            iconColor: '#818cf8',
            badge: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#a5b4fc' },
        };
    };

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Quick Insights</h3>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
                    <Cpu className="w-3 h-3" />
                    <span>Live</span>
                </div>
            </div>

            <div className="space-y-3">
                {insights.map((insight, idx) => {
                    const style = getSeverityStyle(insight.severity);
                    return (
                        <div
                            key={idx}
                            className="group p-3.5 rounded-xl transition-all duration-250 cursor-pointer"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: style.iconBg }}>
                                    <div style={{ color: style.iconColor }}>{insight.icon}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                                        {insight.label}
                                    </p>
                                    <p className="text-sm font-semibold text-white font-mono truncate">
                                        {insight.value}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        {insight.detail}
                                    </p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-1" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
