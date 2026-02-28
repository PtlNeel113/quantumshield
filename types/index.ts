// Dashboard types
export interface RiskMetric {
  label: string;
  value: number | string;
  trend: number; // percentage change
  severity: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
}

export interface TimelineData {
  year: number;
  rsa2048: number;
  ecc256: number;
  rsa4096: number;
  aes256: number;
}

export interface HeatmapData {
  system: string;
  retention: string;
  risk: number;
}

// Asset types
export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  algorithm: string;
  keyLength: number;
  exposureSurface: string;
  sensitivity: string;
  retentionPeriod: string;
  quantumRiskScore: number;
  dependencies: string[];
  lastScanned: string;
}

export interface AssetFilter {
  type?: string;
  algorithm?: string;
  location?: string;
  riskLevel?: string;
  retentionPeriod?: string;
}

// Crypto types
export interface CryptoEndpoint {
  id: string;
  endpoint: string;
  algorithm: string;
  keyLength: number;
  issuer: string;
  expiryDate: string;
  quantum_risk: string;
}

export interface AlgorithmDistribution {
  algorithm: string;
  count: number;
  percentage: number;
}

// State types
export interface DashboardState {
  selectedAsset: Asset | null;
  activeView: 'dashboard' | 'assets' | 'crypto' | 'data-lifespan' | 'quantum-timeline' | 'harvest-risk' | 'attack-simulation' | 'migration-advisor' | 'graph-explorer' | 'reports' | 'settings';
  filters: AssetFilter;
  riskThreshold: 'conservative' | 'moderate' | 'aggressive';
  scanInProgress: boolean;
}

export interface ScanStatus {
  id: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assetsFound: number;
  lastUpdate: string;
}
