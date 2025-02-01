import { motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import type { TabType } from '~/components/settings/settings.types';
import { TAB_LABELS, TAB_CONFIGURATION } from '~/components/settings/settings.types';
import { DeveloperWindow } from '~/components/settings/developer/DeveloperWindow';
import { TabTile } from '~/components/settings/shared/TabTile';
import { useStore } from '@nanostores/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';

// Component imports
import ProfileTab from '~/components/settings/profile/ProfileTab';
import SettingsTab from '~/components/settings/settings/SettingsTab';
import NotificationsTab from '~/components/settings/notifications/NotificationsTab';
import FeaturesTab from '~/components/settings/features/FeaturesTab';
import DataTab from '~/components/settings/data/DataTab';
import DebugTab from '~/components/settings/debug/DebugTab';
import { EventLogsTab } from '~/components/settings/event-logs/EventLogsTab';
import UpdateTab from '~/components/settings/update/UpdateTab';
import ConnectionsTab from '~/components/settings/connections/ConnectionsTab';
import { useUpdateCheck } from '~/lib/hooks/useUpdateCheck';
import { useFeatures } from '~/lib/hooks/useFeatures';
import { useNotifications } from '~/lib/hooks/useNotifications';
import { useConnectionStatus } from '~/lib/hooks/useConnectionStatus';
import { useDebugStatus } from '~/lib/hooks/useDebugStatus';
import CloudProvidersTab from '~/components/settings/providers/CloudProvidersTab';
import ServiceStatusTab from '~/components/settings/providers/ServiceStatusTab';
import LocalProvidersTab from '~/components/settings/providers/LocalProvidersTab';
import TaskManagerTab from '~/components/settings/task-manager/TaskManagerTab';
import {
  tabConfigurationStore,
  resetTabConfiguration,
  updateTabConfiguration,
  developerModeStore,
  setDeveloperMode,
} from '~/lib/stores/settings';
import { UserDropdownMenu } from '~/components/settings/shared/UserDropdownMenu';
import { WindowTransition } from '~/components/settings/shared/WindowTransition';

interface DraggableTab {
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
}

const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Manage your profile and account settings',
  settings: 'Configure application preferences',
  notifications: 'View and manage your notifications',
  features: 'Manage application features',
  data: 'Manage your data and storage',
  'cloud-providers': 'Configure cloud AI providers',
  'local-providers': 'Configure local AI providers',
  connection: 'View and manage connections',
  debug: 'Debug application issues',
  'event-logs': 'View application event logs',
  update: 'Check for updates',
  'task-manager': 'Manage running tasks',
  'service-status': 'Monitor provider service health and status',
};

interface UsersWindowProps {
  open: boolean;
  onClose: () => void;
}

export function UsersWindow({ open, onClose }: UsersWindowProps) {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showDeveloperWindow, setShowDeveloperWindow] = useState(false);
  const tabConfiguration = useStore(tabConfigurationStore);
  const developerMode = useStore(developerModeStore);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('bolt_user_profile');
    return saved
      ? JSON.parse(saved)
      : {
          avatar: null,
          username: '',
          bio: '',
          notifications: true,
        };
  });

  // Status hooks
  const { hasUpdate, currentVersion, acknowledgeUpdate } = useUpdateCheck();
  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();
  const { hasActiveWarnings, activeIssues, acknowledgeAllIssues } = useDebugStatus();

  // Listen for profile changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bolt_user_profile') {
        const newProfile = e.newValue ? JSON.parse(e.newValue) : { avatar: null, notifications: true };
        setProfile(newProfile);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for settings toggle event
  useEffect(() => {
    const handleToggleSettings = () => {
      if (!open) {
        // Open settings panel
        setActiveTab('settings');
        onClose(); // Close any other open panels
      }
    };

    document.addEventListener('toggle-settings', handleToggleSettings);

    return () => document.removeEventListener('toggle-settings', handleToggleSettings);
  }, [open, onClose]);

  // Ensure tab configuration is properly initialized
  useEffect(() => {
    if (!tabConfiguration || !tabConfiguration.userTabs || !tabConfiguration.developerTabs) {
      console.warn('Tab configuration is invalid in UsersWindow, resetting to defaults');
      resetTabConfiguration();
    } else {
      // Validate tab configuration structure
      const isValid =
        tabConfiguration.userTabs.every((tabId) => {
          const state = tabConfiguration.user[tabId];
          return (
            state &&
            typeof state.visible === 'boolean' &&
            typeof state.order === 'number' &&
            typeof state.window === 'string'
          );
        }) &&
        tabConfiguration.developerTabs.every((tabId) => {
          const state = tabConfiguration.developer[tabId];
          return (
            state &&
            typeof state.visible === 'boolean' &&
            typeof state.order === 'number' &&
            typeof state.window === 'string'
          );
        });

      if (!isValid) {
        console.warn('Tab configuration is malformed in UsersWindow, resetting to defaults');
        resetTabConfiguration();
      }
    }
  }, [tabConfiguration]);

  // Reset state when window closes
  useEffect(() => {
    if (!open) {
      setActiveTab(null);
      setLoadingTab(null);
      setShowDeveloperWindow(false);
      setDeveloperMode(false);
    }
  }, [open]);

  // Handle developer mode toggle
  const handleDeveloperModeChange = useCallback((checked: boolean) => {
    if (checked) {
      // First show developer window, then enable developer mode
      setShowDeveloperWindow(true);
      setDeveloperMode(true);
      // Don't close the window, just hide user window content
      setActiveTab(null);
      setLoadingTab(null);
    } else {
      setDeveloperMode(false);
      setShowDeveloperWindow(false);
    }
  }, []);

  // Handle developer window close
  const handleDeveloperWindowClose = useCallback(() => {
    setDeveloperMode(false);
    setShowDeveloperWindow(false);
  }, []);

  // Handle window close
  const handleClose = useCallback(() => {
    setActiveTab(null);
    setLoadingTab(null);
    setShowDeveloperWindow(false);
    setDeveloperMode(false);
    onClose();
  }, [onClose]);

  // Handle back button with cleanup
  const handleBack = useCallback(() => {
    setActiveTab(null);
    setLoadingTab(null);
  }, []);

  // Handle tab click with loading state
  const handleTabClick = useCallback(
    async (tabId: TabType) => {
      setLoadingTab(tabId);
      setActiveTab(tabId);

      try {
        // Acknowledge the status based on tab type
        switch (tabId) {
          case 'update': {
            await acknowledgeUpdate();
            break;
          }
          case 'features': {
            await acknowledgeAllFeatures();
            break;
          }
          case 'notifications': {
            await markAllAsRead();
            break;
          }
          case 'connection': {
            acknowledgeIssue();
            break;
          }
          case 'debug': {
            await acknowledgeAllIssues();
            break;
          }
        }
      } finally {
        // Always clear loading state
        setLoadingTab(null);
      }
    },
    [acknowledgeUpdate, acknowledgeAllFeatures, markAllAsRead, acknowledgeIssue, acknowledgeAllIssues],
  );

  const getVisibleUserTabs = (): DraggableTab[] => {
    if (!tabConfiguration?.user) {
      return [];
    }

    return Object.entries(tabConfiguration.user)
      .map(([id, state]) => {
        const tabType = id as TabType;
        const tabConfig = TAB_CONFIGURATION[tabType];

        return {
          id: tabType,
          label: tabConfig.label,
          icon: tabConfig.icon,
          description: tabConfig.description,
          defaultVisibility: tabConfig.defaultVisibility,
          order: state.order,
          visible: state.visible,
          window: 'user' as const,
        };
      })
      .filter((tab) => tab.visible)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    const visibleTabs = getVisibleUserTabs();
    const updatedTabs = [...visibleTabs];
    const [draggedTab] = updatedTabs.splice(sourceIndex, 1);
    updatedTabs.splice(destinationIndex, 0, draggedTab);

    // Update order for all affected tabs
    updatedTabs.forEach((tab, index) => {
      updateTabConfiguration('user', tab.id, {
        visible: true,
        order: index,
      });
    });
  };

  const getTabComponent = () => {
    switch (activeTab) {
      case 'profile': {
        return <ProfileTab />;
      }
      case 'settings': {
        return <SettingsTab />;
      }
      case 'notifications': {
        return <NotificationsTab />;
      }
      case 'features': {
        return <FeaturesTab />;
      }
      case 'data': {
        return <DataTab />;
      }
      case 'cloud-providers': {
        return <CloudProvidersTab />;
      }
      case 'service-status': {
        return <ServiceStatusTab />;
      }
      case 'local-providers': {
        return <LocalProvidersTab />;
      }
      case 'connection': {
        return <ConnectionsTab />;
      }
      case 'debug': {
        return <DebugTab />;
      }
      case 'event-logs': {
        return <EventLogsTab />;
      }
      case 'update': {
        return <UpdateTab />;
      }
      case 'task-manager': {
        return <TaskManagerTab />;
      }
      default: {
        return null;
      }
    }
  };

  const getTabUpdateStatus = (tabId: TabType): boolean => {
    switch (tabId) {
      case 'update':
        return hasUpdate;
      case 'features':
        return hasNewFeatures;
      case 'notifications':
        return hasUnreadNotifications;
      case 'connection':
        return hasConnectionIssues;
      case 'debug':
        return hasActiveWarnings;
      default:
        return false;
    }
  };

  const getStatusMessage = (tabId: TabType): string => {
    switch (tabId) {
      case 'update':
        return `New update available (v${currentVersion})`;
      case 'features':
        return `${unviewedFeatures.length} new feature${unviewedFeatures.length === 1 ? '' : 's'} to explore`;
      case 'notifications':
        return `${unreadNotifications.length} unread notification${unreadNotifications.length === 1 ? '' : 's'}`;
      case 'connection':
        return currentIssue === 'disconnected'
          ? 'Connection lost'
          : currentIssue === 'high-latency'
            ? 'High latency detected'
            : 'Connection issues detected';
      case 'debug': {
        const warnings = activeIssues.filter((i) => i.type === 'warning').length;
        const errors = activeIssues.filter((i) => i.type === 'error').length;

        return `${warnings} warning${warnings === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}`;
      }
      default:
        return '';
    }
  };

  return (
    <>
      <DeveloperWindow open={showDeveloperWindow && developerMode} onClose={handleDeveloperWindowClose} />
      <WindowTransition isOpen={open && (!showDeveloperWindow || !developerMode)} onClose={handleClose} type="user">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {activeTab ? (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                >
                  <div className="i-ph:arrow-left w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
                </button>
              ) : (
                <motion.div
                  className="i-ph:lightning-fill w-5 h-5 text-purple-500"
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 10 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 2,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeTab ? TAB_LABELS[activeTab] : 'Bolt Control Panel'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={developerMode}
                  onCheckedChange={handleDeveloperModeChange}
                  className="data-[state=checked]:bg-purple-500"
                  aria-label="Toggle developer mode"
                />
                <label className="text-sm text-gray-500 dark:text-gray-400">Switch to Developer Mode</label>
              </div>

              <UserDropdownMenu
                onNavigate={handleTabClick}
                onClose={handleClose}
                hasUnreadNotifications={hasUnreadNotifications}
                unreadNotificationsCount={unreadNotifications.length}
                avatarUrl={profile.avatar}
                _windowType="user"
              />

              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
              >
                <div className="i-ph:x w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab ? (
              getTabComponent()
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="user-tabs">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-4 gap-4">
                      {getVisibleUserTabs().map((tab, index) => (
                        <Draggable key={tab.id} draggableId={tab.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <TabTile
                                tab={tab}
                                onClick={() => handleTabClick(tab.id)}
                                isActive={activeTab === tab.id}
                                hasUpdate={getTabUpdateStatus(tab.id)}
                                _statusMessage={getStatusMessage(tab.id)}
                                description={TAB_DESCRIPTIONS[tab.id]}
                                isLoading={loadingTab === tab.id}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </WindowTransition>
    </>
  );
}
