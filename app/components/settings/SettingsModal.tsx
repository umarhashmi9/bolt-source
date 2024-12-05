import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogButton, DialogRoot } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import Cookies from 'js-cookie';

type SystemPromptType = 'default' | 'small-model' | 'qa';

interface ApiKeyValue {
  apiKey?: string;
  baseUrl?: string;
  name: string;
  getKeyUrl?: string;
}

interface ApiSettings {
  [key: string]: ApiKeyValue;
}

interface BaseUrlEditorState {
  provider: string;
  isEditing: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialApiSettings: ApiSettings = {
  Anthropic: { 
    apiKey: '', 
    getKeyUrl: 'https://console.anthropic.com/settings/keys',
    name: 'Anthropic'
  },
  OpenAI: { 
    apiKey: '', 
    getKeyUrl: 'https://platform.openai.com/api-keys',
    name: 'OpenAI'
  },
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
  OpenRouter: { 
    apiKey: '', 
    getKeyUrl: 'https://openrouter.ai/keys',
    name: 'OpenRouter'
  },
  Google: { 
    apiKey: '', 
    getKeyUrl: 'https://makersuite.google.com/app/apikey',
    name: 'Google'
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
  Together: { 
    apiKey: '', 
    baseUrl: '', 
    getKeyUrl: 'https://api.together.xyz/settings/api-keys',
    name: 'Together'
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
    getKeyUrl: 'https://docs.x.ai/docs/quickstart#creating-an-api-key',
    name: 'xAI'
  },
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Tab Management
  const [activeTab, setActiveTab] = useState<'system-prompt' | 'api-settings' | 'features'>('api-settings');
  const [showSystemPrompt, setShowSystemPrompt] = useState(() => {
    try {
      const saved = Cookies.get('showSystemPrompt');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // System Prompt Management
  const [systemPrompt, setSystemPrompt] = useState<SystemPromptType>(() => {
    try {
      return (Cookies.get('systemPrompt') as SystemPromptType) || 'default';
    } catch {
      return 'default';
    }
  });

  // API Settings Management
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);
  const [baseUrlEditor, setBaseUrlEditor] = useState<BaseUrlEditorState>({ provider: '', isEditing: false });
  const [tempBaseUrl, setTempBaseUrl] = useState('');

  // Load initial API settings
  useEffect(() => {
    try {
      const storedApiKeys = Cookies.get('apiKeys');
      if (storedApiKeys) {
        const parsedKeys = JSON.parse(storedApiKeys);
        if (typeof parsedKeys === 'object' && parsedKeys !== null) {
          // Merge stored keys with initial settings to preserve structure
          const mergedSettings = { ...initialApiSettings };
          Object.entries(parsedKeys).forEach(([provider, value]) => {
            if (mergedSettings[provider] && typeof value === 'object' && value !== null) {
              mergedSettings[provider] = {
                ...mergedSettings[provider],
                ...(value as ApiKeyValue)
              };
            }
          });
          setApiSettings(mergedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
      Cookies.remove('apiKeys');
    }
  }, []);

  // Save system prompt visibility preference
  useEffect(() => {
    Cookies.set('showSystemPrompt', JSON.stringify(showSystemPrompt), {
      expires: 30,
      secure: true,
      sameSite: 'strict'
    });
  }, [showSystemPrompt]);

  // Save system prompt type
  useEffect(() => {
    Cookies.set('systemPrompt', systemPrompt, {
      expires: 30,
      secure: true,
      sameSite: 'strict'
    });
  }, [systemPrompt]);

  const handleApiSettingChange = (provider: string, field: keyof ApiKeyValue, value: string) => {
    setApiSettings((prev) => {
      const newSettings = {
        ...prev,
        [provider]: {
          ...prev[provider],
          [field]: value,
        },
      };

      // Save API keys to cookies immediately
      const apiKeysToSave = Object.entries(newSettings).reduce<Record<string, ApiKeyValue>>((acc, [provider, settings]) => {
        if (settings.apiKey || settings.baseUrl) {
          acc[provider] = {
            ...(settings.apiKey && { apiKey: settings.apiKey }),
            ...(settings.baseUrl && { baseUrl: settings.baseUrl }),
            name: settings.name,
            ...(settings.getKeyUrl && { getKeyUrl: settings.getKeyUrl })
          };
        }
        return acc;
      }, {});

      Cookies.set('apiKeys', JSON.stringify(apiKeysToSave), {
        expires: 30,
        secure: true,
        sameSite: 'strict',
      });

      return newSettings;
    });
  };

  const handleBaseUrlEdit = (provider: string, currentUrl: string) => {
    setBaseUrlEditor({ provider, isEditing: true });
    setTempBaseUrl(currentUrl);
  };

  const handleBaseUrlSave = (provider: string) => {
    handleApiSettingChange(provider, 'baseUrl', tempBaseUrl);
    setBaseUrlEditor({ provider: '', isEditing: false });
    setTempBaseUrl('');
  };

  const renderTabs = () => (
    <div className="w-48 border-r border-bolt-elements-borderColor">
      {showSystemPrompt && (
        <button
          className={`w-full text-left px-4 py-2 ${activeTab === 'system-prompt' ? 'bg-bolt-elements-background-depth-6' : 'bg-bolt-elements-background-depth-3'}`}
          onClick={() => setActiveTab('system-prompt')}
        >
          System Prompt
        </button>
      )}
      <button
        className={`w-full text-left px-4 py-2 ${activeTab === 'api-settings' ? 'bg-bolt-elements-background-depth-6' : 'bg-bolt-elements-background-depth-3'}`}
        onClick={() => setActiveTab('api-settings')}
      >
        API Settings
      </button>
      <button
        className={`w-full text-left px-4 py-2 ${activeTab === 'features' ? 'bg-bolt-elements-background-depth-6' : 'bg-bolt-elements-background-depth-3'}`}
        onClick={() => setActiveTab('features')}
      >
        Features
      </button>
    </div>
  );

  const renderSystemPromptTab = () => (
    activeTab === 'system-prompt' && showSystemPrompt && (
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
                onChange={(e) => setSystemPrompt(e.target.value as SystemPromptType)}
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

          {[
            {
              id: 'small-model',
              title: 'Small Model',
              description: 'Optimized for smaller language models, providing concise and efficient responses while maintaining quality.'
            },
            {
              id: 'qa',
              title: 'Q&A',
              description: 'Specialized for question-answering scenarios, chatting, or creative writing.'
            }
          ].map(option => (
            <div 
              key={option.id}
              className="p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  disabled
                  className="text-bolt-elements-button-primary-background"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{option.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-bolt-elements-background-depth-4 rounded">Coming Soon</span>
                  </div>
                  <div className="text-sm text-bolt-elements-textTertiary mt-1">
                    {option.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  const renderApiSettingsTab = () => (
    activeTab === 'api-settings' && (
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">API Settings</h3>
        <div className="flex-1 space-y-4 overflow-y-auto pr-4">
          {Object.entries(apiSettings)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([provider, settings]) => {
              const isIncomplete = (settings.apiKey === undefined || settings.apiKey === '') && 
                                (settings.baseUrl === undefined || settings.baseUrl === '');
              const isActive = !isIncomplete;
              return (
                <div 
                  key={provider} 
                  className={`space-y-2 p-4 bg-bolt-elements-background-depth-4 rounded-lg ${
                    isIncomplete ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium flex items-center gap-2">
                      {settings.name}
                      {isIncomplete && (
                        <span className="text-xs px-2 py-0.5 bg-bolt-elements-background-depth-6 rounded text-bolt-elements-textTertiary">
                          Incomplete Setup
                        </span>
                      )}
                    </h4>
                    {isActive && (
                      <button
                        onClick={() => {
                          handleApiSettingChange(provider, 'apiKey', '');
                          handleApiSettingChange(provider, 'baseUrl', '');
                        }}
                        className="text-xs px-2 py-1 text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-6 rounded"
                      >
                        Clear Settings
                      </button>
                    )}
                  </div>
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
              );
            })}
        </div>
      </div>
    )
  );

  const renderFeaturesTab = () => (
    activeTab === 'features' && (
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-semibold mb-4">Features</h3>
        <div className="flex-1 space-y-4 overflow-y-auto pr-4">
          <div className="p-4 bg-bolt-elements-background-depth-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">System Prompt</div>
                <div className="text-sm text-bolt-elements-textTertiary mt-1">
                  Enable or disable the System Prompt tab for customizing AI behavior.
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowSystemPrompt(!showSystemPrompt);
                    if (activeTab === 'system-prompt') {
                      setActiveTab('api-settings');
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSystemPrompt ? 'bg-bolt-elements-button-primary-background' : 'bg-bolt-elements-background-depth-6'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSystemPrompt ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose} onBackdrop={onClose} className="!max-w-[800px] !w-[800px]">
        <DialogTitle>Settings</DialogTitle>
        <div className="flex h-[500px]">
          {renderTabs()}
          <div className="flex-1 p-4 overflow-hidden">
            {renderSystemPromptTab()}
            {renderApiSettingsTab()}
            {renderFeaturesTab()}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-bolt-elements-borderColor">
          <DialogButton type="secondary" onClick={onClose}>
            Close
          </DialogButton>
        </div>
      </Dialog>
    </DialogRoot>
  );
} 