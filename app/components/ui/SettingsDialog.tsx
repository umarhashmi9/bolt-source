import React, { useState, useEffect } from 'react';
import { Dialog, DialogRoot, DialogTitle } from './Dialog';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import type { ProviderInfo } from '~/types/model';
import { IconButton } from './IconButton';
import { apiSettingsStore, saveApiSettings } from '~/lib/stores/settings';
import { useStore } from '@nanostores/react';
import { useChatHistory } from '~/lib/persistence';
import Cookies from 'js-cookie';

interface ApiSettings {
  [key: string]: {
    apiKey?: string;
    baseUrl?: string;
    getApiKeyLink?: string;
    labelForGetApiKey?: string;
  };
}

// Add debug settings interface
interface DebugSettings {
  enabled: boolean;
}

const initialApiSettings: ApiSettings = {
  Anthropic: {
    apiKey: '',
    getApiKeyLink: 'https://console.anthropic.com/account/keys',
    labelForGetApiKey: 'Get Anthropic API Key',
  },
  Cohere: {
    apiKey: '',
    getApiKeyLink: 'https://dashboard.cohere.ai/api-keys',
    labelForGetApiKey: 'Get Cohere API Key',
  },
  DeepSeek: {
    apiKey: '',
    getApiKeyLink: 'https://platform.deepseek.com/api',
    labelForGetApiKey: 'Get DeepSeek API Key',
  },
  GoogleGenerativeAI: {
    apiKey: '',
    getApiKeyLink: 'https://makersuite.google.com/app/apikey',
    labelForGetApiKey: 'Get Google AI API Key',
  },
  GROQ: {
    apiKey: '',
    getApiKeyLink: 'https://console.groq.com/keys',
    labelForGetApiKey: 'Get Groq API Key',
  },
  HuggingFace: {
    apiKey: '',
    getApiKeyLink: 'https://huggingface.co/settings/tokens',
    labelForGetApiKey: 'Get HuggingFace API Key',
  },
  LMStudio: {
    baseUrl: '',
    getApiKeyLink: 'https://lmstudio.ai/',
    labelForGetApiKey: 'Download LM Studio',
  },
  Mistral: {
    apiKey: '',
    getApiKeyLink: 'https://console.mistral.ai/api-keys/',
    labelForGetApiKey: 'Get Mistral API Key',
  },
  Ollama: {
    baseUrl: '',
    getApiKeyLink: 'https://ollama.ai/',
    labelForGetApiKey: 'Download Ollama',
  },
  OpenAI: {
    apiKey: '',
    getApiKeyLink: 'https://platform.openai.com/api-keys',
    labelForGetApiKey: 'Get OpenAI API Key',
  },
  OpenAILike: {
    apiKey: '',
    baseUrl: '',
    getApiKeyLink: 'https://github.com/BoltzmannEntropy/privateGPT#readme',
    labelForGetApiKey: 'Learn about OpenAI-compatible APIs',
  },
  OpenRouter: {
    apiKey: '',
    getApiKeyLink: 'https://openrouter.ai/keys',
    labelForGetApiKey: 'Get OpenRouter API Key',
  },
  TogetherAI: {
    apiKey: '',
    baseUrl: '',
    getApiKeyLink: 'https://api.together.xyz/settings/api-keys',
    labelForGetApiKey: 'Get Together AI API Key',
  },
  xAI: {
    apiKey: '',
    getApiKeyLink: 'https://x.ai/',
    labelForGetApiKey: 'Get xAI Access',
  },
};

const ENV_API_KEYS = {
  Anthropic: process.env.ANTHROPIC_API_KEY,
  OpenAI: process.env.OPENAI_API_KEY,
  GoogleGenerativeAI: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  Groq: process.env.GROQ_API_KEY,
  HuggingFace: process.env.HuggingFace_API_KEY,
  OpenRouter: process.env.OPEN_ROUTER_API_KEY,
  Deepseek: process.env.DEEPSEEK_API_KEY,
  Mistral: process.env.MISTRAL_API_KEY,
  OpenAILike: process.env.OPENAI_LIKE_API_KEY,
  Together: process.env.TOGETHER_API_KEY,
  xAI: process.env.XAI_API_KEY,
  Cohere: process.env.COHERE_API_KEY,
  AzureOpenAI: process.env.AZURE_OPENAI_API_KEY,
};

const ENV_BASE_URLS = {
  Together: process.env.TOGETHER_API_BASE_URL,
  OpenAILike: process.env.OPENAI_LIKE_API_BASE_URL,
  LMStudio: process.env.LMSTUDIO_API_BASE_URL,
  Ollama: process.env.OLLAMA_API_BASE_URL,
};

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  provider?: ProviderInfo;
  apiKey?: string;
  setApiKey?: (key: string) => void;
}

// Add type for active tab
type ActiveTab = 'api-settings' | 'features' | 'debug';

export function SettingsDialog({ isOpen, onClose, provider, apiKey = '', setApiKey }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('api-settings');
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);
  const [activeProviders, setActiveProviders] = useState<{ [key: string]: boolean }>({});

  const [debugSettings, setDebugSettings] = useState<DebugSettings>({ enabled: false });
  const [showChatHistory, setShowChatHistory] = useState(() => {
    const savedValue = Cookies.get('showChatHistory');
    return savedValue === undefined ? true : savedValue === 'true';
  });
  const storedSettings = useStore(apiSettingsStore);
  const { deleteAllChatHistory, deleteAllChatHistoryExceptToday, exportAllChats } = useChatHistory();

  // Add function to format debug info
  const getFormattedDebugInfo = () => {
    const systemInfo = {
      'Node.js Version': process.version,
      Environment: process.env.NODE_ENV || 'development',
      Runtime: process.env.DOCKER_CONTAINER ? 'Docker' : 'Local',
      Platform: window.navigator.platform,
    };

    const activeProvidersInfo = Object.entries(activeProviders)
      .filter(([_, isActive]) => isActive)
      .map(([provider]) => {
        const settings = apiSettings[provider];
        const showBaseUrl = ['OpenAILike', 'Ollama', 'LMStudio'].includes(provider);

        if (showBaseUrl && settings.baseUrl) {
          return {
            name: provider,
            baseUrl: settings.baseUrl,
          };
        }

        return {
          name: provider,
        };
      });

    const debugInfo = {
      'System Information': systemInfo,
      'Active API Providers': activeProvidersInfo,
    };

    return JSON.stringify(debugInfo, null, 2);
  };

  const handleCopyDebugInfo = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedDebugInfo());

      // You might want to add a toast notification here
      console.log('Debug info copied to clipboard');
    } catch (err) {
      console.error('Failed to copy debug info:', err);
    }
  };

  useEffect(() => {
    // Load settings from the store and environment
    const newSettings = { ...initialApiSettings };

    // Load environment variables first
    Object.entries(ENV_API_KEYS).forEach(([provider, key]) => {
      if (key && newSettings[provider]) {
        newSettings[provider] = {
          ...newSettings[provider],
          apiKey: key,
        };
      }
    });

    Object.entries(ENV_BASE_URLS).forEach(([provider, url]) => {
      if (url && newSettings[provider]) {
        newSettings[provider] = {
          ...newSettings[provider],
          baseUrl: url,
        };
      }
    });

    // Then merge with stored settings
    Object.entries(storedSettings.apiKeys).forEach(([provider, key]) => {
      if (newSettings[provider]) {
        newSettings[provider] = {
          ...newSettings[provider],
          apiKey: key,
        };
      }
    });

    Object.entries(storedSettings.baseUrls).forEach(([provider, url]) => {
      if (newSettings[provider]) {
        newSettings[provider] = {
          ...newSettings[provider],
          baseUrl: url,
        };
      }
    });

    setApiSettings(newSettings);

    // Set active providers for any provider with env vars or stored settings
    const newActiveProviders = { ...storedSettings.activeProviders };
    Object.entries(newSettings).forEach(([provider, settings]) => {
      if (settings.apiKey || settings.baseUrl) {
        newActiveProviders[provider] = true;
      }
    });
    setActiveProviders(newActiveProviders);

    // Load debug mode
    setDebugSettings((prev) => ({ ...prev, enabled: storedSettings.debugMode || false }));
  }, [storedSettings]);

  const handleApiSettingChange = (provider: string, field: 'apiKey' | 'baseUrl', value: string) => {
    setApiSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
    setActiveProviders((prev) => ({
      ...prev,
      [provider]: true,
    }));
  };

  const handleProviderToggle = (provider: string) => {
    setActiveProviders((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));

    if (activeProviders[provider]) {
      setApiSettings((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          apiKey: '',
        },
      }));
    }
  };

  const handleClearProvider = (provider: string) => {
    setApiSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: '',
      },
    }));
    setActiveProviders((prev) => ({
      ...prev,
      [provider]: false,
    }));
  };

  const handleSaveSettings = () => {
    // Create an object with just the API keys
    const apiKeysToSave = Object.entries(apiSettings).reduce(
      (acc, [provider, settings]) => {
        if (settings.apiKey) {
          acc[provider] = settings.apiKey;
        }

        return acc;
      },
      {} as Record<string, string>,
    );

    // Create an object with base URLs for providers that have them
    const baseUrlsToSave = Object.entries(apiSettings).reduce(
      (acc, [provider, settings]) => {
        if (settings.baseUrl) {
          acc[provider] = settings.baseUrl;
        }

        return acc;
      },
      {} as Record<string, string>,
    );

    // Save settings to the store
    saveApiSettings({
      apiKeys: apiKeysToSave,
      baseUrls: baseUrlsToSave,
      activeProviders,
      debugMode: debugSettings.enabled,
    });

    console.log('Saving settings:', { apiSettings, activeProviders, debugSettings });
    onClose();
  };

  // Add a list of providers that don't need API keys
  const NO_API_KEY_PROVIDERS = ['Ollama', 'LMStudio'];

  const isKeySetInEnv = (providerName: string) => {
    return !!ENV_API_KEYS[providerName as keyof typeof ENV_API_KEYS];
  };

  const isBaseUrlSetInEnv = (providerName: string) => {
    return !!ENV_BASE_URLS[providerName as keyof typeof ENV_BASE_URLS];
  };

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose} className="!max-w-[900px]">
        <DialogTitle>Settings</DialogTitle>
        <div className="flex-1 overflow-hidden flex h-[500px]">
          <div className="w-1/4 border-r border-bolt-elements-borderColor pr-4">
            <ul className="space-y-2 pt-4">
              <li>
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    activeTab === 'api-settings'
                      ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                      : 'hover:bg-bolt-elements-button-secondary-backgroundHover'
                  }`}
                  onClick={() => setActiveTab('api-settings')}
                >
                  API Settings
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    activeTab === 'features'
                      ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                      : 'hover:bg-bolt-elements-button-secondary-backgroundHover'
                  }`}
                  onClick={() => setActiveTab('features')}
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  className={`w-full text-left py-2 px-4 rounded ${
                    activeTab === 'chat-history'
                      ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                      : 'hover:bg-bolt-elements-button-secondary-backgroundHover'
                  }`}
                  onClick={() => setActiveTab('chat-history')}
                >
                  Chat History
                </button>
              </li>
              {debugSettings.enabled && (
                <li>
                  <button
                    className={`w-full text-left py-2 px-4 rounded ${
                      activeTab === 'debug'
                        ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                        : 'hover:bg-bolt-elements-button-secondary-backgroundHover'
                    }`}
                    onClick={() => setActiveTab('debug')}
                  >
                    Debug
                  </button>
                </li>
              )}
            </ul>
          </div>
          <div className="flex-1 pl-4 overflow-y-auto">
            {activeTab === 'api-settings' && (
              <div className="h-full overflow-y-auto pr-4">
                <h2 className="text-xl font-semibold mb-4">API Settings</h2>
                <p className="text-sm text-bolt-elements-textSecondary mb-4">Manage your API keys and URLs</p>
                {provider && setApiKey && <APIKeyManager provider={provider} apiKey={apiKey} setApiKey={setApiKey} />}
                {Object.entries(apiSettings)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([providerName, settings]) => (
                    <div key={providerName} className="mb-6 p-4 border rounded-lg border-bolt-elements-borderColor">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium">{providerName}</h3>
                          {settings.getApiKeyLink && (
                            <IconButton
                              icon="i-ph-link"
                              size="sm"
                              title={settings.labelForGetApiKey || `Get ${providerName} API Key`}
                              onClick={() => window.open(settings.getApiKeyLink, '_blank')}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProviderToggle(providerName)}
                            className={`px-3 py-1 rounded text-sm ${
                              activeProviders[providerName]
                                ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                                : 'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text'
                            }`}
                          >
                            {activeProviders[providerName] ? 'Active' : 'Inactive'}
                          </button>
                          {activeProviders[providerName] && (
                            <IconButton
                              icon="i-ph-x"
                              size="sm"
                              title="Clear settings"
                              onClick={() => handleClearProvider(providerName)}
                            />
                          )}
                        </div>
                      </div>
                      {activeProviders[providerName] && (
                        <div className="space-y-4">
                          {!NO_API_KEY_PROVIDERS.includes(providerName) && (
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                API Key
                                {isKeySetInEnv(providerName) && (
                                  <span className="ml-2 text-xs text-bolt-elements-textTertiary">
                                    (Set in environment)
                                  </span>
                                )}
                              </label>
                              <input
                                type="password"
                                value={settings.apiKey}
                                onChange={(e) => handleApiSettingChange(providerName, 'apiKey', e.target.value)}
                                className="w-full px-3 py-2 rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary"
                                placeholder={
                                  isKeySetInEnv(providerName) ? 'Using environment variable' : 'Enter API key'
                                }
                              />
                            </div>
                          )}
                          {settings.baseUrl !== undefined && (
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Base URL
                                {isBaseUrlSetInEnv(providerName) && (
                                  <span className="ml-2 text-xs text-bolt-elements-textTertiary">
                                    (Set in environment)
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                value={settings.baseUrl}
                                onChange={(e) => handleApiSettingChange(providerName, 'baseUrl', e.target.value)}
                                className="w-full px-3 py-2 rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary"
                                placeholder={
                                  isBaseUrlSetInEnv(providerName) ? 'Using environment variable' : 'Enter base URL'
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
            {activeTab === 'features' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Features</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg border-bolt-elements-borderColor">
                    <div>
                      <h3 className="text-lg font-medium">Debug Mode</h3>
                      <p className="text-sm text-bolt-elements-textSecondary">Enable detailed debugging information</p>
                    </div>
                    <button
                      onClick={() => {
                        const newEnabled = !debugSettings.enabled;
                        setDebugSettings((prev) => ({ ...prev, enabled: newEnabled }));

                        // If we're disabling debug mode while on the debug tab, switch to features tab
                        if (!newEnabled && activeTab === ('debug' as ActiveTab)) {
                          setActiveTab('features');
                        }
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        debugSettings.enabled
                          ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                          : 'bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text'
                      }`}
                    >
                      {debugSettings.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'chat-history' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Chat History</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Export All Chats</h3>
                      <p className="text-sm text-bolt-elements-textSecondary">
                        Download all your chats as a single JSON file
                      </p>
                    </div>
                    <button
                      onClick={exportAllChats}
                      className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md"
                    >
                      Export All
                    </button>
                  </div>
                  <div className="border-t border-bolt-elements-borderColor my-4"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Delete All Chat History</h3>
                      <p className="text-sm text-bolt-elements-textSecondary">
                        This will permanently delete all your chat history
                      </p>
                    </div>
                    <button
                      onClick={deleteAllChatHistory}
                      className="px-4 py-2 bg-bolt-elements-button-danger-background hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text rounded-md"
                    >
                      Delete All
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Delete Old Chat History</h3>
                      <p className="text-sm text-bolt-elements-textSecondary">
                        This will delete all chat history except today's chats
                      </p>
                    </div>
                    <button
                      onClick={deleteAllChatHistoryExceptToday}
                      className="px-4 py-2 bg-bolt-elements-button-danger-background hover:bg-bolt-elements-button-danger-backgroundHover text-bolt-elements-button-danger-text rounded-md"
                    >
                      Delete Old Chats
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'debug' && debugSettings.enabled && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg border-bolt-elements-borderColor">
                    <h3 className="text-lg font-medium mb-3">System Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-bolt-elements-textSecondary">Node.js Version:</span>
                        <span>{process.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bolt-elements-textSecondary">Environment:</span>
                        <span>{process.env.NODE_ENV || 'development'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bolt-elements-textSecondary">Runtime:</span>
                        <span>{process.env.DOCKER_CONTAINER ? 'Docker' : 'Local'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-bolt-elements-textSecondary">Platform:</span>
                        <span>{window.navigator.platform}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg border-bolt-elements-borderColor">
                    <h3 className="text-lg font-medium mb-3">Active API Providers</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(activeProviders)
                        .filter(([_, isActive]) => isActive)
                        .map(([provider]) => {
                          const settings = apiSettings[provider];
                          const showBaseUrl = ['OpenAILike', 'Ollama', 'LMStudio'].includes(provider);

                          return (
                            <div key={provider} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-bolt-elements-textSecondary">{provider}</span>
                                <span>✓ Active</span>
                              </div>
                              {showBaseUrl && settings.baseUrl && (
                                <div className="text-xs text-bolt-elements-textTertiary pl-4">
                                  Base URL: {settings.baseUrl}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleCopyDebugInfo}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text"
                    >
                      <span className="i-ph-copy text-lg" />
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-8 pt-4 px-4 pb-4 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/coleam00/bolt.new-any-llm"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text rounded-md"
            >
              <span className="i-ph-github-logo text-lg" />
              Visit our GitHub
            </a>
            <a
              href="https://github.com/coleam00/bolt.new-any-llm#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-bolt-elements-button-secondary-background hover:bg-bolt-elements-button-secondary-backgroundHover text-bolt-elements-button-secondary-text rounded-md"
            >
              <span className="i-ph-book-open text-lg" />
              Documentation
            </a>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md"
          >
            Save Changes
          </button>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
