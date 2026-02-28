'use client';

import { ChevronDown, Filter } from 'lucide-react';

interface AssetFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AssetFilters({ isOpen, onToggle }: AssetFiltersProps) {
  const selectStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    color: '#e2e8f0',
    outline: 'none',
  };

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>Advanced Filters</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 glass-card"
          style={{
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          {[
            { label: 'System Type', options: ['All Types', 'Load Balancer', 'Database', 'Cache', 'Storage', 'Bastion Host'] },
            { label: 'Algorithm', options: ['All Algorithms', 'RSA-2048', 'RSA-4096', 'ECC-256', 'AES-256'] },
            { label: 'Location', options: ['All Locations', 'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'] },
            { label: 'Risk Level', options: ['All Levels', 'Critical (8+)', 'High (6-8)', 'Medium (4-6)', 'Low (<4)'] },
          ].map((filter) => (
            <div key={filter.label} className="space-y-2">
              <label className="table-label">{filter.label}</label>
              <select
                className="w-full h-9 px-3 text-sm focus:ring-1 focus:ring-indigo-500/30 transition-all"
                style={selectStyle}
              >
                {filter.options.map((opt) => (
                  <option key={opt} style={{ background: '#111827' }}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
