'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Lock,
  Calendar,
  Clock,
  Zap,
  Sliders,
  Share2,
  Map,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

const navigationSections = [
  {
    title: 'CORE',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Asset Inventory', href: '/assets', icon: Database },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { label: 'AI Analyst', href: '/ai-analyst', icon: Sparkles },
    ],
  },
  {
    title: 'ANALYSIS',
    items: [
      { label: 'Crypto Discovery', href: '/crypto', icon: Lock },
      { label: 'Data Lifespan', href: '/data-lifespan', icon: Calendar },
      { label: 'Quantum Timeline', href: '/quantum-timeline', icon: Clock },
      { label: 'Harvest Risk', href: '/harvest-risk', icon: Zap },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Attack Simulation', href: '/attack-simulation', icon: Sliders },
      { label: 'Migration Advisor', href: '/migration-advisor', icon: Share2 },
      { label: 'Graph Explorer', href: '/graph-explorer', icon: Map },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { label: 'Reports', href: '/reports', icon: FileText },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const scanStages = [
  { label: 'Initializing scan engine...', duration: 800 },
  { label: 'Discovering network assets...', duration: 1200 },
  { label: 'Scanning cryptographic configurations...', duration: 1500 },
  { label: 'Analyzing algorithm strengths...', duration: 1300 },
  { label: 'Computing quantum risk scores...', duration: 1000 },
  { label: 'Generating threat assessment...', duration: 800 },
  { label: 'Finalizing results...', duration: 600 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [lastScanTime, setLastScanTime] = useState('2025-02-28 14:23:15 UTC');
  const [assetsScanned, setAssetsScanned] = useState(42847);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const startScan = useCallback(async () => {
    if (scanning) return;

    setScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    setScanStage(scanStages[0].label);

    let totalDuration = scanStages.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;

    for (let i = 0; i < scanStages.length; i++) {
      setScanStage(scanStages[i].label);

      // Animate progress during this stage
      const stageDuration = scanStages[i].duration;
      const steps = 10;
      const stepDuration = stageDuration / steps;

      for (let s = 0; s < steps; s++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        elapsed += stepDuration;
        setScanProgress(Math.min(100, (elapsed / totalDuration) * 100));
      }
    }

    setScanProgress(100);
    setScanStage('Scan complete!');
    setScanComplete(true);
    setScanning(false);

    // Update scan info
    const now = new Date();
    const utcStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    setLastScanTime(utcStr);
    setAssetsScanned(prev => prev + Math.floor(Math.random() * 500) + 100);

    // Reset complete state after 3 seconds
    setTimeout(() => {
      setScanComplete(false);
      setScanProgress(0);
      setScanStage('');
    }, 4000);
  }, [scanning]);

  return (
    <aside
      className={cn(
        'flex flex-col h-full sticky top-0 border-r border-white/[0.04] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
      }}
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end px-3 pt-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Scrollable Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-6', collapsed ? 'px-2' : 'px-3')}>
        {navigationSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <h3 className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl transition-all duration-200',
                        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
                        active
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      )}
                      style={active ? {
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 100%)',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                      } : undefined}
                    >
                      {/* Left border indicator for active */}
                      {active && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                          style={{
                            height: '22px',
                            background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'flex items-center justify-center rounded-lg transition-all duration-200',
                        collapsed ? 'w-8 h-8' : 'w-8 h-8',
                        active
                          ? 'text-indigo-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      )} style={active ? {
                        background: 'rgba(99, 102, 241, 0.15)',
                      } : undefined}>
                        <item.icon className="w-4 h-4" />
                      </div>

                      {/* Label */}
                      {!collapsed && (
                        <span className={cn(
                          'text-sm font-medium truncate transition-colors',
                          active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-white/[0.04] p-3 space-y-3">
          {/* Last Scan Info */}
          <div className="p-3 rounded-xl space-y-2" style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Last Scan</p>
            <p className="text-xs text-slate-300 font-mono" style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              {lastScanTime}
            </p>
            <p className="text-[10px] text-slate-500">{assetsScanned.toLocaleString()} assets scanned</p>
          </div>

          {/* Scan Progress */}
          {(scanning || scanComplete) && (
            <div className="p-3 rounded-xl space-y-2" style={{
              background: scanComplete ? 'rgba(34,197,94,0.05)' : 'rgba(99,102,241,0.05)',
              border: `1px solid ${scanComplete ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)'}`,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              {/* Progress Bar */}
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${scanProgress}%`,
                    background: scanComplete
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : 'linear-gradient(90deg, #6366f1, #818cf8)',
                    boxShadow: scanComplete
                      ? '0 0 8px rgba(34,197,94,0.4)'
                      : '0 0 8px rgba(99,102,241,0.4)',
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                {scanComplete ? (
                  <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin flex-shrink-0" />
                )}
                <p className={`text-[10px] ${scanComplete ? 'text-green-400' : 'text-indigo-300'} truncate`}>
                  {scanStage}
                </p>
              </div>
              <p className="text-[10px] text-slate-500 text-right tabular-nums font-mono">
                {Math.round(scanProgress)}%
              </p>
            </div>
          )}

          {/* Start Scan Button */}
          <Button
            className={cn(
              'w-full h-10 text-sm font-semibold text-white rounded-xl transition-all duration-300',
              scanning && 'opacity-75 cursor-not-allowed'
            )}
            style={{
              background: scanComplete
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: scanComplete
                ? '0 4px 12px rgba(34, 197, 94, 0.25)'
                : '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
            disabled={scanning}
            onClick={startScan}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : scanComplete ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Scan Complete
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Scan
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}

