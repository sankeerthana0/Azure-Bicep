import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini client initialized successfully.');
  } else {
    console.warn('GEMINI_API_KEY is not configured or left as default placeholder. AI Chat Assistant will fall back to smart offline mode.');
  }
} catch (err) {
  console.error('Error during Gemini SDK load:', err);
}

// AI Help Solutions Architect Endpoint
app.post('/api/chat', async (req, res) => {
  const { messages, templateContext } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages array' });
  }

  // Fallback if Gemini key is missing
  if (!ai) {
    // Generate a helpful local mock response with typical Azure architect rules
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let localReply = `I am running in Offline Mode because the Gemini API key is not configured. To enable full AI architecture consulting, please add a valid API key in AI Studio under **Settings > Secrets**.\n\nHowever, as a virtual Azure Cloud Architect, here is a general answer to your query: `;
    
    if (lastUserMessage.toLowerCase().includes('storage')) {
      localReply += `To secure your Storage Account, you should configure private endpoints (Microsoft.Network/privateEndpoints) and disable public network access by setting 'publicNetworkAccess' to 'Disabled' in Bicep. Also, configure Azure Virtual Network firewall rules.`;
    } else if (lastUserMessage.toLowerCase().includes('insights') || lastUserMessage.toLowerCase().includes('log')) {
      localReply += `In Azure Bicep, Log Analytics works perfectly with active Application Insights using the workspaceResourceID parameter. Ensure Application Insights is created after Log Analytics, using its outputs.`;
    } else if (lastUserMessage.toLowerCase().includes('linkedin')) {
      localReply += `Here is a drafted LinkedIn post you can use:\n\n🚀 Just deployed my fully automated Azure web infrastructure using modular Azure Bicep templates! \n\n🔒 Features Storage V2, Linux App Service Plans, App Service, and Application Performance Monitoring connected to a centralized Log Analytics Workspace. \n\n#Azure #Bicep #IaC #CloudArchitect #DevOps`;
    } else {
      localReply += `Azure Bicep makes infrastructure as code much easier than traditional ARM JSON templates. By utilizing parameters, nested modules, and output variable chains, you configure robust resources like storage accounts, databases, and App Services in a clean declarative format.`;
    }
    
    return res.json({ reply: localReply });
  }

  try {
    const formattedContents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Inject Bicep template context as helper background context
    const contextPrompt = `
You are an expert Azure Cloud Infrastructure Architect with 15+ years experience. 
You are assisting a developer inside an interactive portal configuring a Bicep template deployment.
The current deployment scope includes:
- Resource Group
- Storage Account (${templateContext?.storageSku || 'Standard_LRS'})
- App Service Plan (${templateContext?.aspSkuName || 'S1'})
- Web App (${templateContext?.dotnetVersion || 'v8.0'})
- Log Analytics Workspace (Retention ${templateContext?.logAnalyticsRetentionDays || 30} days)
- Application Insights

Respond directly and professionally in clean Markdown. Keep responses clear, compact, and highly scannable (avoid bulky text). Provide actionable Bicep properties or syntax if they ask for Bicep adjustments.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I was unable to formulate a response. Please verify your query.";
    res.json({ reply });
  } catch (error: any) {
    console.error('Gemini error during chat generation:', error);
    res.status(500).json({ error: 'AI generation error', message: error.message || String(error) });
  }
});

// Serve Vite dynamic components
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started. Listening on http://0.0.0.0:${PORT}`);
  });
}

start();
