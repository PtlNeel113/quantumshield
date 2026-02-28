'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { Button } from '@/components/ui/button';

const timelineData = [
  { year: 2025, rsa2048: 2, ecc256: 1, rsa4096: 0.5, aes256: 0 },
  { year: 2028, rsa2048: 8, ecc256: 4, rsa4096: 1, aes256: 0 },
  { year: 2030, rsa2048: 25, ecc256: 12, rsa4096: 3, aes256: 0.1 },
  { year: 2033, rsa2048: 60, ecc256: 35, rsa4096: 10, aes256: 0.5 },
  { year: 2036, rsa2048: 95, ecc256: 75, rsa4096: 40, aes256: 2 },
  { year: 2040, rsa2048: 100, ecc256: 98, rsa4096: 85, aes256: 8 },
  { year: 2050, rsa2048: 100, ecc256: 100, rsa4096: 100, aes256: 50 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '14px 18px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
        Year {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
          fontSize: '12px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: entry.color,
            boxShadow: `0 0 6px ${entry.color}40`,
          }} />
          <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
            {entry.value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function QuantumThreatTimeline() {
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h3 className="section-header">
            Quantum Cryptanalysis Timeline
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Estimated vulnerability timeline for cryptographic algorithms
          </p>
        </div>
      </div>

      {/* Risk Level Toggle */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setRiskLevel(level)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${riskLevel === level
                ? 'text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
              }`}
            style={riskLevel === level ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0.1) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            } : {
              border: '1px solid transparent',
            }}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="grad-rsa2048" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="grad-ecc256" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="grad-rsa4096" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="grad-aes256" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={1} />
              </linearGradient>
              {/* Area fills */}
              <linearGradient id="area-rsa2048" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="year"
              stroke="#475569"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <YAxis
              stroke="#475569"
              style={{ fontSize: '11px', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x={2030}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeOpacity={0.6}
              label={{
                value: 'NIST Transition',
                position: 'top',
                fill: '#f59e0b',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="rsa2048"
              fill="url(#area-rsa2048)"
              stroke="none"
              isAnimationActive={true}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="rsa2048"
              stroke="url(#grad-rsa2048)"
              dot={false}
              strokeWidth={2.5}
              name="RSA-2048"
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="ecc256"
              stroke="url(#grad-ecc256)"
              dot={false}
              strokeWidth={2}
              name="ECC-256"
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="rsa4096"
              stroke="url(#grad-rsa4096)"
              dot={false}
              strokeWidth={2}
              name="RSA-4096"
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="aes256"
              stroke="url(#grad-aes256)"
              dot={false}
              strokeWidth={2}
              name="AES-256"
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-3 text-xs pt-2">
        {[
          { label: 'RSA-2048', color: '#8b5cf6', status: 'CRITICAL' },
          { label: 'ECC-256', color: '#6366f1', status: 'CRITICAL' },
          { label: 'RSA-4096', color: '#22c55e', status: 'HIGH' },
          { label: 'AES-256', color: '#38bdf8', status: 'SAFE' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg" style={{
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{
              background: item.color,
              boxShadow: `0 0 8px ${item.color}30`,
            }} />
            <div>
              <span className="text-slate-300 font-medium text-[11px]">{item.label}</span>
              <span className="text-slate-600 text-[10px] ml-1.5">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
