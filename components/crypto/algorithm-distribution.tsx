'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const algorithmData = [
  { name: 'RSA-2048', count: 3247, percentage: 38 },
  { name: 'ECC-P256', count: 2140, percentage: 25 },
  { name: 'RSA-4096', count: 1804, percentage: 21 },
  { name: 'Kyber Hybrid', count: 847, percentage: 10 },
  { name: 'Other', count: 424, percentage: 5 },
];

const colors = ['#8b5cf6', '#6366f1', '#22c55e', '#38bdf8', '#475569'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '12px 16px',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
        {label}
      </p>
      <p style={{ fontSize: '11px', color: '#94a3b8' }}>
        {payload[0]?.value.toLocaleString()} endpoints
      </p>
    </div>
  );
}

export function AlgorithmDistribution() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="space-y-1.5">
        <h3 className="section-header" style={{ fontSize: '16px' }}>Algorithm Distribution</h3>
        <p className="text-xs text-slate-500 font-medium">By endpoint count</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={algorithmData} layout="vertical">
            <defs>
              {colors.map((color, i) => (
                <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" stroke="#475569" style={{ fontSize: '11px' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#475569"
              style={{ fontSize: '11px', fontWeight: 500 }}
              width={90}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
              {algorithmData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#bar-grad-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-white/[0.04] pt-3 space-y-2">
        {algorithmData.map((algo, idx) => (
          <div key={algo.name} className="flex items-center justify-between py-1 group">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-md" style={{
                background: colors[idx],
                boxShadow: `0 0 6px ${colors[idx]}30`,
              }} />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{algo.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono tabular-nums">{algo.count.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-300 tabular-nums w-8 text-right">{algo.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
