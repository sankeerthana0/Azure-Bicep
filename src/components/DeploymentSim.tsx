import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle, Play, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { DeploymentConfig, DeploymentLog, ResourceStatus } from '../types';

interface DeploymentSimProps {
  config: DeploymentConfig;
  isDeployed: boolean;
  onSetDeployed: (deployed: boolean) => void;
}

export default function DeploymentSim({
  config,
  isDeployed,
  onSetDeployed,
}: DeploymentSimProps) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [simulationType, setSimulationType] = useState<'none' | 'whatif' | 'deploy'>('none');
  
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Resource Names
  const rgName = `rg-${config.projectName}-${config.environmentType}`;
  const storageName = `st${config.projectName}${config.environmentType}xx`;
  const aspName = `asp-${config.projectName}-${config.environmentType}`;
  const webAppName = `app-${config.projectName}-${config.environmentType}`;
  const lawName = `law-${config.projectName}-${config.environmentType}`;
  const appiName = `appi-${config.projectName}-${config.environmentType}`;

  // Resource Tracking
  const resources: ResourceStatus[] = [
    { id: 'rg', type: 'resourceGroup', name: rgName, status: isDeployed ? 'Ready' : 'Not Started' },
    { id: 'law', type: 'logAnalyticsWorkspace', name: lawName, status: isDeployed ? 'Ready' : 'Not Started' },
    { id: 'appi', type: 'applicationInsights', name: appiName, status: isDeployed ? 'Ready' : 'Not Started' },
    { id: 'st', type: 'storageAccount', name: storageName, status: isDeployed ? 'Ready' : 'Not Started' },
    { id: 'asp', type: 'appServicePlan', name: aspName, status: isDeployed ? 'Ready' : 'Not Started' },
    { id: 'app', type: 'appService', name: webAppName, status: isDeployed ? 'Ready' : 'Not Started' },
  ];

  const pushLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' | 'cmd' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, type, message }]);
  };

  const runWhatIf = () => {
    if (loading) return;
    setLoading(true);
    setSimulationType('whatif');
    setLogs([]);
    setProgress(10);
    
    setTimeout(() => {
      pushLog(`az deployment sub what-if --location ${config.location} --template-file ./main.bicep --parameters ./main.parameters.json`, 'cmd');
    }, 100);

    const steps = [
      { delay: 800, log: 'Initializing subscription scope deployment comparison what-if...', type: 'info' },
      { delay: 1800, log: 'Analyzing currently active template blueprints against remote ARM catalog...', type: 'info' },
      { delay: 2800, log: `\nResource change details for resource target group: '${rgName}'`, type: 'info' },
      { delay: 3500, log: `+ Microsoft.Resources/resourceGroups/${rgName}\n  - location: "${config.location}"\n  - tags: { Environment: "${config.environmentType}", Project: "${config.projectName}" }`, type: 'success' },
      { delay: 4200, log: `+ Microsoft.Storage/storageAccounts/${storageName}\n  - location: "${config.location}"\n  - sku.name: "${config.storageSku}"\n  - kind: "StorageV2"\n  - supportsHttpsTrafficOnly: true`, type: 'success' },
      { delay: 5000, log: `+ Microsoft.Web/serverfarms/${aspName}\n  - location: "${config.location}"\n  - sku.name: "${config.aspSkuName}"\n  - sku.tier: "${config.aspSkuTier}"\n  - Linux reserved kernel: ${config.dotnetVersion.startsWith('node') ? 'true' : 'false'}`, type: 'success' },
      { delay: 5800, log: `+ Microsoft.Web/sites/${webAppName}\n  - location: "${config.location}"\n  - httpsOnly: ${config.enableHttpsOnly}\n  - serverFarmId: "asp-${config.projectName}-${config.environmentType}"`, type: 'success' },
      { delay: 6500, log: `+ Microsoft.OperationalInsights/workspaces/${lawName}\n  - retentionInDays: ${config.logAnalyticsRetentionDays}\n  - sku: "PerGB2018"`, type: 'success' },
      { delay: 7200, log: `+ Microsoft.Insights/components/${appiName}\n  - WorkspaceResourceId: "logAnalytics.outputs.workspaceId"`, type: 'success' },
      { delay: 8000, log: `\nWhat-if Scan Completed:\n- 6 resources to CREATE (+)\n- 0 resources to MODIFY (~)\n- 0 resources to DELETE (-)\n\nDeclaration syntax matches Azure Bicep standard compiler perfectly. OK to deploy.`, type: 'info' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        pushLog(step.log, step.type as any);
        setProgress(Math.min(90, Math.floor(((index + 1) / steps.length) * 100)));
        if (index === steps.length - 1) {
          setLoading(false);
          setProgress(100);
        }
      }, step.delay);
    });
  };

  const runDeployment = () => {
    if (loading) return;
    setLoading(true);
    setSimulationType('deploy');
    setLogs([]);
    setProgress(5);
    onSetDeployed(false);

    setTimeout(() => {
      pushLog(`./scripts/deploy.ps1`, 'cmd');
    }, 100);

    const steps = [
      { delay: 700, log: 'PowerShell script executing: Initializing connection bindings...', type: 'info', progress: 10 },
      { delay: 1500, log: 'Verifying Azure CLI Core Authentication scope...', type: 'info', progress: 15 },
      { delay: 2500, log: 'Active subscription authenticated. ID: 15817404-9843-dev-bicep-demo', type: 'success', progress: 25 },
      { delay: 3500, log: `[Step 1/6] Launching deployment for Resource Group: '${rgName}' in region: '${config.location}'...`, type: 'info', progress: 30 },
      { delay: 4800, log: `Successfully created resource group: '${rgName}' [Status: Ready ✔]`, type: 'success', progress: 40 },
      { delay: 5800, log: `[Step 2/6] Building centralized Log Analytics Workspace: '${lawName}'...`, type: 'info', progress: 45 },
      { delay: 7000, log: `Log Analytics Workspace deployed. [Output workspaceId generated]`, type: 'success', progress: 55 },
      { delay: 8000, log: `[Step 3/6] Spin up Storage Account: '${storageName}' & Enterprise App Service Plan: '${aspName}' in parallel...`, type: 'info', progress: 60 },
      { delay: 9500, log: `Storage account online with encryption settings. [SKU: ${config.storageSku}]`, type: 'success', progress: 70 },
      { delay: 10500, log: `App Service Plan hosting tier '${config.aspSkuName}' configured. Target OS: ${config.dotnetVersion.startsWith('node') ? 'Linux' : 'Windows'}`, type: 'success', progress: 80 },
      { delay: 11800, log: `[Step 4/6] Creating Application Insights component '${appiName}' connected to remote Log Workspace Workspace...`, type: 'info', progress: 85 },
      { delay: 13000, log: `Telemetry registry connection generated. [InstrumentationKey captured]`, type: 'success', progress: 90 },
      { delay: 14200, log: `[Step 5/6] Finalizing App Service Web App container '${webAppName}'...`, type: 'info', progress: 92 },
      { delay: 15500, log: `Injecting active configuration strings, TLS restrictions, & App Insights instrumentation keys.`, type: 'info', progress: 95 },
      { delay: 17000, log: `[Step 6/6] App Service is fully online, mapped, and deployed successfully! URL: https://${webAppName}.azurewebsites.net`, type: 'success', progress: 98 },
      { delay: 18000, log: `\n=========================================\nAZURE INFRASTRUCTURE DEPLOYMENT SUCCESSFUL\n=========================================\nOutputs generated:\n- Resource Group: ${rgName}\n- Web App host: https://${webAppName}.azurewebsites.net\n- Storage Blob: ${storageName}`, type: 'success', progress: 100 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        pushLog(step.log, step.type as any);
        setProgress(step.progress);
        if (step.progress === 100) {
          setLoading(false);
          onSetDeployed(true);
        }
      }, step.delay);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Parameters & Launcher cards */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-slate-800">
          <h3 className="text-slate-850 font-bold text-sm flex items-center gap-2 mb-3">
            <Play className="w-4 h-4 text-blue-600" />
            Deployment Execution Center
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-5">
            Run validation using Bicep's advanced <strong>What-If</strong> comparison engine, or trigger the live deployment pipeline to Azure Cloud.
          </p>

          <div className="space-y-3">
            <button
              id="btn-run-what-if"
              type="button"
              disabled={loading}
              onClick={runWhatIf}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
            >
              <FileText className="w-4 h-4" />
              Perform dry-run (az what-if)
            </button>

            <button
              id="btn-run-deploy"
              type="button"
              disabled={loading}
              onClick={runDeployment}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all`}
            >
              <Terminal className="w-4 h-4" />
              Deploy Infrastructure (deploy.ps1)
            </button>
          </div>

          {loading && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
                <span className="font-semibold">Execution status: {simulationType === 'whatif' ? 'What-If Dry Run' : 'Active Provisioning'}</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-250">
                <div 
                  className={`h-full transition-all duration-300 ${simulationType === 'whatif' ? 'bg-indigo-600' : 'bg-green-600'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Real-time provisioning indicators */}
        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm">
          <h4 className="text-slate-805 font-bold text-xs uppercase tracking-wider mb-3.5">Resource Deploy Registry</h4>
          <div className="space-y-2.5">
            {resources.map((res) => (
              <div key={res.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-[11px] font-mono font-medium">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide font-bold">{res.type}</span>
                  <span className="text-slate-700 mt-0.5 block truncate max-w-[150px] font-bold">{res.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  res.status === 'Ready' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}>
                  {res.status === 'Ready' ? 'Live (Ready)' : 'Not Started'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col justify-between overflow-hidden relative min-h-[400px] shadow-sm">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-950 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase ml-2">PowerShell - Azure CLI Engine</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">v7.2.0-scope</span>
        </div>

        {/* Terminal Console output streams */}
        <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 h-[340px] leading-relaxed">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <Terminal className="w-8 h-8 mb-2 opacity-40 animate-pulse text-blue-500" />
              <span className="text-slate-500 font-semibold">Shell inactive. Select an action to view streaming CLI logs.</span>
            </div>
          ) : (
            logs.map((log, i) => {
              let textClass = 'text-slate-300';
              let prefix = '';

              if (log.type === 'cmd') {
                textClass = 'text-cyan-455 font-bold';
                prefix = 'PS C:\\azure-bicep-infrastructure> ';
              } else if (log.type === 'success') {
                textClass = 'text-emerald-400';
                prefix = '[SUCCESS] ';
              } else if (log.type === 'warn') {
                textClass = 'text-amber-400';
                prefix = '[WARN] ';
              } else if (log.type === 'error') {
                textClass = 'text-rose-400';
                prefix = '[ERROR] ';
              }

              return (
                <div key={i} className="whitespace-pre-wrap">
                  <span className="text-slate-600 text-[10px] mr-2">[{log.timestamp}]</span>
                  <span className={textClass}>{prefix}{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef}></div>
        </div>

        {/* Deployed Notice / Fast Trigger info prompt */}
        {isDeployed && (
          <div className="absolute bottom-3 right-3 bg-slate-900/95 border border-green-500/30 p-3 rounded-xl shadow-xl flex items-center gap-3 backdrop-blur-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <span className="text-xs font-bold text-slate-100 block">Infrastructure Live!</span>
              <span className="text-[10px] text-green-400 block mt-0.5 font-medium">Explore deployment metrics in the Portal monitor.</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
