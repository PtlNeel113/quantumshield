'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function GraphExplorerPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Graph Explorer</h1>
          <p className="text-muted-foreground">Interactive visualization of system architecture and dependencies</p>
        </div>

        <Alert className="bg-primary/10 border-primary/50 text-primary">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Interactive graph coming soon. This will feature force-directed layout showing all systems, their cryptographic algorithms, and dependencies.
          </AlertDescription>
        </Alert>

        <div className="border border-border rounded-lg bg-card p-8 h-96 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">Graph visualization placeholder</p>
            <p className="text-xs text-muted-foreground">Force-directed graph with ~400 nodes and ~1200 edges</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
