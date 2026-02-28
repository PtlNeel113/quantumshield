'use client';

import { useState } from 'react';

type TabType = 'tls' | 'ssh' | 'app' | 'database' | 'storage' | 'backups';

interface Endpoint {
  id: string;
  name: string;
  algorithm: string;
  keyLength: number;
  issuer?: string;
  expiry?: string;
  risk: string;
}

const tabsData: Record<TabType, Endpoint[]> = {
  tls: [
    { id: '1', name: 'api.prod.internal', algorithm: 'RSA-2048', keyLength: 2048, issuer: 'DigiCert', expiry: '2025-08-15', risk: 'CRITICAL' },
    { id: '2', name: 'cdn.example.com', algorithm: 'RSA-4096', keyLength: 4096, issuer: "Let's Encrypt", expiry: '2025-04-10', risk: 'MEDIUM' },
    { id: '3', name: 'dashboard.internal', algorithm: 'ECC-256', keyLength: 256, issuer: 'Internal CA', expiry: '2026-12-01', risk: 'HIGH' },
  ],
  ssh: [
    { id: '4', name: 'bastion-prod-01', algorithm: 'RSA-2048', keyLength: 2048, risk: 'CRITICAL' },
    { id: '5', name: 'db-admin-01', algorithm: 'RSA-4096', keyLength: 4096, risk: 'MEDIUM' },
    { id: '6', name: 'ci-runner-02', algorithm: 'ED25519', keyLength: 256, risk: 'LOW' },
  ],
  app: [
    { id: '7', name: 'JWT Token Signing', algorithm: 'RSA-2048', keyLength: 2048, risk: 'CRITICAL' },
    { id: '8', name: 'API Signing', algorithm: 'HMAC-SHA256', keyLength: 256, risk: 'LOW' },
    { id: '9', name: 'Service Mesh Certs', algorithm: 'ECC-P256', keyLength: 256, risk: 'HIGH' },
  ],
  database: [
    { id: '10', name: 'DB Replication', algorithm: 'AES-256-GCM', keyLength: 256, risk: 'LOW' },
    { id: '11', name: 'Column Encryption', algorithm: 'AES-128', keyLength: 128, risk: 'MEDIUM' },
    { id: '12', name: 'Backup Encryption', algorithm: 'RSA-2048', keyLength: 2048, risk: 'CRITICAL' },
  ],
  storage: [
    { id: '13', name: 'S3 Bucket Encryption', algorithm: 'AES-256', keyLength: 256, risk: 'LOW' },
    { id: '14', name: 'GCS DLP Keys', algorithm: 'RSA-3072', keyLength: 3072, risk: 'MEDIUM' },
    { id: '15', name: 'Azure Encryption', algorithm: 'AES-256', keyLength: 256, risk: 'LOW' },
  ],
  backups: [
    { id: '16', name: 'Daily Backups', algorithm: 'AES-256', keyLength: 256, risk: 'LOW' },
    { id: '17', name: 'Tape Encryption', algorithm: 'RSA-2048', keyLength: 2048, risk: 'CRITICAL' },
    { id: '18', name: 'Archive Tier', algorithm: 'AES-128', keyLength: 128, risk: 'MEDIUM' },
  ],
};

function getRiskStyle(risk: string) {
  if (risk === 'CRITICAL') return {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    color: '#fca5a5',
    dot: '#ef4444',
  };
  if (risk === 'HIGH') return {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    color: '#fcd34d',
    dot: '#f59e0b',
  };
  if (risk === 'MEDIUM') return {
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.2)',
    color: '#a5b4fc',
    dot: '#6366f1',
  };
  return {
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.2)',
    color: '#4ade80',
    dot: '#22c55e',
  };
}

export function CryptoTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('tls');

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'tls', label: 'TLS Endpoints', count: 3 },
    { id: 'ssh', label: 'SSH', count: 3 },
    { id: 'app', label: 'Application', count: 3 },
    { id: 'database', label: 'Database', count: 3 },
    { id: 'storage', label: 'Storage', count: 3 },
    { id: 'backups', label: 'Backups', count: 3 },
  ];

  return (
    <div className="glass-card overflow-hidden">
      {/* Tab buttons */}
      <div className="flex overflow-x-auto" style={{
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3 text-xs font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold tabular-nums" style={{
                background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.id ? '#a5b4fc' : '#64748b',
              }}>
                {tab.count}
              </span>
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
                background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        <div className="space-y-2">
          {tabsData[activeTab].map((endpoint) => {
            const riskStyle = getRiskStyle(endpoint.risk);
            return (
              <div
                key={endpoint.id}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 group cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-indigo-400 font-medium group-hover:text-indigo-300 truncate transition-colors">
                    {endpoint.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {endpoint.algorithm} • {endpoint.keyLength} bits
                    {endpoint.issuer && ` • ${endpoint.issuer}`}
                    {endpoint.expiry && ` • Expires: ${endpoint.expiry}`}
                  </p>
                </div>
                <span
                  className="ml-4 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 flex items-center gap-1.5"
                  style={{
                    background: riskStyle.bg,
                    border: `1px solid ${riskStyle.border}`,
                    color: riskStyle.color,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: riskStyle.dot }} />
                  {endpoint.risk}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
