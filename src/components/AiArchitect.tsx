import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ShieldAlert, ArrowRight, CornerDownLeft, Bot, User } from 'lucide-react';
import { DeploymentConfig } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiArchitectProps {
  config: DeploymentConfig;
  chatHistory: Message[];
  onSetChatHistory: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function AiArchitect({
  config,
  chatHistory,
  onSetChatHistory,
}: AiArchitectProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const suggestionPrompts = [
    {
      title: 'VNet & Storage Sync',
      prompt: 'How can I lock down the storage account to a Virtual Network subnet in Bicep? Give me the required resources and code.',
    },
    {
      title: 'LAW vs Application Insights',
      prompt: 'Explain the technical relationship and telemetry piping between Log Analytics, Workspace, and Application Insights under Bicep syntax.',
    },
    {
      title: 'Staging Slots Setup',
      prompt: 'How do I introduce staging deployment slots (e.g. Blue/Green deployments) to the App Service module using Bicep?',
    },
    {
      title: 'Private Endpoint Setup',
      prompt: 'What are the best practices for introducing Private Endpoints to the Web App to block public internet access?',
    }
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    // Append user message
    const updatedHistory = [...chatHistory, userMsg];
    onSetChatHistory(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          templateContext: {
            projectName: config.projectName,
            location: config.location,
            storageSku: config.storageSku,
            aspSkuName: config.aspSkuName,
            aspSkuTier: config.aspSkuTier,
            dotnetVersion: config.dotnetVersion,
            logAnalyticsRetentionDays: config.logAnalyticsRetentionDays,
            environmentType: config.environmentType,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('API server route error');
      }

      const data = await response.json();
      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      onSetChatHistory(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      onSetChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ **Communication Link Offline**: I could not reach the server-side Gemini assistant. Please make sure the server is healthy or check your environment API keys in **Settings > Secrets**.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px]">
      
      {/* Suggestions Sidebar */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-white font-semibold text-xs uppercase tracking-wider">Solutions Advisor</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Ask our Azure architect AI assistant questions about Bicep configurations, resource security, virtual networks, or infrastructure best practices.
          </p>

          <div className="space-y-2.5">
            {suggestionPrompts.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestClick(sug.prompt)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 hover:border-slate-700 text-xs text-slate-300 transition-colors flex items-start gap-2 group cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                <div>
                  <span className="font-semibold text-[11px] text-white block mb-0.5">{sug.title}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-2 leading-normal">{sug.prompt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Note info */}
        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg text-[10px] text-slate-500 mt-4 leading-normal">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
          The AI references active slider values dynamically under Azure design guidelines.
        </div>
      </div>

      {/* Chat window viewport */}
      <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden relative h-full">
        
        {/* Chat window header */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <span className="text-white text-xs font-bold font-mono">Azure Solutions Architect Agent</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 leading-none">Consultant AI Bot</span>
            </div>
          </div>
          <span className="text-[9px] px-2 py-0.5 bg-slate-950 text-indigo-400 rounded-md border border-slate-800 uppercase font-bold">
            Gemini Architect
          </span>
        </div>

        {/* Chat message thread container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 select-text">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role !== 'user' && (
                <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-indigo-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-900 border border-slate-800 text-slate-350 rounded-tl-none prose prose-invert max-w-full'
              }`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-emerald-400 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-indigo-400 shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none p-3.5 text-xs animate-pulse flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-300"></span>
                <span>Architect is contemplating Bicep modules...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input Text Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="p-3 bg-slate-900 border-t border-slate-850 flex items-center gap-2.5"
        >
          <input
            id="input-ai-architect-chat"
            type="text"
            placeholder="Ask anything about our Azure Bicep topology..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-250 text-xs px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            id="btn-submit-architect-chat"
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}
