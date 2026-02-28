'use client';

import { TrendingUp, TrendingDown, Shield, AlertTriangle, Archive, Cpu, Gauge } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  displayValue: string;
  unit?: string;
  trend: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  sparkData?: Array<{ value: number }>;
  index: number;
}

function useAnimatedCounter(end: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

function MetricCard({
  title,
  value,
  displayValue,
  unit,
  trend,
  severity,
  icon,
  sparkData,
  index,
}: MetricCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const severityConfig = {
    critical: {
      gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.02) 100%)',
      border: 'rgba(239,68,68,0.15)',
      glow: 'rgba(239,68,68,0.08)',
      sparkColor: '#ef4444',
      iconBg: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.08) 100%)',
    },
    high: {
      gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.02) 100%)',
      border: 'rgba(245,158,11,0.15)',
      glow: 'rgba(245,158,11,0.08)',
      sparkColor: '#f59e0b',
      iconBg: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.08) 100%)',
    },
    medium: {
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.02) 100%)',
      border: 'rgba(99,102,241,0.15)',
      glow: 'rgba(99,102,241,0.08)',
      sparkColor: '#6366f1',
      iconBg: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)',
    },
    low: {
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.02) 100%)',
      border: 'rgba(34,197,94,0.15)',
      glow: 'rgba(34,197,94,0.08)',
      sparkColor: '#22c55e',
      iconBg: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.08) 100%)',
    },
  };

  const config = severityConfig[severity];
  const trendColor = trend > 0 ? 'text-amber-400' : 'text-emerald-400';
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 cursor-default ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      style={{
        background: config.gradient,
        border: `1px solid ${config.border}`,
        borderRadius: '14px',
        backdropFilter: 'blur(20px)',
        boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset`,
        padding: '20px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = config.border.replace('0.15', '0.3');
        e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 40px ${config.glow}, 0 0 0 1px rgba(255,255,255,0.04) inset`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = config.border;
        e.currentTarget.style.boxShadow = `0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset`;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Shimmer overlay on top */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
        borderRadius: 'inherit',
      }} />

      <div className="relative z-10 space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight counter-animate">
                {displayValue}
              </span>
              {unit && (
                <span className="text-xs text-slate-500 font-medium">{unit}</span>
              )}
            </div>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{ background: config.iconBg }}
          >
            {icon}
          </div>
        </div>

        {/* Sparkline */}
        {sparkData && (
          <div className="h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <defs>
                  <linearGradient id={`spark-${severity}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={config.sparkColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={config.sparkColor} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={`url(#spark-${severity})`}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{Math.abs(trend)}% from last week</span>
        </div>
      </div>
    </div>
  );
}

export function RiskMetrics() {
  const metrics = [
    {
      title: 'Total Assets',
      value: 42847,
      displayValue: '42,847',
      trend: 3.2,
      severity: 'low' as const,
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      sparkData: [
        { value: 40 }, { value: 41 }, { value: 41.5 },
        { value: 42 }, { value: 42.5 }, { value: 42.8 },
      ],
    },
    {
      title: 'Quantum Vulnerable',
      value: 3247,
      displayValue: '3,247',
      unit: '(7.6%)',
      trend: 12.5,
      severity: 'critical' as const,
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      sparkData: [
        { value: 2.2 }, { value: 2.5 }, { value: 2.8 },
        { value: 3.0 }, { value: 3.1 }, { value: 3.24 },
      ],
    },
    {
      title: 'High Risk Archives',
      value: 847,
      displayValue: '847',
      unit: '(20+ years)',
      trend: -2.1,
      severity: 'high' as const,
      icon: <Archive className="w-5 h-5 text-amber-400" />,
      sparkData: [
        { value: 900 }, { value: 890 }, { value: 880 },
        { value: 870 }, { value: 860 }, { value: 847 },
      ],
    },
    {
      title: 'PQC Ready Systems',
      value: 1284,
      displayValue: '1,284',
      unit: '(3%)',
      trend: 8.7,
      severity: 'medium' as const,
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      sparkData: [
        { value: 0.8 }, { value: 0.9 }, { value: 1.0 },
        { value: 1.1 }, { value: 1.2 }, { value: 1.28 },
      ],
    },
    {
      title: 'Avg Risk Score',
      value: 6.2,
      displayValue: '6.2',
      unit: '/10',
      trend: 1.3,
      severity: 'medium' as const,
      icon: <Gauge className="w-5 h-5 text-indigo-400" />,
      sparkData: [
        { value: 5.8 }, { value: 5.9 }, { value: 6.0 },
        { value: 6.1 }, { value: 6.15 }, { value: 6.2 },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          displayValue={metric.displayValue}
          unit={metric.unit}
          trend={metric.trend}
          severity={metric.severity}
          icon={metric.icon}
          sparkData={metric.sparkData}
          index={index}
        />
      ))}
    </div>
  );
}
