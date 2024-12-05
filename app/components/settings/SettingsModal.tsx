import { useState } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogButton, DialogRoot } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';

interface ApiSettings {
  [key: string]: {
    apiKey: string;
    baseUrl?: string;
  };
}

const initialApiSettings: ApiSettings = {
  GROQ: { apiKey: process.env.GROQ_API_KEY || '' },
  HuggingFace: { apiKey: process.env.HuggingFace_API_KEY || '' },
  OpenAI: { apiKey: process.env.OPENAI_API_KEY || '' },
  Anthropic: { apiKey: process.env.ANTHROPIC_API_KEY || '' },
  OpenRouter: { apiKey: process.env.OPEN_ROUTER_API_KEY || '' },
  GoogleGenerativeAI: { apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' },
  Ollama: { baseUrl: process.env.OLLAMA_API_BASE_URL || '' },
  OpenAILike: { apiKey: process.env.OPENAI_LIKE_API_KEY || '', baseUrl: process.env.OPENAI_LIKE_API_BASE_URL || '' },
  TogetherAI: { apiKey: process.env.TOGETHER_API_KEY || '', baseUrl: process.env.TOGETHER_API_BASE_URL || '' },
  DeepSeek: { apiKey: process.env.DEEPSEEK_API_KEY || '' },
  Mistral: { apiKey: process.env.MISTRAL_API_KEY || '' },
  Cohere: { apiKey: process.env.COHERE_API_KEY || '' },
  LMStudio: { baseUrl: process.env.LMSTUDIO_API_BASE_URL || '' },
  xAI: { apiKey: process.env.XAI_API_KEY || '' },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("system-prompt");
  const [systemPrompt, setSystemPrompt] = useState("default");
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);

  const handleApiSettingChange = (provider: string, field: 'apiKey' | 'baseUrl', value: string) => {
    setApiSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save the settings to your backend or local storage
    console.log('Saving settings:', { systemPrompt, apiSettings });
    onClose();
  };

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose} onBackdrop={onClose} className="!max-w-[800px] !w-[800px]">
        <DialogTitle>Settings</DialogTitle>
        <div className="flex h-[500px]">
          <div className="w-48 border-r border-bolt-elements-borderColor">
            <button
              className={`w-full text-left px-4 py-2 ${activeTab === 'system-prompt' ? 'bg-bolt-elements-background-depth-4' : ''}`}
              onClick={() => setActiveTab('system-prompt')}
            >
              System Prompt
            </button>
            <button
              className={`w-full text-left px-4 py-2 ${activeTab === 'api-settings' ? 'bg-bolt-elements-background-depth-4' : ''}`}
              onClick={() => setActiveTab('api-settings')}
            >
              API Settings
            </button>
            <button
              className={`w-full text-left px-4 py-2 ${activeTab === 'features' ? 'bg-bolt-elements-background-depth-4' : ''}`}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
          </div>
          <div className="flex-1 p-4 overflow-hidden">
            {activeTab === 'system-prompt' && (
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4">System Prompt</h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-4">
                  <div 
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      systemPrompt === "default" 
                        ? 'bg-bolt-elements-background-depth-4 border-bolt-elements-button-primary-background' 
                        : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:border-bolt-elements-button-primary-background'
                    }`}
                    onClick={() => setSystemPrompt("default")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        value="default"
                        checked={systemPrompt === "default"}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="text-bolt-elements-button-primary-background"
                      />
                      <div>
                        <div className="font-medium">Default</div>
                        <div className="text-sm text-bolt-elements-textTertiary mt-1">
                          A balanced AI assistant optimized for general-purpose conversations and tasks. Best for most use cases.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      systemPrompt === "small-model" 
                        ? 'bg-bolt-elements-background-depth-4 border-bolt-elements-button-primary-background' 
                        : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:border-bolt-elements-button-primary-background'
                    }`}
                    onClick={() => setSystemPrompt("small-model")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        value="small-model"
                        checked={systemPrompt === "small-model"}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="text-bolt-elements-button-primary-background"
                      />
                      <div>
                        <div className="font-medium">Small Model</div>
                        <div className="text-sm text-bolt-elements-textTertiary mt-1">
                          Optimized for smaller language models, providing concise and efficient responses while maintaining quality.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      systemPrompt === "qa" 
                        ? 'bg-bolt-elements-background-depth-4 border-bolt-elements-button-primary-background' 
                        : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:border-bolt-elements-button-primary-background'
                    }`}
                    onClick={() => setSystemPrompt("qa")}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        value="qa"
                        checked={systemPrompt === "qa"}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="text-bolt-elements-button-primary-background"
                      />
                      <div>
                        <div className="font-medium">Q&A</div>
                        <div className="text-sm text-bolt-elements-textTertiary mt-1">
                          Specialized for question-answering scenarios, providing direct, factual responses with relevant context.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'api-settings' && (
              <div className="h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4">API Settings</h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-4">
                  {Object.entries(apiSettings).map(([provider, settings]) => (
                    <div key={provider} className="space-y-2 p-4 bg-bolt-elements-background-depth-4 rounded-lg">
                      <h4 className="font-medium">{provider}</h4>
                      {settings.apiKey !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm">API Key</label>
                          <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => handleApiSettingChange(provider, 'apiKey', e.target.value)}
                            className="w-full px-2 py-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                          />
                        </div>
                      )}
                      {settings.baseUrl !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm">Base URL</label>
                          <input
                            type="text"
                            value={settings.baseUrl}
                            onChange={(e) => handleApiSettingChange(provider, 'baseUrl', e.target.value)}
                            className="w-full px-2 py-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'features' && (
              <div>
                <h3 className="text-lg font-semibold">Features</h3>
                <p className="text-bolt-elements-textTertiary">Coming Soon</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-bolt-elements-borderColor">
          <DialogButton type="secondary" onClick={onClose}>
            Cancel
          </DialogButton>
          <DialogButton type="primary" onClick={handleSaveSettings}>
            Save Changes
          </DialogButton>
        </div>
      </Dialog>
    </DialogRoot>
  );
} 