'use client';

import { AlertTriangle, ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  count: number;
}

export function WeakCryptoAlerts() {
  const alerts: Alert[] = [
    {
      id: '1',
      severity: 'critical',
      title: 'RSA-2048 End-of-Life',
      description: '3,247 systems using RSA-2048 require migration by 2030',
      count: 3247,
    },
    {
      id: '2',
      severity: 'high',
      title: 'ECC-P256 Transition',
      description: '2,140 systems need algorithm diversity assessment',
      count: 2140,
    },
    {
      id: '3',
      severity: 'medium',
      title: 'Legacy Protocols',
      description: '847 endpoints running deprecated TLS versions',
      count: 847,
    },
  ];

  const getSeverityStyles = (severity: string) => {
    if (severity === 'critical') return {
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
      icon: '#f87171',
      badge: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)', color: '#fca5a5' },
    };
    if (severity === 'high') return {
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.15)',
      icon: '#fbbf24',
      badge: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', color: '#fcd34d' },
    };
    return {
      bg: 'rgba(99,102,241,0.06)',
      border: 'rgba(99,102,241,0.15)',
      icon: '#818cf8',
      badge: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)', color: '#a5b4fc' },
    };
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const style = getSeverityStyles(alert.severity);
        return (
          <div
            key={alert.id}
            className="rounded-xl p-4 flex items-start gap-3 group cursor-pointer transition-all duration-200"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = style.border.replace('0.15', '0.3');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = style.border;
            }}
          >
            <div className="p-2 rounded-lg flex-shrink-0" style={{
              background: `${style.bg.replace('0.06', '0.15')}`,
            }}>
              <AlertTriangle className="w-4 h-4" style={{ color: style.icon }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{alert.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg tabular-nums"
                style={{
                  background: style.badge.bg,
                  border: `1px solid ${style.badge.border}`,
                  color: style.badge.color,
                }}
              >
                {alert.count.toLocaleString()}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
