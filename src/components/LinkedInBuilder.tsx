import React, { useState } from 'react';
import { Share2, FileCode, Check, Copy, Linkedin, Sparkles, BookOpen, Star, Sparkle } from 'lucide-react';
import { DeploymentConfig } from '../types';

interface LinkedInBuilderProps {
  config: DeploymentConfig;
  onAskAi: (prompt: string) => void;
}

export default function LinkedInBuilder({ config, onAskAi }: LinkedInBuilderProps) {
  const [copiedType, setCopiedType] = useState<'linkedin' | 'github' | 'readme' | null>(null);
  const [tone, setTone] = useState<'technical' | 'career' | 'minimal'>('career');

  const getLinkedInPost = () => {
    const spacePrefix = '🚀 Just completed an automated Infrastructure-as-Code (IaC) deployment on Microsoft Azure using modular Azure Bicep templates!';
    
    const technicalBullets = `
🔹 Modular Architecture: Managed storage, hosting, and APM logging as independent modules mapped cleanly into main.bicep.
🔹 Centralized Log Sink: Integrated a Log Analytics Workspace connected dynamically to Application Insights for total application monitoring stability.
🔹 Serverless Compute Scale: Configured Linux App Service hosting containers running ${config.dotnetVersion} and aligned to static Azure Storage bindings.
🔹 Pre-flight Dry Runs: Integrated Azure CLI sub what-if dry-run queries ensuring seamless syntax compilation before remote executions.`;

    const careerBullets = `
📈 This project showcases deep cloud infrastructure design concepts expected of Modern Cloud Engineers:
✓ Modular architectures & nested parameters/outputs
✓ Azure Portal telemetry syncs
✓ Subscription scopes & resource group abstractions
✓ Infrastructure-as-Code (IaC) pipelines using Azure cli / PowerShell

Perfect for demonstrating cloud architecture principles under professional DevOps standards. Check out the clean template structure in the viewer!`;

    const minimalPost = `Just automated real-time web hosting architectures in Azure with Microsoft Bicep IaC. Centered on Linux app services, Application Insights telemetry, and centralized Log Workspace indexes. 
Declaring code rather than clicking buttons is clean engineering.`;

    const suffix = `\n\n#Azure #Bicep #IaC #DevOps #CloudEngineering #MicrosoftAzure #SysOps`;

    switch (tone) {
      case 'technical':
        return `${spacePrefix}\n${technicalBullets}${suffix}`;
      case 'minimal':
        return `${spacePrefix}\n\n${minimalPost}${suffix}`;
      case 'career':
      default:
        return `${spacePrefix}\n${careerBullets}${suffix}`;
    }
  };

  const githubWorkflowYaml = `name: Provision Azure Infrastructure

on:
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read

env:
  AZURE_RG: rg-${config.projectName}-${config.environmentType}
  LOCATION: ${config.location}

jobs:
  validate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v3

      - name: Azure Login (OpenID Connect)
        uses: azure/login@v1
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Bicep What-If Dry Run Validation
        uses: azure/arm-deploy@v1
        with:
          subscriptionId: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
          scope: subscription
          region: \${{ env.LOCATION }}
          template: ./main.bicep
          parameters: ./main.parameters.json
          additionalParameters: "{ \\"projectName\\": \\"\${{ env.AZURE_RG }}\\" }"
          failOnStdErr: false
          whatIf: true

      - name: Full ARM Orchestration Deployment
        uses: azure/arm-deploy@v1
        with:
          subscriptionId: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
          scope: subscription
          region: \${{ env.LOCATION }}
          template: ./main.bicep
          parameters: ./main.parameters.json
`;

  const copyToClipboard = (text: string, type: 'linkedin' | 'github' | 'readme') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleAiDraftPost = () => {
    onAskAi(`Draft a custom social media promotional post celebrating my new Bicep template repository. Feature a list of Azure services (App Service, Storage, Application Insights, Log Analytics Workspace) and write it in a punchy, professional, and technical tone with badges.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* LinkedIn Post drafter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium text-sm">LinkedIn Share Draft Generator</h3>
            </div>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-blue-400 font-mono border border-blue-500/10">
              Tone: {tone.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Recruiters love documentation and portfolio sharing! Click below to modify tones, then copy this text directly to your LinkedIn stream to show off your Bicep skills.
          </p>

          {/* Tone Selector */}
          <div className="flex gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => setTone('career')}
              className={`py-1 px-2.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                tone === 'career' ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10' : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              💼 Career Focused
            </button>
            <button
              type="button"
              onClick={() => setTone('technical')}
              className={`py-1 px-2.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                tone === 'technical' ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10' : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              ⚙ Technical Build
            </button>
            <button
              type="button"
              onClick={() => setTone('minimal')}
              className={`py-1 px-2.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                tone === 'minimal' ? 'border-indigo-500 text-indigo-400 bg-indigo-950/10' : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              🗒 Minimalist
            </button>
          </div>

          {/* Post code box */}
          <textarea
            readOnly
            value={getLinkedInPost()}
            className="w-full h-[220px] bg-slate-950 border border-slate-800 text-slate-300 p-4 rounded-xl text-xs font-sans focus:outline-none resize-none leading-relaxed select-text"
          />
        </div>

        {/* Action button */}
        <div className="mt-5 border-t border-slate-850 pt-4 flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => copyToClipboard(getLinkedInPost(), 'linkedin')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all"
          >
            {copiedType === 'linkedin' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copiedType === 'linkedin' ? 'Copied Post Text' : 'Copy Post to Clipboard'}
          </button>
          
          <button
            type="button"
            onClick={handleAiDraftPost}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-indigo-500/35 bg-indigo-505/10 text-indigo-400 hover:bg-indigo-505/15 cursor-pointer transition-all"
          >
            <Sparkle className="w-4 h-4 animate-spin" />
            AI Draft Post
          </button>
        </div>
      </div>

      {/* GitHub Workflow workflow view */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              <h3 className="text-white font-medium text-sm">GitHub Actions Infrastructure pipeline</h3>
            </div>
            <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-indigo-400 font-mono border border-indigo-500/10 uppercase">
              workflows/deploy.yml
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Take your repository to the next level by automating deployment triggers using OpenID Connect (OIDC) connection channels straight to Azure Subscription targets! Keep this snippet in <code>.github/workflows/deploy.yml</code>.
          </p>

          <pre className="text-[10px] font-mono bg-slate-950 border border-slate-850 p-4 rounded-xl h-[260px] overflow-auto text-cyan-300 leading-normal select-text">
            <code>
              {githubWorkflowYaml}
            </code>
          </pre>
        </div>

        <button
          type="button"
          onClick={() => copyToClipboard(githubWorkflowYaml, 'github')}
          className="w-full mt-5 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-650 text-white font-semibold cursor-pointer transition-all"
        >
          {copiedType === 'github' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          {copiedType === 'github' ? 'Copied Actions Script' : 'Copy Workflow Script'}
        </button>
      </div>

    </div>
  );
}
