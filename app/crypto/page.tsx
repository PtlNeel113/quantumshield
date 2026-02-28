'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { CryptoTabs } from '@/components/crypto/crypto-tabs';
import { AlgorithmDistribution } from '@/components/crypto/algorithm-distribution';
import { WeakCryptoAlerts } from '@/components/crypto/weak-crypto-alerts';

export default function CryptoPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="page-title">Cryptography Discovery</h1>
          <p className="text-sm text-slate-500 font-medium">
            Inventory and analysis of cryptographic systems across your infrastructure
          </p>
        </div>

        {/* Alerts */}
        <WeakCryptoAlerts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Algorithm Distribution */}
          <div className="lg:col-span-1">
            <AlgorithmDistribution />
          </div>

          {/* Tabs */}
          <div className="lg:col-span-2">
            <CryptoTabs />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
