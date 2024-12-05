import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogButton, DialogRoot } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import Cookies from 'js-cookie';

interface Settings {
  apiKey: string;
  baseUrl?: string;
  getKeyUrl?: string;
}

interface ApiSettings {
  [key: string]: Settings;
}

const initialApiSettings: ApiSettings = {
  GROQ: { 
    apiKey: '', 
    getKeyUrl: 'https://console.groq.com/keys' 
  },
  HuggingFace: { 
    apiKey: '', 
    getKeyUrl: 'https://huggingface.co/settings/tokens' 
  },
  OpenAI: { 
    apiKey: '', 
    getKeyUrl: 'https://platform.openai.com/api-keys' 
  },
  Anthropic: { 
    apiKey: '', 
    getKeyUrl: 'https://console.anthropic.com/settings/keys' 
  },
  OpenRouter: { 
    apiKey: '', 
    getKeyUrl: 'https://openrouter.ai/keys' 
  },
  GoogleGenerativeAI: { 
    apiKey: '', 
    getKeyUrl: 'https://makersuite.google.com/app/apikey' 
  },
  Ollama: { 
    baseUrl: '' 
  },
  OpenAILike: { 
    apiKey: '', 
    baseUrl: '' 
  },
  TogetherAI: { 
    apiKey: '', 
    baseUrl: '', 
    getKeyUrl: 'https://api.together.xyz/settings/api-keys'
  },
  Deepseek: { 
    apiKey: '', 
    getKeyUrl: 'https://platform.deepseek.com/settings'
  },
  Mistral: { 
    apiKey: '', 
    getKeyUrl: 'https://console.mistral.ai/api-keys/'
  },
  Cohere: { 
    apiKey: '', 
    getKeyUrl: 'https://dashboard.cohere.com/api-keys'
  },
  LMStudio: { 
    baseUrl: '' 
  },
  xAI: { 
    apiKey: '', 
    getKeyUrl: 'https://api.xai.com/settings'
  },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("system-prompt");
  const [systemPrompt, setSystemPrompt] = useState(() => {
    const savedPrompt = Cookies.get('systemPrompt');
    return savedPrompt || "default";
  });
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);

  useEffect(() => {
    // Load saved API keys from cookies
    const savedApiKeys = Cookies.get('apiKeys');
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys);
        setApiSettings(prev => {
          const newSettings = { ...prev };
          Object.entries(parsedKeys).forEach(([provider, value]) => {
            if (newSettings[provider]) {
              // Handle string format (just API key)
              if (typeof value === 'string') {
                newSettings[provider] = { 
                  ...newSettings[provider], 
                  apiKey: value 
                };
              } 
              // Handle object format (apiKey and/or baseUrl)
              else if (typeof value === 'object' && value !== null) {
                newSettings[provider] = { 
                  ...newSettings[provider],
                  ...(value.apiKey && { apiKey: value.apiKey }),
                  ...(value.baseUrl && { baseUrl: value.baseUrl })
                };
              }
            }
          });
          return newSettings;
        });
      } catch (e) {
        console.error('Error parsing saved API keys:', e);
      }
    }

    // Load saved system prompt
    const savedPrompt = Cookies.get('systemPrompt');
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    }
  }, []);

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
    // Save system prompt to cookie
    Cookies.set('systemPrompt', systemPrompt, { 
      expires: 30, // 30 days
      secure: true, // Only send over HTTPS
      sameSite: 'strict', // Protect against CSRF
      path: '/' // Accessible across the site
    });

    // Save API keys to cookies
    const apiKeysToSave = Object.entries(apiSettings).reduce((acc, [provider, settings]) => {
      if (settings.apiKey || settings.baseUrl) {
        // If both apiKey and baseUrl exist, save both
        if (settings.apiKey && settings.baseUrl) {
          acc[provider] = {
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl
          };
        }
        // If only apiKey exists, save just the string
        else if (settings.apiKey) {
          acc[provider] = settings.apiKey;
        }
        // If only baseUrl exists, save as object
        else if (settings.baseUrl) {
          acc[provider] = {
            baseUrl: settings.baseUrl
          };
        }
      }
      return acc;
    }, {} as Record<string, any>);
    
    Cookies.set('apiKeys', JSON.stringify(apiKeysToSave), { 
      expires: 30, // 30 days
      secure: true, // Only send over HTTPS
      sameSite: 'strict', // Protect against CSRF
      path: '/' // Accessible across the site
    });
    
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
                          The default system prompt - Best for Claude 3.5 Sonnet.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 opacity-50 cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        disabled
                        className="text-bolt-elements-button-primary-background"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Small Model</span>
                          <span className="text-xs px-2 py-0.5 bg-bolt-elements-background-depth-4 rounded">Coming Soon</span>
                        </div>
                        <div className="text-sm text-bolt-elements-textTertiary mt-1">
                          Optimized for smaller language models, providing concise and efficient responses while maintaining quality.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 opacity-50 cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        disabled
                        className="text-bolt-elements-button-primary-background"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Q&A</span>
                          <span className="text-xs px-2 py-0.5 bg-bolt-elements-background-depth-4 rounded">Coming Soon</span>
                        </div>
                        <div className="text-sm text-bolt-elements-textTertiary mt-1">
                          Specialized for question-answering scenarios, chatting, or creative writing.
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
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{provider}</h4>
                        {settings.getKeyUrl && (
                          <a
                            href={settings.getKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-black/80 dark:text-white/80 font-medium hover:text-black dark:hover:text-white transition-colors"
                          >
                            Get API Key
                          </a>
                        )}
                      </div>
                      {settings.apiKey !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm text-bolt-elements-textSecondary">API Key</label>
                          <input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => handleApiSettingChange(provider, 'apiKey', e.target.value)}
                            className="w-full px-2 py-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                            placeholder={`Enter your ${provider} API key`}
                          />
                        </div>
                      )}
                      {settings.baseUrl !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm text-bolt-elements-textSecondary">Base URL</label>
                          <input
                            type="text"
                            value={settings.baseUrl}
                            onChange={(e) => handleApiSettingChange(provider, 'baseUrl', e.target.value)}
                            className="w-full px-2 py-1 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                            placeholder={`Enter the ${provider} base URL`}
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
                <p className="text-bolt-elements-textTertiary">This is where new features will be shown and can be turned on/off for testing.</p>
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