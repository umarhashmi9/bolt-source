import { map } from 'nanostores';
import { workbenchStore } from './workbench';
import Cookies from 'js-cookie';

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
  LMStudio: process.env.LMSTUDIO_API_BASE_URL || 'http://localhost:1234',
  Ollama: process.env.OLLAMA_API_BASE_URL || 'http://localhost:11434',
};

export interface ApiSettings {
  apiKeys: Record<string, string>;
  baseUrls: Record<string, string>;
  activeProviders: Record<string, boolean>;
  debugMode?: boolean;
}

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlOrMetaKey?: boolean;
  action: () => void;
}

export interface Shortcuts {
  toggleTerminal: Shortcut;
}

export interface Settings {
  shortcuts: Shortcuts;
  apiSettings: ApiSettings;
}

export const shortcutsStore = map<Shortcuts>({
  toggleTerminal: {
    key: 'j',
    ctrlOrMetaKey: true,
    action: () => workbenchStore.toggleTerminal(),
  },
});

export const apiSettingsStore = map<ApiSettings>({
  apiKeys: {},
  baseUrls: {},
  activeProviders: {},
});

// Initialize API settings from cookies and environment variables
const loadApiSettings = () => {
  try {
    const savedApiKeys = Cookies.get('apiKeys');
    const savedBaseUrls = Cookies.get('baseUrls');
    const savedActiveProviders = Cookies.get('activeProviders');
    const savedDebugMode = Cookies.get('debugMode');

    // Start with environment variables
    const apiKeys: Record<string, string> = {};
    const baseUrls: Record<string, string> = {};
    const activeProviders: Record<string, boolean> = {};
    let debugMode = false;

    // Load environment variables first
    Object.entries(ENV_API_KEYS).forEach(([provider, key]) => {
      if (key) {
        apiKeys[provider] = key;
        activeProviders[provider] = true;
      }
    });

    Object.entries(ENV_BASE_URLS).forEach(([provider, url]) => {
      if (url) {
        baseUrls[provider] = url;
        activeProviders[provider] = true;
      }
    });

    // Only merge cookie values if they exist and are not empty
    if (savedApiKeys) {
      const cookieApiKeys = JSON.parse(savedApiKeys);
      Object.entries(cookieApiKeys).forEach(([provider, key]) => {
        if (key && typeof key === 'string' && key.trim() !== '') {
          apiKeys[provider] = key;
        }
      });
    }

    if (savedBaseUrls) {
      const cookieBaseUrls = JSON.parse(savedBaseUrls);
      Object.entries(cookieBaseUrls).forEach(([provider, url]) => {
        if (url && typeof url === 'string' && url.trim() !== '') {
          baseUrls[provider] = url;
        }
      });
    }

    if (savedActiveProviders) {
      const cookieActiveProviders = JSON.parse(savedActiveProviders);
      Object.assign(activeProviders, cookieActiveProviders);
    }

    if (savedDebugMode) {
      debugMode = JSON.parse(savedDebugMode);
    }

    // Ensure providers with env vars are always active
    Object.entries(ENV_API_KEYS).forEach(([provider, key]) => {
      if (key) {
        activeProviders[provider] = true;
      }
    });

    Object.entries(ENV_BASE_URLS).forEach(([provider, url]) => {
      if (url) {
        activeProviders[provider] = true;
      }
    });

    apiSettingsStore.set({
      apiKeys,
      baseUrls,
      activeProviders,
      debugMode,
    });

    console.log('Loaded settings:', { apiKeys, baseUrls, activeProviders, debugMode });
  } catch (error) {
    console.error('Error loading API settings:', error);
  }
};

// Save API settings to cookies
export const saveApiSettings = (settings: ApiSettings) => {
  try {
    Cookies.set('apiKeys', JSON.stringify(settings.apiKeys), { expires: 30 });
    Cookies.set('baseUrls', JSON.stringify(settings.baseUrls), { expires: 30 });
    Cookies.set('activeProviders', JSON.stringify(settings.activeProviders), { expires: 30 });

    if (settings.debugMode !== undefined) {
      Cookies.set('debugMode', JSON.stringify(settings.debugMode), { expires: 30 });
    }

    apiSettingsStore.set(settings);
  } catch (error) {
    console.error('Error saving API settings to cookies:', error);
  }
};

export const settingsStore = map<Settings>({
  shortcuts: shortcutsStore.get(),
  apiSettings: apiSettingsStore.get(),
});

// Subscribe to changes in shortcuts and API settings
shortcutsStore.subscribe((shortcuts) => {
  settingsStore.set({
    ...settingsStore.get(),
    shortcuts,
  });
});

apiSettingsStore.subscribe((apiSettings) => {
  settingsStore.set({
    ...settingsStore.get(),
    apiSettings,
  });
});

// Load API settings when the module is imported
loadApiSettings();
