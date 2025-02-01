import { atom, map } from 'nanostores';
import { workbenchStore } from './workbench';
import { PROVIDER_LIST } from '~/utils/constants';
import type { IProviderConfig } from '~/types/model';
import type { TabType, TabsState, TabState } from '~/components/settings/settings.types';
import { DEFAULT_TAB_CONFIG, DEFAULT_USER_TABS, DEFAULT_DEVELOPER_TABS } from '~/components/settings/settings.types';
import { toggleTheme } from './theme';
import { chatStore } from './chat';

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
  toggleTheme: Shortcut;
  toggleChat: Shortcut;
  toggleSettings: Shortcut;
}

export const URL_CONFIGURABLE_PROVIDERS = ['Ollama', 'LMStudio', 'OpenAILike'];
export const LOCAL_PROVIDERS = ['OpenAILike', 'LMStudio', 'Ollama'];

export type ProviderSetting = Record<string, IProviderConfig>;

export const shortcutsStore = map<Shortcuts>({
  toggleTerminal: {
    key: '`',
    ctrlOrMetaKey: true,
    action: () => workbenchStore.toggleTerminal(),
  },
  toggleTheme: {
    key: 'd',
    metaKey: true, // Command key on Mac, Windows key on Windows
    altKey: true, // Option key on Mac, Alt key on Windows
    shiftKey: true,
    action: () => toggleTheme(),
  },
  toggleChat: {
    key: 'k',
    ctrlOrMetaKey: true,
    action: () => chatStore.setKey('showChat', !chatStore.get().showChat),
  },
  toggleSettings: {
    key: 's',
    ctrlOrMetaKey: true,
    altKey: true,
    action: () => {
      // This will be connected to the settings panel toggle
      document.dispatchEvent(new CustomEvent('toggle-settings'));
    },
  },
});

// Create a single key for provider settings
const PROVIDER_SETTINGS_KEY = 'provider_settings';

// Initialize provider settings from both localStorage and defaults
const getInitialProviderSettings = (): ProviderSetting => {
  const savedSettings = localStorage.getItem(PROVIDER_SETTINGS_KEY);
  const initialSettings: ProviderSetting = {};

  // Start with default settings
  PROVIDER_LIST.forEach((provider) => {
    initialSettings[provider.name] = {
      ...provider,
      settings: {
        enabled: true,
      },
    };
  });

  // Override with saved settings if they exist
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      Object.entries(parsed).forEach(([key, value]) => {
        if (initialSettings[key]) {
          initialSettings[key].settings = (value as IProviderConfig).settings;
        }
      });
    } catch (error) {
      console.error('Error parsing saved provider settings:', error);
    }
  }

  return initialSettings;
};

export const providersStore = map<ProviderSetting>(getInitialProviderSettings());

// Create a function to update provider settings that handles both store and persistence
export const updateProviderSettings = (provider: string, settings: ProviderSetting) => {
  const currentSettings = providersStore.get();

  // Create new provider config with updated settings
  const updatedProvider = {
    ...currentSettings[provider],
    settings: {
      ...currentSettings[provider].settings,
      ...settings,
    },
  };

  // Update the store with new settings
  providersStore.setKey(provider, updatedProvider);

  // Save to localStorage
  const allSettings = providersStore.get();
  localStorage.setItem(PROVIDER_SETTINGS_KEY, JSON.stringify(allSettings));
};

export const isDebugMode = atom(false);

// Define keys for localStorage
const SETTINGS_KEYS = {
  LATEST_BRANCH: 'isLatestBranch',
  AUTO_SELECT_TEMPLATE: 'autoSelectTemplate',
  CONTEXT_OPTIMIZATION: 'contextOptimizationEnabled',
  EVENT_LOGS: 'isEventLogsEnabled',
  LOCAL_MODELS: 'isLocalModelsEnabled',
  PROMPT_ID: 'promptId',
} as const;

// Initialize settings from localStorage or defaults
const getInitialSettings = () => {
  const getStoredBoolean = (key: string, defaultValue: boolean): boolean => {
    const stored = localStorage.getItem(key);

    if (stored === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  };

  return {
    latestBranch: getStoredBoolean(SETTINGS_KEYS.LATEST_BRANCH, false),
    autoSelectTemplate: getStoredBoolean(SETTINGS_KEYS.AUTO_SELECT_TEMPLATE, false),
    contextOptimization: getStoredBoolean(SETTINGS_KEYS.CONTEXT_OPTIMIZATION, false),
    eventLogs: getStoredBoolean(SETTINGS_KEYS.EVENT_LOGS, true),
    localModels: getStoredBoolean(SETTINGS_KEYS.LOCAL_MODELS, true),
    promptId: localStorage.getItem(SETTINGS_KEYS.PROMPT_ID) || 'default',
  };
};

// Initialize stores with persisted values
const initialSettings = getInitialSettings();

export const latestBranchStore = atom<boolean>(initialSettings.latestBranch);
export const autoSelectStarterTemplate = atom<boolean>(initialSettings.autoSelectTemplate);
export const enableContextOptimizationStore = atom<boolean>(initialSettings.contextOptimization);
export const isEventLogsEnabled = atom<boolean>(initialSettings.eventLogs);
export const isLocalModelsEnabled = atom<boolean>(initialSettings.localModels);
export const promptStore = atom<string>(initialSettings.promptId);

// Helper functions to update settings with persistence
export const updateLatestBranch = (enabled: boolean) => {
  latestBranchStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.LATEST_BRANCH, JSON.stringify(enabled));
};

export const updateAutoSelectTemplate = (enabled: boolean) => {
  autoSelectStarterTemplate.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.AUTO_SELECT_TEMPLATE, JSON.stringify(enabled));
};

export const updateContextOptimization = (enabled: boolean) => {
  enableContextOptimizationStore.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.CONTEXT_OPTIMIZATION, JSON.stringify(enabled));
};

export const updateEventLogs = (enabled: boolean) => {
  isEventLogsEnabled.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.EVENT_LOGS, JSON.stringify(enabled));
};

export const updateLocalModels = (enabled: boolean) => {
  isLocalModelsEnabled.set(enabled);
  localStorage.setItem(SETTINGS_KEYS.LOCAL_MODELS, JSON.stringify(enabled));
};

export const updatePromptId = (id: string) => {
  promptStore.set(id);
  localStorage.setItem(SETTINGS_KEYS.PROMPT_ID, id);
};

// Initialize tab configuration store with all required tabs
const createInitialTabState = (): TabsState => {
  // Create a complete record of all possible tabs
  const createTabStateRecord = (tabs: TabType[], defaultVisible: boolean): Record<TabType, TabState> => {
    const record: Partial<Record<TabType, TabState>> = {};

    // Initialize all tabs as hidden first
    Object.keys(DEFAULT_TAB_CONFIG).forEach((tabId) => {
      const id = tabId as TabType;
      record[id] = {
        visible: false,
        order: 0,
        id,
        window: defaultVisible ? 'user' : 'developer',
      };
    });

    // Then set the specified tabs as visible with proper order
    tabs.forEach((tabId, index) => {
      record[tabId] = {
        visible: defaultVisible,
        order: index,
        id: tabId,
        window: defaultVisible ? 'user' : 'developer',
      };
    });

    return record as Record<TabType, TabState>;
  };

  return {
    user: createTabStateRecord(DEFAULT_USER_TABS, true),
    developer: createTabStateRecord(DEFAULT_DEVELOPER_TABS, true),
    userTabs: DEFAULT_USER_TABS,
    developerTabs: DEFAULT_DEVELOPER_TABS,
  };
};

const initialTabState = createInitialTabState();

export const tabConfigurationStore = map<TabsState>(initialTabState);

// Developer mode store
export const developerModeStore = atom<boolean>(false);
export const setDeveloperMode = (value: boolean) => developerModeStore.set(value);

// Tab configuration actions
export const updateTabConfiguration = (
  windowType: 'user' | 'developer',
  tabId: TabType,
  config: { visible?: boolean; order?: number },
) => {
  const current = tabConfigurationStore.get();

  // Create a shallow copy of the window tabs
  const windowTabs = { ...current[windowType] };

  // Update the specific tab
  windowTabs[tabId] = {
    ...windowTabs[tabId],
    ...config,
    id: tabId,
    window: windowType,
  };

  // Get visible tabs without recomputing the entire state
  const visibleTabs = Object.entries(windowTabs)
    .filter(([_, state]) => state.visible)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id]) => id as TabType);

  // Update only the necessary parts of the state
  const newState = {
    ...current,
    [windowType]: windowTabs,
  };

  // Update the visible tabs arrays only for the affected window
  if (windowType === 'user') {
    newState.userTabs = visibleTabs;
  } else {
    newState.developerTabs = visibleTabs;
  }

  // Set the new state in a single update
  tabConfigurationStore.set(newState);
};

export const resetTabConfiguration = () => {
  tabConfigurationStore.set(initialTabState);
};

// Helper functions
export const getVisibleTabs = (windowType: 'user' | 'developer'): TabType[] => {
  const config = tabConfigurationStore.get();
  return Object.entries(config[windowType])
    .filter(([_, tabState]) => tabState.visible)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([tabId]) => tabId as TabType);
};

export const isTabVisible = (windowType: 'user' | 'developer', tabId: TabType): boolean => {
  const config = tabConfigurationStore.get();
  return config[windowType][tabId]?.visible ?? false;
};

export const getTabOrder = (windowType: 'user' | 'developer', tabId: TabType): number => {
  const config = tabConfigurationStore.get();
  return config[windowType][tabId]?.order ?? 0;
};
