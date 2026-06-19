import React, { useState } from 'react';
import { 
  Cloud, Terminal, Settings2, Shield, Compass, BookOpen, 
  HelpCircle, Share2, Server, HelpCircle as HelpIcon, Sparkles
} from 'lucide-react';
import { DeploymentConfig } from './types';
import ArchitectureCanvas from './components/ArchitectureCanvas';
import CodeExplorer from './components/CodeExplorer';
import DeploymentSim from './components/DeploymentSim';
import AzurePortalSim from './components/AzurePortalSim';
import AiArchitect from './components/AiArchitect';
import LinkedInBuilder from './components/LinkedInBuilder';

export default function App() {
  const [activeTab, setActiveTab] = useState<'topology' | 'code' | 'deploy' | 'portal' | 'chat' | 'share'>('topology');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('rg');
  
  // Configuration Settings state
  const [config, setConfig] = useState<DeploymentConfig>({
    projectName: 'bicepapp',
    location: 'eastus',
    storageSku: 'Standard_LRS',
    aspSkuName: 'S1',
    aspSkuTier: 'Standard',
    dotnetVersion: 'v8.0',
    enableHttpsOnly: true,
    logAnalyticsRetentionDays: 30,
    environmentType: 'dev',
  });

  const [isDeployed, setIsDeployed] = useState<boolean>(false);

  // Synchronized Solutions Architect conversational assistant list
  const [chatHistory, setChatHistory] = useState<any[]>([
    {
      role: 'assistant',
      content: `Hello! I am your Azure Solutions Architect Advisor. 

I've scanned your current configurations (Target Region: **${config.location}**, Environment: **${config.environmentType}**).

Feel free to ask me anything about optimizing this Bicep architecture! For instance:
* **"How do I secure my Storage Account with a Virtual Network firewall?"**
* **"Explain structural variables and module outputs in Bicep."**
* **"How can I set up deployment slots for App Service?"**`
    }
  ]);

  // Command to quickly append questions and select chat tab
  const handleAskAi = (promptText: string) => {
    setActiveTab('chat');
    // Prepend user message
    const nextHist = [...chatHistory, { role: 'user', content: promptText }];
    setChatHistory(nextHist);
    
    // Auto-fire request triggers
    setTimeout(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextHist,
            templateContext: config
          })
        });
        
        if (!response.ok) throw new Error('Proxy API error');
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } catch (err) {
        setChatHistory(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: '⚠️ **Error**: Failed to contact Gemini solutions backend. Please ensure the API keys are configured.' 
          }
        ]);
      }
    }, 100);
  };

  // Sync ASP SKU Tiers based on selections
  const handleAspSkuChange = (sku: string) => {
    let tier: 'Free' | 'Basic' | 'Standard' | 'Premium' = 'Standard';
    if (sku === 'F1') tier = 'Free';
    else if (sku === 'B1') tier = 'Basic';
    else if (sku === 'S1') tier = 'Standard';
    else if (sku.startsWith('P')) tier = 'Premium';

    setConfig(prev => ({
      ...prev,
      aspSkuName: sku as any,
      aspSkuTier: tier
    }));
  };

  const handleSelectResourceFromTopology = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setActiveTab('code');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none antialiased">
      
      {/* Top Main navigation task bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl text-white flex items-center justify-center shadow-md">
            <Cloud className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-slate-800 font-bold text-base tracking-tight flex items-center gap-2">
              Azure Bicep Portfolio Sandbox
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-semibold shadow-sm">
                IaC Builder
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Design, compile, simulate, and present modular Infrastructure-as-Code environments.
            </p>
          </div>
        </div>

        {/* Action tags */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 text-xs font-semibold">
            <span className="text-slate-500">status:</span>{' '}
            <span className={`${isDeployed ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
              {isDeployed ? '● Provisioned (Live)' : '○ Declarative (Offline)'}
            </span>
          </div>

          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 shadow-sm transition"
          >
            GitHub Repo
          </a>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Config parameters Form */}
        <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-1 border-b border-slate-150">
            <Settings2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Bicep Parameters</h2>
          </div>

          {/* Project naming */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="projectName">Project Base Prefix</label>
            <input
              id="projectName"
              type="text"
              value={config.projectName}
              onChange={(e) => setConfig({ ...config, projectName: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
              placeholder="e.g. cloudapp"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Region location */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="location">Deployment Location</label>
            <select
              id="location"
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="eastus">East US (Virginia)</option>
              <option value="westus2">West US 2 (Washington)</option>
              <option value="westeurope">West Europe (Amsterdam)</option>
              <option value="southeastasia">Southeast Asia (Singapore)</option>
            </select>
          </div>

          {/* Environment selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="environmentType">Environment Stage</label>
            <select
              id="environmentType"
              value={config.environmentType}
              onChange={(e) => setConfig({ ...config, environmentType: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded-lg font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="dev">Development (Dev)</option>
              <option value="test">Testing / Staging (Stg)</option>
              <option value="prod">Production (Prod)</option>
            </select>
          </div>

          {/* Storage SKU option */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="storageSku">Storage Account SKU</label>
            <select
              id="storageSku"
              value={config.storageSku}
              onChange={(e) => setConfig({ ...config, storageSku: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="Standard_LRS">Standard_LRS (Local Redundancy)</option>
              <option value="Standard_GRS">Standard_GRS (Geo-Redundant)</option>
              <option value="Standard_ZRS">Standard_ZRS (Zone Redundancy)</option>
              <option value="Premium_LRS">Premium_LRS (Solid-State Blob)</option>
            </select>
          </div>

          {/* App Service Plans SKU sizing */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="aspSkuName">App Service Sku size</label>
            <select
              id="aspSkuName"
              value={config.aspSkuName}
              onChange={(e) => handleAspSkuChange(e.target.value)}
              className="w-full bg-blue-50/40 border border-blue-200 text-blue-700 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-semibold cursor-pointer"
            >
              <option value="F1">F1 (Free Shared Core)</option>
              <option value="B1">B1 (Basic Dev tier - Linux)</option>
              <option value="S1">S1 (Standard Enterprise Scale)</option>
              <option value="P1v2">P1v2 (Premium v2 high storage)</option>
              <option value="P2v2">P2v2 (Premium v2 maximum compute)</option>
            </select>
          </div>

          {/* Web App backend host version selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="dotnetVersion">Runtime Linux Stack</label>
            <select
              id="dotnetVersion"
              value={config.dotnetVersion}
              onChange={(e) => setConfig({ ...config, dotnetVersion: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="v8.0">ASP.NET / C# Core v8.0</option>
              <option value="v9.0">ASP.NET / C# Core v9.0</option>
              <option value="node18">Node.js ES Module v18 LTS</option>
              <option value="node20">Node.js ES Module v20 LTS</option>
            </select>
          </div>

          {/* Log retain period */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-mono block font-semibold uppercase" htmlFor="logAnalyticsRetentionDays">Retention Logs Workspace</label>
            <select
              id="logAnalyticsRetentionDays"
              value={config.logAnalyticsRetentionDays}
              onChange={(e) => setConfig({ ...config, logAnalyticsRetentionDays: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="30">30 Days Retention</option>
              <option value="90">90 Days Retention</option>
              <option value="180">180 Days Retention (Audit limits)</option>
              <option value="365">365 Days Retention</option>
            </select>
          </div>

          {/* Toggle checkbox list */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              id="enableHttpsOnly"
              type="checkbox"
              checked={config.enableHttpsOnly}
              onChange={(e) => setConfig({ ...config, enableHttpsOnly: e.target.checked })}
              className="accent-blue-600 rounded cursor-pointer w-4 h-4"
            />
            <label htmlFor="enableHttpsOnly" className="text-[11px] font-mono text-slate-600 font-semibold cursor-pointer">
              Lock HTTPS Traffic only
            </label>
          </div>
        </section>

        {/* Tab workspace display panels */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Navigation Tab lists */}
          <div className="flex border-b border-slate-200 overflow-x-auto scroller-hide pb-0.5 gap-1.5 font-medium">
            <button
              type="button"
              id="tab-topology"
              onClick={() => setActiveTab('topology')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'topology'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              🎨 Active Topology
            </button>

            <button
              type="button"
              id="tab-code"
              onClick={() => setActiveTab('code')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'code'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              💾 Bicep Code Repository
            </button>

            <button
              type="button"
              id="tab-deploy"
              onClick={() => setActiveTab('deploy')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'deploy'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              ⚡ Powershell Terminal Deploy
            </button>

            <button
              type="button"
              id="tab-portal"
              onClick={() => setActiveTab('portal')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'portal'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              🖥 Azure Portal Monitor
            </button>

            <button
              type="button"
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              💬 Solutions Advisor Assist
            </button>

            <button
              type="button"
              id="tab-share"
              onClick={() => setActiveTab('share')}
              className={`py-2.5 px-4 text-xs font-mono rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'share'
                  ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55'
              }`}
            >
              🤝 LinkedIn & Pipeline Share
            </button>
          </div>

          {/* Active component panels rendering */}
          <div className="transition-all duration-200 ease-out">
            {activeTab === 'topology' && (
              <ArchitectureCanvas
                config={config}
                selectedResourceId={selectedResourceId}
                onSelectResource={handleSelectResourceFromTopology}
              />
            )}

            {activeTab === 'code' && (
              <CodeExplorer
                config={config}
                onAskAi={handleAskAi}
                selectedResourceId={selectedResourceId}
              />
            )}

            {activeTab === 'deploy' && (
              <DeploymentSim
                config={config}
                isDeployed={isDeployed}
                onSetDeployed={setIsDeployed}
              />
            )}

            {activeTab === 'portal' && (
              <AzurePortalSim
                config={config}
                isDeployed={isDeployed}
              />
            )}

            {activeTab === 'chat' && (
              <AiArchitect
                config={config}
                chatHistory={chatHistory}
                onSetChatHistory={setChatHistory}
              />
            )}

            {activeTab === 'share' && (
              <LinkedInBuilder
                config={config}
                onAskAi={handleAskAi}
              />
            )}
          </div>

        </section>

      </main>

      {/* Footer credits layout */}
      <footer className="bg-white border-t border-slate-200 px-6 py-5 mt-auto text-center font-mono text-[11px] text-slate-500 flex justify-between flex-wrap gap-4 items-center">
        <span>Declared target: Azure Global Commercial Resource Group Manager</span>
        <span>Crafted using declarative Bicep Templates & Gemini 3.5 Assistant. MIT License.</span>
      </footer>

    </div>
  );
}
