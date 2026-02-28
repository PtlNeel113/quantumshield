'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure QuantumShield platform preferences</p>
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Scan Configuration</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Scan Schedule</label>
                <select className="w-full h-9 px-3 rounded bg-secondary border border-border text-sm text-foreground">
                  <option>Daily at 2 AM UTC</option>
                  <option>Every 6 hours</option>
                  <option>Weekly on Monday</option>
                  <option>Manual only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Risk Assessment Level</label>
                <select className="w-full h-9 px-3 rounded bg-secondary border border-border text-sm text-foreground">
                  <option>Conservative (best for compliance)</option>
                  <option>Moderate (recommended)</option>
                  <option>Aggressive (early warnings)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Notifications</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-secondary" />
                Critical risk alerts
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border bg-secondary" />
                Weekly risk summary
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border bg-secondary" />
                Scan completion reports
              </label>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">API Integration</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">API Key</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="sk_live_••••••••••••••••••••••••"
                  readOnly
                  className="flex-1 px-3 py-2 rounded bg-secondary border border-border text-sm text-foreground"
                />
                <Button size="sm" className="h-9 px-3 text-xs bg-secondary hover:bg-secondary/80 text-foreground">
                  Rotate
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Danger Zone</h3>
            <p className="text-xs text-muted-foreground mb-3">Irreversible actions</p>
            <Button variant="destructive" className="w-full h-9 text-sm">
              Clear All Cache
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
