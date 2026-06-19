import React from 'react';
import { Database, Cpu, Globe, Activity, Terminal, Shield, ArrowRight } from 'lucide-react';
import { DeploymentConfig } from '../types';

interface ArchitectureCanvasProps {
  config: DeploymentConfig;
  selectedResourceId: string;
  onSelectResource: (id: string) => void;
}

export default function ArchitectureCanvas({
  config,
  selectedResourceId,
  onSelectResource,
}: ArchitectureCanvasProps) {
  // Compute names based on standard conventions
  const rgName = `rg-${config.projectName}-${config.environmentType}`;
  const storageName = `st${config.projectName}${config.environmentType}xx`;
  const aspName = `asp-${config.projectName}-${config.environmentType}`;
  const webAppName = `app-${config.projectName}-${config.environmentType}`;
  const lawName = `law-${config.projectName}-${config.environmentType}`;
  const appiName = `appi-${config.projectName}-${config.environmentType}`;

  const resources = [
    {
      id: 'rg',
      provider: 'Microsoft.Resources/resourceGroups',
      name: rgName,
      title: 'Resource Group',
      icon: Shield,
      desc: 'Scoped logical boundary containing all interconnected Azure resources. Deployed at Azure Subscription Scope.',
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm',
      activeColor: 'ring-2 ring-blue-600 border-blue-500 bg-blue-50/30 shadow-md',
      bicepSnippet: `resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: '${rgName}'
  location: '${config.location}'
}`
    },
    {
      id: 'storage',
      provider: 'Microsoft.Storage/storageAccounts',
      name: storageName,
      title: 'Storage Account',
      icon: Database,
      desc: `Durable object/blob storage. Currently configured as ${config.storageSku} for static assets/binary data. Supports HTTPS traffic only.`,
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm',
      activeColor: 'ring-2 ring-blue-600 border-blue-550 bg-blue-50/30 shadow-md',
      bicepSnippet: `resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: '${storageName}'
  location: '${config.location}'
  sku: { name: '${config.storageSku}' }
  kind: 'StorageV2'
}`
    },
    {
      id: 'asp',
      provider: 'Microsoft.Web/serverfarms',
      name: aspName,
      title: 'App Service Plan',
      icon: Cpu,
      desc: `The physical compute resources/hardware scale layer. Configured as ${config.aspSkuName} (${config.aspSkuTier} tier) under ${config.dotnetVersion.startsWith('node') ? 'Linux' : 'Windows'} Kernels.`,
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm',
      activeColor: 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/30 shadow-md',
      bicepSnippet: `resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: '${aspName}'
  sku: { name: '${config.aspSkuName}', tier: '${config.aspSkuTier}' }
}`
    },
    {
      id: 'webapp',
      provider: 'Microsoft.Web/sites',
      name: webAppName,
      title: 'App Service (Web App)',
      icon: Globe,
      desc: `Hosting environment for the actual back-end/front-end executable. Running ${config.dotnetVersion} over HTTPS. Bound to App Service Plan compute scale.`,
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm',
      activeColor: 'ring-2 ring-blue-600 border-blue-600 bg-blue-600 text-white shadow-md font-semibold',
      bicepSnippet: `resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: '${webAppName}'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: ${config.enableHttpsOnly}
  }
}`
    },
    {
      id: 'law',
      provider: 'Microsoft.OperationalInsights/workspaces',
      name: lawName,
      title: 'Log Analytics Workspace',
      icon: Terminal,
      desc: `Central workspace logging tank. Retains full queries, system audits, & operational logs for ${config.logAnalyticsRetentionDays} days.`,
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm',
      activeColor: 'ring-2 ring-purple-600 border-purple-500 bg-purple-50/30 shadow-md',
      bicepSnippet: `resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2021-12-01-preview' = {
  name: '${lawName}'
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: ${config.logAnalyticsRetentionDays} }
}`
    },
    {
      id: 'appi',
      provider: 'Microsoft.Insights/components',
      name: appiName,
      title: 'Application Insights',
      icon: Activity,
      desc: 'Application performance management (APM) telemetry system monitoring latency, exceptions, live streaming metrics. Pipes storage to Log Analytics.',
      color: 'border-slate-200 text-slate-700 bg-white hover:bg-slate-55 shadow-sm',
      activeColor: 'ring-2 ring-pink-600 border-pink-500 bg-pink-50/30 shadow-md',
      bicepSnippet: `resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appiName}'
  kind: 'web'
  properties: { WorkspaceResourceId: logAnalyticsWorkspace.id }
}`
    }
  ];

  const selectedRes = resources.find(r => r.id === selectedResourceId) || resources[0];
  const IconComponent = selectedRes.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Topology Canvas */}
      <div className="lg:col-span-2 relative p-6 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between overflow-hidden min-h-[500px] shadow-sm">
        {/* Subtitle Info */}
        <div className="flex justify-between items-center z-10">
          <div>
            <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              Interactive Sub-Scope Topology
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any infrastructure node to inspect resource configurations & Bicep modules.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-650 border border-slate-200 uppercase font-semibold">
            Azure Scope: Subscription
          </span>
        </div>

        {/* Visual Map Layout */}
        <div className="relative my-8 py-4 flex flex-col items-center justify-center gap-10">
          
          {/* Outer Subscription bounds visual marker */}
          <div className="absolute inset-0 border border-dashed border-slate-200 rounded-xl pointer-events-none flex items-start p-2">
            <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Target Subscription</span>
          </div>

          {/* Resource Group Container */}
          <div className="w-full max-w-xl border-2 border-dashed border-blue-500/20 bg-blue-50/5 p-4 rounded-xl relative">
            <span onClick={() => onSelectResource('rg')} className={`absolute -top-3 left-4 text-[10px] font-mono px-2 py-0.5 rounded border uppercase cursor-pointer transition-all ${
              selectedResourceId === 'rg' 
                ? 'bg-blue-600 border-blue-550 text-white font-semibold shadow-sm' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}>
              Resource Group: {rgName}
            </span>

            {/* Grid of Inner Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              
              {/* Storage Account Card */}
              <button
                id="resource-storage-account"
                type="button"
                onClick={() => onSelectResource('storage')}
                className={`flex flex-col p-4 border rounded-xl text-left transition-all ${
                  selectedResourceId === 'storage' ? resources[1].activeColor : resources[1].color
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">st{config.projectName}...</h4>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Storage Blob</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-mono">
                    {config.storageSku}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-mono">
                    HTTPS Only
                  </span>
                </div>
              </button>

              {/* Log Analytics Workspace */}
              <button
                id="resource-log-analytics"
                type="button"
                onClick={() => onSelectResource('law')}
                className={`flex flex-col p-4 border rounded-xl text-left transition-all ${
                  selectedResourceId === 'law' ? resources[4].activeColor : resources[4].color
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">law-{config.projectName}</h4>
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Log Workspace</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 font-mono">
                    {config.logAnalyticsRetentionDays} Days Retention
                  </span>
                </div>
              </button>

              {/* Hosting compute column (App Service Plan + Web App stack) */}
              <div className="flex flex-col gap-3 md:col-span-1">
                <span className="text-[9px] text-slate-400 font-mono text-center block uppercase">Compute Scale Tier</span>
                
                {/* App Web App hosted on App Service Plan */}
                <button
                  id="resource-web-app"
                  type="button"
                  onClick={() => onSelectResource('webapp')}
                  className={`flex flex-col p-4 border rounded-xl text-left transition-all ${
                    selectedResourceId === 'webapp' ? `${resources[3].activeColor}` : `${resources[3].color}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedResourceId === 'webapp' ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${selectedResourceId === 'webapp' ? 'text-white' : 'text-slate-800'}`}>app-{config.projectName}</h4>
                      <span className={`text-[9px] font-mono block uppercase ${selectedResourceId === 'webapp' ? 'text-blue-105' : 'text-slate-500'}`}>Web Server App</span>
                    </div>
                  </div>
                  <div className={`mt-2 text-[9px] ${selectedResourceId === 'webapp' ? 'text-blue-50' : 'text-slate-500'}`}>
                    Host Engine: {config.dotnetVersion}
                  </div>
                </button>

                {/* Underlying compute plan */}
                <button
                  id="resource-app-service-plan"
                  type="button"
                  onClick={() => onSelectResource('asp')}
                  className={`flex flex-col p-3 border rounded-xl text-left transition-all ${
                    selectedResourceId === 'asp' ? resources[2].activeColor : resources[2].color
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-650" />
                    <span className="text-xs font-bold text-slate-800">asp-{config.projectName}</span>
                  </div>
                  <div className="mt-1.5 text-[9px] font-mono text-slate-500 flex justify-between">
                    <span>OS: {config.dotnetVersion.startsWith('node') ? 'Linux' : 'Windows'}</span>
                    <span>SKU: {config.aspSkuName}</span>
                  </div>
                </button>
              </div>

              {/* App Insights Card */}
              <div className="flex flex-col justify-end">
                <button
                  id="resource-app-insights"
                  type="button"
                  onClick={() => onSelectResource('appi')}
                  className={`flex flex-col p-4 border rounded-xl text-left transition-all h-[116px] justify-between ${
                    selectedResourceId === 'appi' ? resources[5].activeColor : resources[5].color
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">appi-{config.projectName}</h4>
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">App Insights APM</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2">
                    Connected to LAW Workspace
                  </div>
                </button>
              </div>

            </div>
          </div>

          {/* SVG Dependency connections */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
            {/* Draw light paths/lines representing dependencies */}
            <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
              </defs>
            </svg>
          </div>

        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 border-t border-slate-150 pt-4 mt-2">
          <span className="flex items-center gap-1.5 font-medium"><Shield className="w-3.5 h-3.5 text-blue-600" /> Subscription Boundary</span>
          <span className="flex items-center gap-1.5 font-medium"><Cpu className="w-3.5 h-3.5 text-indigo-605" /> Compute Farm</span>
          <span className="flex items-center gap-1.5 font-medium"><Globe className="w-3.5 h-3.5 text-blue-600" /> Web Ingress</span>
          <span className="flex items-center gap-1.5 font-medium"><Terminal className="w-3.5 h-3.5 text-purple-600" /> Central Registry Logs</span>
        </div>
      </div>

      {/* Inspect Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm text-slate-800">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {selectedRes.provider}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-700">
              Active Selection
            </span>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <div className={`p-2.5 rounded-xl border ${selectedRes.id === 'rg' ? 'border-blue-100 bg-blue-50 text-blue-600' : 'border-slate-150 bg-slate-50 text-slate-500'}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-base">{selectedRes.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {selectedRes.desc}
              </p>
            </div>
          </div>

          {/* Details / Configurations list */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-5">
            <h4 className="text-xs font-bold text-slate-705 mb-2.5">Properties Injected:</h4>
            <ul className="space-y-2 text-[11px] font-mono font-medium">
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">Resource Name</span>
                <span className="text-slate-700 max-w-[150px] truncate">{selectedRes.name}</span>
              </li>
              <li className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-400">location</span>
                <span className="text-slate-700">{config.location}</span>
              </li>
              {selectedRes.id === 'storage' && (
                <>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">sku.name</span>
                    <span className="text-blue-600 font-bold">{config.storageSku}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">kind</span>
                    <span className="text-slate-705">StorageV2</span>
                  </li>
                </>
              )}
              {selectedRes.id === 'asp' && (
                <>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">sku.name</span>
                    <span className="text-indigo-600 font-bold">{config.aspSkuName}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">sku.tier</span>
                    <span className="text-slate-705">{config.aspSkuTier}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">linuxOS</span>
                    <span className="text-slate-705">{config.dotnetVersion.startsWith('node') ? 'true' : 'false'}</span>
                  </li>
                </>
              )}
              {selectedRes.id === 'webapp' && (
                <>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">httpsOnly</span>
                    <span className="text-slate-705">{config.enableHttpsOnly ? 'true' : 'false'}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">runtimeStack</span>
                    <span className="text-slate-705">{config.dotnetVersion}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">monitoring</span>
                    <span className="text-green-600 font-bold">ApplicationInsights (APM)</span>
                  </li>
                </>
              )}
              {selectedRes.id === 'law' && (
                <>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">retentionInDays</span>
                    <span className="text-purple-640 font-bold">{config.logAnalyticsRetentionDays}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400">sku</span>
                    <span className="text-slate-705">PerGB2018</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Declarative preview */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Compiled Bicep Markup</span>
            <span className="text-[9px] text-slate-400 font-mono">Real-time parameters</span>
          </div>
          <pre className="text-[10.5px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-900 text-cyan-400 overflow-x-auto max-h-[140px] leading-relaxed shadow-inner">
            <code>{selectedRes.bicepSnippet}</code>
          </pre>
          <button
            type="button"
            onClick={() => onSelectResource(selectedRes.id)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
          >
            Inspect module file
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
