'use client';

import { Search, Bell, Shield, Activity, Cloud, ChevronDown, Scan, Wifi } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function TopBar() {
  const [scanProgress, setScanProgress] = useState(73);
  const [notifications] = useState(5);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-white/[0.06] sticky top-0 z-50" style={{
      background: 'linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(15,23,42,0.9) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
    }}>
      {/* Top Status Strip */}
      <div className="flex items-center justify-between px-8 h-8 border-b border-white/[0.04] text-[11px] font-mono" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-6">
          {/* System Health */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-green" />
            <span className="text-emerald-400 font-medium">All Systems Operational</span>
          </div>

          {/* Scan Status */}
          <div className="flex items-center gap-2 text-slate-400">
            <Scan className="w-3 h-3 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Scan in progress</span>
            <span className="text-indigo-400 font-semibold">{scanProgress}%</span>
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${scanProgress}%`,
                  background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span>Connected</span>
          </div>

          {/* Environment Selector */}
          <button className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-300 hover:bg-white/5 transition-colors">
            <Cloud className="w-3 h-3 text-sky-400" />
            <span className="font-medium">Production</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
          </button>

          {/* Time */}
          <span className="text-slate-500 tabular-nums">{currentTime} UTC</span>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="flex items-center justify-between h-14 px-8 gap-4">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3 min-w-fit">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}>
            <Shield className="w-4.5 h-4.5 text-white" />
            <div className="absolute inset-0 rounded-xl" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">QuantumShield</h1>
            <p className="text-[10px] text-indigo-400/80 font-medium tracking-wide uppercase">Risk Intelligence</p>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input
              placeholder="Search assets, systems, threats..."
              className="pl-11 py-2 h-10 text-sm placeholder:text-slate-500 transition-all duration-300 border-0"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '10px',
              }}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-slate-500 border border-white/10 rounded font-mono" style={{ background: 'rgba(255,255,255,0.03)' }}>
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Live Metrics */}
          <div className="hidden lg:flex items-center gap-6 text-xs border-r border-white/[0.06] pr-5 mr-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Assets</span>
              <span className="font-semibold text-white text-sm tabular-nums">42,847</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Quantum Risk</span>
              <span className="font-semibold text-amber-400 text-sm tabular-nums">8.3%</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Active Scans</span>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span className="font-semibold text-indigo-400 text-sm tabular-nums">3</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all duration-200 relative"
            >
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" style={{
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                }} />
              )}
            </Button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 border-l border-white/[0.06] pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">Security Team</p>
              <p className="text-[10px] text-slate-500">Enterprise Admin</p>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <span className="text-xs font-semibold text-indigo-400">ST</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
