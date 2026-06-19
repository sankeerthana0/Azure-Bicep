import React, { useState } from 'react';
import { 
  Folder, FolderOpen, FileCode, Copy, Check, Search, 
  Sparkles, RefreshCw, Layers, Edit3, Save 
} from 'lucide-react';
import { BicepTemplateFile, DeploymentConfig } from '../types';
import { 
  getStorageBicepCode, 
  getAppServicePlanBicepCode, 
  getAppServiceBicepCode, 
  getLogAnalyticsBicepCode, 
  getAppInsightsBicepCode, 
  getMainBicepCode, 
  getMainParametersJson, 
  getDeployPowershell, 
  getReadmeMarkdown 
} from '../constants/bicepTemplates';

interface CodeExplorerProps {
  config: DeploymentConfig;
  onAskAi: (prompt: string) => void;
  selectedResourceId?: string;
}

export default function CodeExplorer({ 
  config, 
  onAskAi,
  selectedResourceId 
}: CodeExplorerProps) {
  // Regenerate bicep files on demand based on parameters
  const getFiles = (): BicepTemplateFile[] => [
    {
      name: 'main.bicep',
      path: 'main.bicep',
      category: 'main',
      description: 'Core orchestration and resource group level provision deployment entry point.',
      code: getMainBicepCode(config)
    },
    {
      name: 'main.parameters.json',
      path: 'main.parameters.json',
      category: 'main',
      description: 'Configured parameters, environment values, and subscription credentials schema.',
      code: getMainParametersJson(config)
    },
    {
      name: 'README.md',
      path: 'README.md',
      category: 'doc',
      description: 'Polished developer repository documentation complete with architectural visual schemas and run instructions.',
      code: getReadmeMarkdown(config)
    },
    {
      name: 'storage.bicep',
      path: 'modules/storage.bicep',
      category: 'module',
      description: 'Bicep module for configuring secure Azure Storage Accounts.',
      code: getStorageBicepCode(config)
    },
    {
      name: 'appServicePlan.bicep',
      path: 'modules/appServicePlan.bicep',
      category: 'module',
      description: 'Module setting up underlying compute power options like Linux hosting tiers.',
      code: getAppServicePlanBicepCode(config)
    },
    {
      name: 'appService.bicep',
      path: 'modules/appService.bicep',
      category: 'module',
      description: 'App service code injecting AppSettings connection items.',
      code: getAppServiceBicepCode(config)
    },
    {
      name: 'logAnalytics.bicep',
      path: 'modules/logAnalytics.bicep',
      category: 'module',
      description: 'Enterprise telemetry space setup storing server audit transactions.',
      code: getLogAnalyticsBicepCode(config)
    },
    {
      name: 'applicationInsights.bicep',
      path: 'modules/applicationInsights.bicep',
      category: 'module',
      description: 'Monitoring APM capturing response times and service graphs.',
      code: getAppInsightsBicepCode(config)
    },
    {
      name: 'deploy.ps1',
      path: 'scripts/deploy.ps1',
      category: 'script',
      description: 'PowerShell helper script automating authentications and resource creations.',
      code: getDeployPowershell(config)
    }
  ];

  const files = getFiles();

  // Match the active resource group mapping selection to select corresponding file
  const mapResourceToFile = (id: string): string => {
    switch (id) {
      case 'rg': return 'main.bicep';
      case 'storage': return 'modules/storage.bicep';
      case 'asp': return 'modules/appServicePlan.bicep';
      case 'webapp': return 'modules/appService.bicep';
      case 'law': return 'modules/logAnalytics.bicep';
      case 'appi': return 'modules/applicationInsights.bicep';
      default: return 'main.bicep';
    }
  };

  const initialFile = selectedResourceId ? mapResourceToFile(selectedResourceId) : 'main.bicep';
  const [activeFilePath, setActiveFilePath] = useState<string>(initialFile);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [userEdits, setUserEdits] = useState<Record<string, string>>({});

  // Sync back to initial file if active selection changes
  React.useEffect(() => {
    if (selectedResourceId) {
      setActiveFilePath(mapResourceToFile(selectedResourceId));
    }
  }, [selectedResourceId]);

  const activeFile = files.find(f => f.path === activeFilePath) || files[0];
  const fileContent = userEdits[activeFile.path] !== undefined ? userEdits[activeFile.path] : activeFile.code;

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIExplain = () => {
    onAskAi(`Can you explain the file '${activeFile.path}'? Here is its current code:\n\`\`\`bicep\n${fileContent}\n\`\`\`\nProvide a scannable structural review, detailing parameters, outputs, and any Azure best practices used.`);
  };

  const handleAISecure = () => {
    onAskAi(`How can I improve the security configuration of the following resource code in ${activeFile.name}? Give me specific property alterations or network lock configurations, and explain why:\n\`\`\`bicep\n${fileContent}\n\`\`\``);
  };

  const handleStartEdit = () => {
    setEditingCode(fileContent);
  };

  const handleSaveEdit = () => {
    if (editingCode !== null) {
      setUserEdits({
        ...userEdits,
        [activeFile.path]: editingCode
      });
      setEditingCode(null);
    }
  };

  const handleResetEdits = () => {
    setUserEdits({});
    setEditingCode(null);
  };

  // Filter paths
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white border border-slate-205 rounded-2xl overflow-hidden min-h-[620px] shadow-sm">
      
      {/* File Sidebar */}
      <div className="lg:col-span-1 border-r border-slate-200 p-4 flex flex-col justify-between bg-slate-50">
        <div>
          <div className="flex items-center gap-2 px-1 mb-4">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/50">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-slate-800 font-bold text-xs uppercase tracking-wider">Repository Explorer</span>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 pl-8 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-4">
            {/* Main Files Group */}
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider font-bold block px-2 mb-2">Root Blueprints</span>
              <div className="space-y-1">
                {filteredFiles.filter(f => f.category === 'main' || f.category === 'doc').map(file => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => { setActiveFilePath(file.path); setEditingCode(null); }}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      activeFilePath === file.path 
                        ? 'bg-white text-blue-600 font-bold border-l-2 border-blue-600 pl-1.5 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-850'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${activeFilePath === file.path ? 'text-blue-600' : 'text-slate-400'}`} />
                      {file.name}
                    </span>
                    {userEdits[file.path] !== undefined && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Modified locally"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modules Group */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider font-bold">modules/</span>
              </div>
              <div className="space-y-1 pl-2">
                {filteredFiles.filter(f => f.category === 'module').map(file => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => { setActiveFilePath(file.path); setEditingCode(null); }}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      activeFilePath === file.path 
                        ? 'bg-white text-blue-600 font-bold border-l-2 border-blue-600 pl-1.5 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-850'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${activeFilePath === file.path ? 'text-blue-600' : 'text-slate-400'}`} />
                      {file.name}
                    </span>
                    {userEdits[file.path] !== undefined && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Modified locally"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scripts Group */}
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider font-bold">scripts/</span>
              </div>
              <div className="space-y-1 pl-2">
                {filteredFiles.filter(f => f.category === 'script').map(file => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => { setActiveFilePath(file.path); setEditingCode(null); }}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      activeFilePath === file.path 
                        ? 'bg-white text-blue-600 font-bold border-l-2 border-blue-600 pl-1.5 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-850'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${activeFilePath === file.path ? 'text-blue-600' : 'text-slate-400'}`} />
                      {file.name}
                    </span>
                    {userEdits[file.path] !== undefined && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Modified locally"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Restore defaults */}
        {Object.keys(userEdits).length > 0 && (
          <div className="pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={handleResetEdits}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[11px] border border-yellow-250 bg-yellow-50 text-yellow-700 hover:bg-yellow-105 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-yellow-600" />
              Reset custom template edits
            </button>
          </div>
        )}
      </div>

      {/* Code Editor Screen */}
      <div className="lg:col-span-3 flex flex-col justify-between min-h-[500px] bg-slate-955">
        {/* Editor Controls */}
        <div className="p-4 border-b border-slate-900 flex flex-wrap justify-between items-center bg-slate-900 gap-3">
          <div>
            <h3 className="text-white font-mono text-sm font-semibold flex items-center gap-2">
              <span className="text-slate-500">Path:</span> 
              <span className="text-blue-400">{activeFile.path}</span>
            </h3>
            <p className="text-xs text-slate-350 mt-0.5 max-w-xl truncate">
              {activeFile.description}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {editingCode === null ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Code
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-transparent bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Commit Edit
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Code Content Editor / Display */}
        <div className="relative flex-1 bg-slate-950 p-6 font-mono text-xs overflow-auto h-[400px]">
          {editingCode !== null ? (
            <textarea
              value={editingCode}
              onChange={(e) => setEditingCode(e.target.value)}
              className="w-full h-full bg-transparent text-cyan-455 font-mono resize-none focus:outline-none leading-relaxed border-0 p-0"
              spellCheck="false"
            />
          ) : (
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text">
              <code>
                {fileContent}
              </code>
            </pre>
          )}
        </div>

        {/* Bottom AI integration bar */}
        <div className="p-4 border-t border-slate-900 bg-slate-900 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-305">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>AI Actions:</span>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleAIExplain}
              className="flex items-center gap-1 rounded-lg py-1.5 px-3 border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold transition-all cursor-pointer"
            >
              Explain template with Architect
            </button>
            <button
              type="button"
              onClick={handleAISecure}
              className="flex items-center gap-1 rounded-lg py-1.5 px-3 border border-pink-500/20 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-bold transition-all cursor-pointer"
            >
              Audit & Secure Resource
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
