'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { AssetTable } from '@/components/assets/asset-table';
import { AssetFilters } from '@/components/assets/asset-filters';
import { useState } from 'react';
import { Database } from 'lucide-react';

export default function AssetsPage() {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h1 className="page-title">Asset Inventory</h1>
            <p className="text-sm text-slate-500 font-medium">
              42,847 systems under management across all regions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-badge status-badge-info">
              <Database className="w-3 h-3" />
              42,847 assets
            </div>
          </div>
        </div>

        {/* Filters */}
        <AssetFilters isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)} />

        {/* Table */}
        <AssetTable />
      </div>
    </MainLayout>
  );
}
