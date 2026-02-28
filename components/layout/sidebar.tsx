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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

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
              2025-02-28 14:23:15 UTC
            </p>
            <p className="text-[10px] text-slate-500">42,847 assets scanned</p>
          </div>

          {/* Start Scan Button */}
          <Button
            className="w-full h-10 text-sm font-semibold text-white rounded-xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Start Scan
          </Button>
        </div>
      )}
    </aside>
  );
}
