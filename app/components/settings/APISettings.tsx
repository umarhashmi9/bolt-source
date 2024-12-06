import React, { useEffect, useState } from 'react';
import type { SettingsTabProps } from './SettingsDialog';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import { IconButton } from '~/components/ui/IconButton';
import { apiSettingsStore, saveApiSettings } from '~/lib/stores/settings';
import { useStore } from '@nanostores/react';

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

interface ApiSettings {
  [key: string]: {
    apiKey?: string;
    baseUrl?: string;
    getApiKeyLink?: string;
    labelForGetApiKey?: string;
  };
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

export default function ApiSettings({ provider, apiKey = '', setApiKey, onClose }: SettingsTabProps) {
  const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);
  const [activeProviders, setActiveProviders] = useState<{ [key: string]: boolean }>({});
  const storedSettings = useStore(apiSettingsStore);

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

  // Add a list of providers that don't need API keys
  const NO_API_KEY_PROVIDERS = ['Ollama', 'LMStudio'];

  const isKeySetInEnv = (providerName: string) => {
    return !!ENV_API_KEYS[providerName as keyof typeof ENV_API_KEYS];
  };

  const isBaseUrlSetInEnv = (providerName: string) => {
    return !!ENV_BASE_URLS[providerName as keyof typeof ENV_BASE_URLS];
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
    });

    console.log('Saving settings:', { apiSettings, activeProviders });
    onClose();
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
  }, [storedSettings]);

  return (
    <>
      {provider && setApiKey && <APIKeyManager provider={provider} apiKey={apiKey} setApiKey={setApiKey} />}
      {Object.entries(apiSettings)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([providerName, settings]) => (
          <div key={providerName} className="mb-6 p-4 border rounded-lg border-bolt-elements-borderColor">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-bolt-elements-textPrimary">{providerName}</h3>
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
                    <label className="block text-sm font-medium mb-1 text-bolt-elements-textSecondary">
                      API Key
                      {isKeySetInEnv(providerName) && (
                        <span className="ml-2 text-xs text-bolt-elements-textTertiary">(Set in environment)</span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => handleApiSettingChange(providerName, 'apiKey', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary"
                      placeholder={isKeySetInEnv(providerName) ? 'Using environment variable' : 'Enter API key'}
                    />
                  </div>
                )}
                {settings.baseUrl !== undefined && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Base URL
                      {isBaseUrlSetInEnv(providerName) && (
                        <span className="ml-2 text-xs text-bolt-elements-textTertiary">(Set in environment)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={settings.baseUrl}
                      onChange={(e) => handleApiSettingChange(providerName, 'baseUrl', e.target.value)}
                      className="w-full px-3 py-2 rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary"
                      placeholder={isBaseUrlSetInEnv(providerName) ? 'Using environment variable' : 'Enter base URL'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      <div className="flex justify-end mt-4 px-4 pb-4 bg-bolt-elements-background-depth-2 border-t border-bolt-elements-borderColor">
        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-md"
        >
          Save Changes
        </button>
      </div>
    </>
  );
}
