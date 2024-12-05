import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogButton, DialogRoot } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import Cookies from 'js-cookie';

interface Settings {
  apiKey?: string;
  baseUrl?: string;
  getKeyUrl?: string;
  name: string;
}

interface ApiSettings {
  [key: string]: Settings;
}

interface ApiKeyValue {
  apiKey?: string;
  baseUrl?: string;
}

interface BaseUrlEditorState {
  provider: string;
  isEditing: boolean;
}

const initialApiSettings: ApiSettings = {
  GROQ: { 
    apiKey: '', 
    getKeyUrl: 'https://console.groq.com/keys',
    name: 'GROQ'
  },
  HuggingFace: { 
    apiKey: '', 
    getKeyUrl: 'https://huggingface.co/settings/tokens',
    name: 'HuggingFace'
  },
  OpenAI: { 
    apiKey: '', 
    getKeyUrl: 'https://platform.openai.com/api-keys',
    name: 'OpenAI'
  },
  Anthropic: { 
    apiKey: '', 
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    name: 'Anthropic'
  },
  OpenRouter: { 
    apiKey: '', 
    getKeyUrl: 'https://openrouter.ai/keys',
    name: 'OpenRouter'
  },
  GoogleGenerativeAI: { 
    apiKey: '', 
    getKeyUrl: 'https://makersuite.google.com/app/apikey',
    name: 'Google AI'
  },
  Ollama: { 
    baseUrl: 'http://localhost:11434',
    name: 'Ollama'
  },
  OpenAILike: { 
    apiKey: '', 
    baseUrl: '',
    name: 'OpenAI-Like'
  },
  TogetherAI: { 
    apiKey: '', 
    baseUrl: '', 
    getKeyUrl: 'https://api.together.xyz/settings/api-keys',
    name: 'Together AI'
  },
  Deepseek: { 
    apiKey: '', 
    getKeyUrl: 'https://platform.deepseek.com/settings',
    name: 'Deepseek'
  },
  Mistral: { 
    apiKey: '', 
    getKeyUrl: 'https://console.mistral.ai/api-keys/',
    name: 'Mistral'
  },
  Cohere: { 
    apiKey: '', 
    getKeyUrl: 'https://dashboard.cohere.com/api-keys',
    name: 'Cohere'
  },
  LMStudio: { 
    baseUrl: 'http://localhost:1234',
    name: 'LM Studio'
  },
  xAI: { 
    apiKey: '', 
    getKeyUrl: 'https://api.xai.com/settings',
    name: 'xAI'
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
  const [baseUrlEditor, setBaseUrlEditor] = useState<BaseUrlEditorState>({ provider: '', isEditing: false });
  const [tempBaseUrl, setTempBaseUrl] = useState('');

  useEffect(() => {
    // Load saved API keys from cookies
    const savedApiKeys = Cookies.get('apiKeys');
    if (savedApiKeys) {
      try {
        const parsedKeys = JSON.parse(savedApiKeys) as Record<string, ApiKeyValue>;
        setApiSettings((prev: ApiSettings) => {
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
    setApiSettings((prev: ApiSettings) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleBaseUrlEdit = (provider: string, currentUrl: string) => {
    setBaseUrlEditor({ provider, isEditing: true });
    setTempBaseUrl(currentUrl);
  };

  const handleBaseUrlSave = (provider: string) => {
    handleApiSettingChange(provider, 'baseUrl', tempBaseUrl);
    setBaseUrlEditor({ provider: '', isEditing: false });
  };

  const handleSaveSettings = () => {
    // Save system prompt to cookie
    Cookies.set('systemPrompt', systemPrompt, { 
      expires: 30,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    // Save API keys to cookies
    const apiKeysToSave = Object.entries(apiSettings).reduce<Record<string, ApiKeyValue>>((acc, [provider, settings]) => {
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
    }, {});
    
    Cookies.set('apiKeys', JSON.stringify(apiKeysToSave), { 
      expires: 30,
      secure: true,
      sameSite: 'strict',
      path: '/'
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
                      <h4 className="font-medium">{settings.name}</h4>
                      {settings.apiKey !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm text-bolt-elements-textSecondary">API Key</label>
                          <APIKeyManager
                            provider={{
                              name: settings.name,
                              getApiKeyLink: settings.getKeyUrl,
                              labelForGetApiKey: "Get API Key",
                              icon: "i-ph:key"
                            }}
                            apiKey={settings.apiKey}
                            setApiKey={(key) => handleApiSettingChange(provider, 'apiKey', key)}
                          />
                        </div>
                      )}
                      {settings.baseUrl !== undefined && (
                        <div className="space-y-1">
                          <label className="text-sm text-bolt-elements-textSecondary">Base URL</label>
                          {baseUrlEditor.isEditing && baseUrlEditor.provider === provider ? (
                            <div className="flex items-center gap-3 w-full">
                              <input
                                type="text"
                                value={tempBaseUrl}
                                placeholder={`Enter the ${settings.name} base URL`}
                                onChange={(e) => setTempBaseUrl(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs lg:text-sm rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
                              />
                              <IconButton onClick={() => handleBaseUrlSave(provider)} title="Save Base URL">
                                <div className="i-ph:check" />
                              </IconButton>
                              <IconButton onClick={() => setBaseUrlEditor({ provider: '', isEditing: false })} title="Cancel">
                                <div className="i-ph:x" />
                              </IconButton>
                            </div>
                          ) : (
                            <div className="flex items-center w-full">
                              <span className="flex-1 text-xs text-bolt-elements-textPrimary mr-2">
                                {settings.baseUrl ? settings.baseUrl : 'Not set (will still work if set in .env file)'}
                              </span>
                              <IconButton onClick={() => handleBaseUrlEdit(provider, settings.baseUrl || '')} title="Edit Base URL">
                                <div className="i-ph:pencil-simple" />
                              </IconButton>
                              <IconButton className="ml-2" onClick={() => window.open('https://coleam00.github.io/bolt.new-any-llm/')} title="Learn More">
                                <span className="mr-2 text-xs lg:text-sm">Learn More</span>
                                <div className="i-ph:book" />
                              </IconButton>
                            </div>
                          )}
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