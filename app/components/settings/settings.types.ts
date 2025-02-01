import type { ReactNode } from 'react';

export type SettingCategory = 'profile' | 'file_sharing' | 'connectivity' | 'system' | 'services' | 'preferences';

export type TabType =
  | 'profile'
  | 'settings'
  | 'notifications'
  | 'features'
  | 'data'
  | 'cloud-providers'
  | 'local-providers'
  | 'connection'
  | 'debug'
  | 'event-logs'
  | 'update'
  | 'task-manager'
  | 'service-status';

export type WindowType = 'user' | 'developer';

export interface UserProfile {
  nickname: any;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  password?: string;
  bio?: string;
  language: string;
  timezone: string;
}

export interface SettingItem {
  id: TabType;
  label: string;
  icon: string;
  category: SettingCategory;
  description?: string;
  component: () => ReactNode;
  badge?: string;
  keywords?: string[];
}

export interface TabConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
  defaultVisibility: {
    user: boolean;
    developer: boolean;
  };
  order: number;
  locked?: boolean;
}

// Define the base configuration for all tabs
export const TAB_CONFIGURATION: Record<TabType, TabConfig> = {
  profile: {
    id: 'profile',
    label: 'Profile',
    icon: 'i-ph:user-circle-fill',
    description: 'Manage your profile and account settings',
    defaultVisibility: { user: false, developer: true },
    order: 0,
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    icon: 'i-ph:gear-fill',
    description: 'Configure application preferences',
    defaultVisibility: { user: false, developer: true },
    order: 1,
  },
  notifications: {
    id: 'notifications',
    label: 'Notifications',
    icon: 'i-ph:bell-fill',
    description: 'View and manage your notifications',
    defaultVisibility: { user: false, developer: true },
    order: 2,
  },
  features: {
    id: 'features',
    label: 'Features',
    icon: 'i-ph:star-fill',
    description: 'Manage application features',
    defaultVisibility: { user: true, developer: true },
    order: 3,
  },
  data: {
    id: 'data',
    label: 'Data',
    icon: 'i-ph:database-fill',
    description: 'Manage your data and storage',
    defaultVisibility: { user: true, developer: true },
    order: 4,
  },
  'cloud-providers': {
    id: 'cloud-providers',
    label: 'Cloud Providers',
    icon: 'i-ph:cloud-fill',
    description: 'Configure cloud AI providers',
    defaultVisibility: { user: true, developer: true },
    order: 5,
  },
  'local-providers': {
    id: 'local-providers',
    label: 'Local Providers',
    icon: 'i-ph:desktop-fill',
    description: 'Configure local AI providers',
    defaultVisibility: { user: true, developer: true },
    order: 6,
  },
  connection: {
    id: 'connection',
    label: 'Connection',
    icon: 'i-ph:plug-fill',
    description: 'View and manage connections',
    defaultVisibility: { user: true, developer: true },
    order: 7,
  },
  debug: {
    id: 'debug',
    label: 'Debug',
    icon: 'i-ph:bug-fill',
    description: 'Debug application issues',
    defaultVisibility: { user: true, developer: true },
    order: 8,
  },
  'event-logs': {
    id: 'event-logs',
    label: 'Event Logs',
    icon: 'i-ph:list-fill',
    description: 'View application event logs',
    defaultVisibility: { user: false, developer: true },
    order: 9,
  },
  update: {
    id: 'update',
    label: 'Update',
    icon: 'i-ph:arrow-clockwise-fill',
    description: 'Check for updates',
    defaultVisibility: { user: false, developer: true },
    order: 10,
  },
  'task-manager': {
    id: 'task-manager',
    label: 'Task Manager',
    icon: 'i-ph:activity-fill',
    description: 'Manage running tasks',
    defaultVisibility: { user: false, developer: true },
    order: 11,
  },
  'service-status': {
    id: 'service-status',
    label: 'Service Status',
    icon: 'i-ph:heartbeat-fill',
    description: 'Monitor provider service health and status',
    defaultVisibility: { user: false, developer: true },
    order: 12,
  },
};

// Define window-specific configurations
export const DEFAULT_USER_TABS: TabType[] = [
  'features',
  'data',
  'cloud-providers',
  'local-providers',
  'connection',
  'debug',
];

export const DEFAULT_DEVELOPER_TABS: TabType[] = [
  'profile',
  'settings',
  'notifications',
  'features',
  'data',
  'cloud-providers',
  'local-providers',
  'connection',
  'debug',
  'event-logs',
  'update',
  'task-manager',
  'service-status',
];

export interface TabState {
  visible: boolean;
  order: number;
  id: TabType;
  window: 'user' | 'developer';
}

export interface TabVisibilityConfig {
  id: TabType;
  label: string;
  icon: string;
  description: string;
  defaultVisibility: {
    user: boolean;
    developer: boolean;
  };
  order: number;
  visible: boolean;
  window: 'user' | 'developer';
  locked?: boolean;
}

export const TAB_LABELS: Record<TabType, string> = {
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notifications',
  features: 'Features',
  data: 'Data',
  'cloud-providers': 'Cloud Providers',
  'local-providers': 'Local Providers',
  connection: 'Connection',
  debug: 'Debug',
  'event-logs': 'Event Logs',
  update: 'Update',
  'task-manager': 'Task Manager',
  'service-status': 'Service Status',
};

export interface TabsState {
  user: Record<TabType, TabState>;
  developer: Record<TabType, TabState>;
  userTabs: TabType[];
  developerTabs: TabType[];
}

export interface TabWindowConfig {
  visible: boolean;
  order: number;
  window: 'user' | 'developer';
}

export const DEFAULT_TAB_CONFIG: Record<TabType, TabConfig> = TAB_CONFIGURATION;

export const categoryLabels: Record<SettingCategory, string> = {
  profile: 'Profile & Account',
  file_sharing: 'File Sharing',
  connectivity: 'Connectivity',
  system: 'System',
  services: 'Services',
  preferences: 'Preferences',
};

export const categoryIcons: Record<SettingCategory, string> = {
  profile: 'i-ph:user-circle',
  file_sharing: 'i-ph:folder-simple',
  connectivity: 'i-ph:wifi-high',
  system: 'i-ph:gear',
  services: 'i-ph:cube',
  preferences: 'i-ph:sliders',
};
