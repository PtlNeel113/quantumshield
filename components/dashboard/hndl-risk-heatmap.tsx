'use client';

import { useState } from 'react';

interface HeatmapCell {
  system: string;
  retention: string;
  risk: number;
  assetCount: number;
}

export function HndlRiskHeatmap() {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const systems = ['TLS', 'SSH', 'App Crypto', 'DB Crypto', 'Backups'];
  const retentions = ['<5y', '5-10y', '10-20y', '20y+'];

  const heatmapData: Record<string, Record<string, { risk: number; count: number }>> = {
    TLS: { '<5y': { risk: 3, count: 120 }, '5-10y': { risk: 4, count: 45 }, '10-20y': { risk: 5, count: 12 }, '20y+': { risk: 8, count: 2 } },
    SSH: { '<5y': { risk: 2, count: 340 }, '5-10y': { risk: 3, count: 120 }, '10-20y': { risk: 5, count: 38 }, '20y+': { risk: 7, count: 5 } },
    'App Crypto': { '<5y': { risk: 4, count: 240 }, '5-10y': { risk: 5, count: 180 }, '10-20y': { risk: 7, count: 94 }, '20y+': { risk: 9, count: 28 } },
    'DB Crypto': { '<5y': { risk: 2, count: 85 }, '5-10y': { risk: 4, count: 120 }, '10-20y': { risk: 6, count: 200 }, '20y+': { risk: 8, count: 145 } },
    Backups: { '<5y': { risk: 3, count: 560 }, '5-10y': { risk: 5, count: 420 }, '10-20y': { risk: 7, count: 380 }, '20y+': { risk: 9, count: 667 } },
  };

  const getRiskStyle = (risk: number) => {
    if (risk >= 8) return {
      bg: 'rgba(239, 68, 68, 0.25)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#fca5a5',
      glow: '0 0 20px rgba(239, 68, 68, 0.15)',
    };
    if (risk >= 6) return {
      bg: 'rgba(245, 158, 11, 0.2)',
      border: 'rgba(245, 158, 11, 0.25)',
      text: '#fcd34d',
      glow: '0 0 20px rgba(245, 158, 11, 0.1)',
    };
    if (risk >= 4) return {
      bg: 'rgba(99, 102, 241, 0.18)',
      border: 'rgba(99, 102, 241, 0.22)',
      text: '#a5b4fc',
      glow: '0 0 20px rgba(99, 102, 241, 0.1)',
    };
    return {
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.15)',
      text: '#7dd3fc',
      glow: 'none',
    };
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="space-y-1.5">
        <h3 className="section-header">
          HNDL Risk Matrix
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Harvest-Now-Decrypt-Later risk by system & data age
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-1.5">
          <div className="p-2" />
          {retentions.map((retention) => (
            <div
              key={retention}
              className="text-[10px] font-semibold text-slate-500 p-2 text-center uppercase tracking-wider"
            >
              {retention}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {systems.map((system) => (
          <div key={system} className="grid grid-cols-5 gap-1.5">
            <div className="text-[10px] font-semibold text-slate-500 p-2 flex items-center uppercase tracking-wider">
              {system}
            </div>
            {retentions.map((retention) => {
              const cellKey = `${system}-${retention}`;
              const data = heatmapData[system][retention];
              const isSelected = selectedCell === cellKey;
              const style = getRiskStyle(data.risk);

              return (
                <button
                  key={cellKey}
                  onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                  className="p-2.5 text-center cursor-pointer transition-all duration-250 group relative"
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: '10px',
                    boxShadow: isSelected ? `${style.glow}, 0 0 0 2px ${style.border}` : 'none',
                  }}
                >
                  <div className="text-sm font-bold" style={{ color: style.text }}>
                    {data.risk.toFixed(1)}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: `${style.text}80` }}>
                    {data.count}
                  </div>

                  {/* Risk bar underneath */}
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(data.risk / 10) * 100}%`,
                        background: data.risk >= 8
                          ? 'linear-gradient(90deg, #ef4444, #f87171)'
                          : data.risk >= 6
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : data.risk >= 4
                              ? 'linear-gradient(90deg, #6366f1, #818cf8)'
                              : 'linear-gradient(90deg, #38bdf8, #7dd3fc)',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend & Details */}
      <div className="border-t border-white/[0.04] pt-4 space-y-3">
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          {[
            { label: '8-10: CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
            { label: '6-8: HIGH', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
            { label: '4-6: MEDIUM', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
            { label: '<4: LOW', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-md" style={{
                background: item.bg,
                border: `1px solid ${item.color}40`,
                boxShadow: `0 0 6px ${item.color}20`,
              }} />
              <span className="text-slate-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {selectedCell && (
          <div className="mt-2 p-3 rounded-xl text-xs" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p className="font-semibold text-white">{selectedCell.replace('-', ' • ')}</p>
            <p className="text-slate-500 mt-1">
              {heatmapData[selectedCell.split('-')[0]]?.[selectedCell.split('-').slice(1).join('-')]?.count} assets at risk
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
