import React, { useState, useEffect } from 'react';
import { 
  Globe, Server, Cpu, Database, Activity, RefreshCw, 
  ArrowUpRight, BarChart, Users, Lock, Zap, FileText 
} from 'lucide-react';
import { DeploymentConfig } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AzurePortalSimProps {
  config: DeploymentConfig;
  isDeployed: boolean;
}

export default function AzurePortalSim({ config, isDeployed }: AzurePortalSimProps) {
  const [trafficRate, setTrafficRate] = useState(15);
  const [cpuLoad, setCpuLoad] = useState(22);
  const [requestCount, setRequestCount] = useState(1504);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'metrics' | 'logs' | 'endpoints'>('metrics');
  const [logTraces, setLogTraces] = useState<string[]>([]);

  // Resource parameters
  const rgName = `rg-${config.projectName}-${config.environmentType}`;
  const webAppHost = `${config.projectName}-${config.environmentType}.azurewebsites.net`;
  const storageName = `st${config.projectName}${config.environmentType}xx`;

  // Start telemetry loop
  useEffect(() => {
    if (!isDeployed) return;

    // Seed initial historical chart points
    const initialPoints = Array.from({ length: 15 }, (_, i) => ({
      time: new Date(Date.now() - (15 - i) * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      cpu: Math.floor(Math.random() * 10) + 15,
      requests: Math.floor(Math.random() * 10) + 10,
    }));
    setLiveData(initialPoints);

    // Initial log seeds
    setLogTraces([
      `[APINSIGHTS] Diagnostic Engine initialized at subscription scope region [${config.location}]`,
      `[LAW] Handshake generated between LAW-${config.projectName} and APPI-${config.projectName}`,
      `[WEBAPP] Kestrel web server running node/dotnet engine successfully`,
      `[STORAGE] Primary connection established with secure endpoint st${config.projectName}...`
    ]);

    const interval = setInterval(() => {
      setLiveData(prev => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const nextCpu = Math.max(5, Math.min(100, Math.floor(trafficRate * 1.5) + (Math.random() * 12 - 6)));
        const nextReqList = Math.max(2, Math.floor(trafficRate + (Math.random() * 6 - 3)));

        const slice = prev.slice(1);
        return [...slice, { time: nextTime, cpu: Math.floor(nextCpu), requests: nextReqList }];
      });

      setRequestCount(prev => prev + Math.floor(trafficRate / 5) + 1);

      // Random logs ticking
      setLogTraces(prev => {
        const randomTraces = [
          `[WEBAPP] GET / - 200 OK - IP: ${Math.floor(Math.random() * 200) + 20}.45.12.${Math.floor(Math.random() * 250)}`,
          `[WEBAPP] GET /api/health - 200 OK - Latency: ${Math.floor(Math.random() * 10) + 5}ms`,
          `[APINSIGHTS] Telemetric counters pushed successfully. Response size: ${Math.floor(Math.random() * 200) + 300} bytes`,
          `[STORAGE] Checking blob store for asset index cache...`,
          `[APINSIGHTS] Heartbeat ping success. Status: healthy`,
        ];
        const nextLog = randomTraces[Math.floor(Math.random() * randomTraces.length)];
        return [nextLog, ...prev.slice(0, 15)];
      });

    }, 3000);

    return () => clearInterval(interval);
  }, [isDeployed, trafficRate, config.projectName]);

  // Traffic Load simulation button triggers
  const handleBoostTraffic = () => {
    setTrafficRate(95);
    setCpuLoad(78);
    setLogTraces(prev => [
      `[WEBAPP] WARNING: CPU load threshold exceeded 75%! Mapped on Plan Sku: ${config.aspSkuName}`,
      `[APINSIGHTS] Traffic surge triggered: ${Math.floor(Math.random() * 150) + 150} queries/sec.`,
      `[WEBAPP] GET /api/v1/checkout - 200 OK - DB load 35ms`,
      ...prev
    ]);

    // Gradual cooling down trigger
    setTimeout(() => {
      setTrafficRate(22);
      setCpuLoad(28);
    }, 9000);
  };

  if (!isDeployed) {
    return (
      <div className="bg-white border border-slate-205 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[500px] shadow-sm text-slate-800">
        <Server className="w-12 h-12 text-slate-405 animate-bounce mb-3" />
        <h3 className="text-slate-800 text-base font-bold">Azure Portal Environment Offline</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
          The Azure portal monitoring simulation can only act once resources have been deployed. Please head over to the <strong>Terminal Deployer</strong> tab and execute your Bicep infrastructure templates first!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Simulation Header stats bar */}
      <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm text-slate-805">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Globe className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                http://{webAppHost}
                <a href={`https://${webAppHost}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Azure App Service Web App Status: <span className="text-green-700 font-bold">● Healthy & Active</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              id="btn-boost-traffic"
              onClick={handleBoostTraffic}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Surge Ingress Traffic
            </button>
          </div>
        </div>

        {/* Portal Breadcrumbs metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Resource Group</span>
            <span className="text-slate-700 mt-1 block truncate font-bold">{rgName}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Region</span>
            <span className="text-slate-700 mt-1 block font-bold">{config.location}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">App hosting SKU</span>
            <span className="text-indigo-600 mt-1 block font-bold">{config.aspSkuName} ({config.aspSkuTier})</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-slate-400 block text-[9px] uppercase font-bold">Storage SKU</span>
            <span className="text-blue-600 mt-1 block font-bold">{config.storageSku}</span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation panel */}
        <div className="lg:col-span-1 bg-white border border-slate-205 rounded-2xl p-4 space-y-1 shadow-sm h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg text-left transition-colors font-bold ${
              activeTab === 'metrics' ? 'bg-slate-100 text-slate-800 border-l-2 border-blue-600 pl-2.5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850'
            }`}
          >
            <BarChart className="w-4 h-4 text-cyan-600" />
            Live App Metrics (APM)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg text-left transition-colors font-bold ${
              activeTab === 'logs' ? 'bg-slate-100 text-slate-800 border-l-2 border-purple-650 pl-2.5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-855'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            Log Analytics Stream
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('endpoints')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg text-left transition-colors font-bold ${
              activeTab === 'endpoints' ? 'bg-slate-100 text-slate-800 border-l-2 border-blue-600 pl-2.5' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850'
            }`}
          >
            <Lock className="w-4 h-4 text-blue-600" />
            Configured Secrets & Access
          </button>
        </div>

        {/* Console Tab Content */}
        <div className="lg:col-span-3 bg-white border border-slate-205 rounded-2xl p-5 min-h-[380px] flex flex-col justify-between shadow-sm">
          
          {activeTab === 'metrics' && (
            <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Live APM Analytics</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Capturing metrics via Application Insights telemetry</p>
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200/80 flex items-center gap-1 font-bold">
                  <Activity className="w-3.5 h-3.5 text-green-600 animate-pulse" /> Live Telemetry Rate: {trafficRate} req/s
                </div>
              </div>

              {/* Graphical representation loops */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[220px]">
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">CPU Utilization (%)</span>
                  <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={liveData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '10px', color: '#1e293b' }} />
                        <Line type="monotone" dataKey="cpu" stroke="#0284c7" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Total HTTP Requests</span>
                  <div className="w-full h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={liveData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="time" hide />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '10px', color: '#1e293b' }} />
                        <Line type="monotone" dataKey="requests" stroke="#4f46e5" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Aggregate values */}
              <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-4 text-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Aggregation Total</span>
                  <span className="text-slate-800 text-base font-bold font-mono mt-1 block">{requestCount}</span>
                </div>
                <div className="text-center border-x border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Response Timeout</span>
                  <span className="text-green-600 text-base font-bold font-mono mt-1 block">18ms</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Success Rate</span>
                  <span className="text-green-600 text-base font-bold font-mono mt-1 block">100.0%</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 flex-1 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center mb-1">
                <div>
                  <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Log Analytics Workspace Logs</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Diagnostic queries from Kusto Engine (PerGB2018 Workspace)</p>
                </div>
                <span className="text-[10px] font-mono text-purple-700 px-2 py-0.5 rounded border border-purple-250 bg-purple-50 font-bold">
                  Retention: {config.logAnalyticsRetentionDays} days
                </span>
              </div>

              {/* Streaming list of logs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10.5px] h-[240px] overflow-y-auto space-y-1.5 text-slate-400 scroller select-text shadow-inner">
                {logTraces.map((trace, idx) => {
                  let logClass = 'text-slate-400';
                  if (trace.includes('WARNING') || trace.includes('Host limit')) {
                    logClass = 'text-yellow-500 font-bold';
                  } else if (trace.includes('GET /api') || trace.includes('established')) {
                    logClass = 'text-cyan-400';
                  } else if (trace.includes('[APINSIGHTS]')) {
                    logClass = 'text-pink-400';
                  }
                  return (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed truncate">
                      <span className="text-slate-650 mr-2.5">&gt;&gt;</span>
                      <span className={logClass}>{trace}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider">Secure Environment Access Key Strings</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Secrets mapped into App Settings inside the App Service container via Bicep parameters</p>
              </div>

              <div className="space-y-3.5 mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400 uppercase">APPINSIGHTS_INSTRUMENTATIONKEY</span>
                    <span className="text-green-600">Injected successfully ✔</span>
                  </div>
                  <input
                    type="password"
                    disabled
                    value="appi-instrumentation-key-15817404-9843-abcd"
                    className="w-full bg-white border border-slate-200 text-slate-400 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none shadow-sm"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400 uppercase">ASPNETCORE_ENVIRONMENT</span>
                    <span className="text-indigo-600">Active</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={config.environmentType === 'prod' ? 'Production' : config.environmentType === 'test' ? 'Staging' : 'Development'}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none shadow-sm"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-1.5">
                  <div className="flex justify-between text-[11px] font-mono font-bold">
                    <span className="text-slate-400 uppercase">BLOB_SERVICE_ENDPOINT</span>
                    <span className="text-blue-600">Active</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={`https://${storageName}.blob.core.windows.net/`}
                    className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none shadow-sm"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
