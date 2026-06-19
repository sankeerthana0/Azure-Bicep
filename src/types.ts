export interface BicepTemplateFile {
  name: string;
  path: string;
  category: 'main' | 'module' | 'script' | 'doc';
  description: string;
  code: string;
}

export interface DeploymentConfig {
  projectName: string;
  location: string;
  storageSku: 'Standard_LRS' | 'Standard_GRS' | 'Standard_ZRS' | 'Premium_LRS';
  aspSkuName: 'F1' | 'B1' | 'S1' | 'P1v2' | 'P2v2';
  aspSkuTier: 'Free' | 'Basic' | 'Standard' | 'Premium';
  dotnetVersion: 'v8.0' | 'v9.0' | 'node18' | 'node20';
  enableHttpsOnly: boolean;
  logAnalyticsRetentionDays: number;
  environmentType: 'dev' | 'test' | 'prod';
}

export interface DeploymentLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'cmd';
  message: string;
}

export interface ResourceStatus {
  id: string;
  type: string;
  name: string;
  status: 'Ready' | 'Deploying' | 'Not Started';
}
