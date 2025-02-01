import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { TabManagement } from './TabManagement';
import { TabTile } from '~/components/settings/shared/TabTile';
import type { TabType } from '~/components/settings/settings.types';
import {
  tabConfigurationStore,
  resetTabConfiguration,
  updateTabConfiguration,
  developerModeStore,
  setDeveloperMode,
} from '~/lib/stores/settings';
import { useStore } from '@nanostores/react';
import DebugTab from '~/components/settings/debug/DebugTab';
import { EventLogsTab } from '~/components/settings/event-logs/EventLogsTab';
import UpdateTab from '~/components/settings/update/UpdateTab';
import DataTab from '~/components/settings/data/DataTab';
import FeaturesTab from '~/components/settings/features/FeaturesTab';
import NotificationsTab from '~/components/settings/notifications/NotificationsTab';
import SettingsTab from '~/components/settings/settings/SettingsTab';
import ProfileTab from '~/components/settings/profile/ProfileTab';
import ConnectionsTab from '~/components/settings/connections/ConnectionsTab';
import { useUpdateCheck, useFeatures, useNotifications, useConnectionStatus, useDebugStatus } from '~/lib/hooks';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import CloudProvidersTab from '~/components/settings/providers/CloudProvidersTab';
import LocalProvidersTab from '~/components/settings/providers/LocalProvidersTab';
import TaskManagerTab from '~/components/settings/task-manager/TaskManagerTab';
import ServiceStatusTab from '~/components/settings/providers/ServiceStatusTab';
import { Switch } from '~/components/ui/Switch';
import { UserDropdownMenu } from '~/components/settings/shared/UserDropdownMenu';
import { WindowTransition } from '~/components/settings/shared/WindowTransition';
import { TAB_CONFIGURATION } from '~/components/settings/settings.types';
import type { DropResult } from 'react-beautiful-dnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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

interface DeveloperWindowProps {
  open: boolean;
  onClose: () => void;
}

export function DeveloperWindow({ open, onClose }: DeveloperWindowProps) {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showTabManagement, setShowTabManagement] = useState(false);
  const tabConfiguration = useStore(tabConfigurationStore);
  const developerMode = useStore(developerModeStore);
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('bolt_user_profile');
    return saved ? JSON.parse(saved) : { avatar: null, notifications: true };
  });

  // Reset state when window closes
  useEffect(() => {
    if (!open) {
      setActiveTab(null);
      setLoadingTab(null);
      setShowTabManagement(false);
    }
  }, [open]);

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

  // Status hooks
  const { hasUpdate, currentVersion, acknowledgeUpdate } = useUpdateCheck();
  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();
  const { hasActiveWarnings, activeIssues, acknowledgeAllIssues } = useDebugStatus();

  // Ensure tab configuration is properly initialized
  useEffect(() => {
    if (!tabConfiguration || !tabConfiguration.userTabs || !tabConfiguration.developerTabs) {
      console.warn('Tab configuration is invalid in DeveloperWindow, resetting to defaults');
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
        console.warn('Tab configuration is malformed in DeveloperWindow, resetting to defaults');
        resetTabConfiguration();
      }
    }
  }, [tabConfiguration]);

  // Handle back button with cleanup
  const handleBack = () => {
    if (showTabManagement) {
      setShowTabManagement(false);
      setActiveTab(null);
      setLoadingTab(null);
    } else if (activeTab) {
      setActiveTab(null);
      setLoadingTab(null);
    }
  };

  // Only show tabs that are assigned to the developer window AND are visible
  const getVisibleDeveloperTabs = (): DraggableTab[] => {
    if (!tabConfiguration?.developer) {
      return [];
    }

    return Object.entries(tabConfiguration.developer)
      .map(([id, state]) => {
        const tabType = id as TabType;
        const tabConfig = TAB_CONFIGURATION[tabType];
        const draggableTab = {
          id: tabType,
          label: tabConfig.label,
          icon: tabConfig.icon,
          description: tabConfig.description,
          defaultVisibility: tabConfig.defaultVisibility,
          order: state.order,
          visible: state.visible,
          window: 'developer',
        } satisfies DraggableTab;
        return draggableTab;
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

    const visibleTabs = getVisibleDeveloperTabs();
    const updatedTabs = [...visibleTabs];
    const [draggedTab] = updatedTabs.splice(sourceIndex, 1);
    updatedTabs.splice(destinationIndex, 0, draggedTab);

    // Update order for all affected tabs
    updateTabConfiguration('developer', draggedTab.id, {
      visible: true,
      order: destinationIndex,
    });

    if (updatedTabs[sourceIndex]) {
      updateTabConfiguration('developer', updatedTabs[sourceIndex].id, {
        visible: true,
        order: sourceIndex,
      });
    }
  };

  const handleTabClick = (tabId: TabType) => {
    // Don't allow clicking notifications tab if disabled
    if (tabId === 'notifications' && !profile.notifications) {
      return;
    }

    setLoadingTab(tabId);
    setActiveTab(tabId);

    // Acknowledge the status based on tab type
    switch (tabId) {
      case 'update': {
        acknowledgeUpdate();
        break;
      }
      case 'features': {
        acknowledgeAllFeatures();
        break;
      }
      case 'notifications': {
        markAllAsRead();
        break;
      }
      case 'connection': {
        acknowledgeIssue();
        break;
      }
      case 'debug': {
        acknowledgeAllIssues();
        break;
      }
    }

    // Clear loading state after a short delay
    setTimeout(() => {
      setLoadingTab(null);
    }, 500);
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

  // Trap focus when window is open
  useEffect(() => {
    if (open) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Handle window close
  const handleClose = useCallback(() => {
    if (activeTab) {
      setActiveTab(null);
    }

    setLoadingTab(null);
    setShowTabManagement(false);
    onClose();
  }, [onClose]);

  // Handle mode switch
  const handleModeSwitch = useCallback(() => {
    if (activeTab) {
      setActiveTab(null);
    }

    setDeveloperMode(false);
  }, []);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[220px] bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-[200] animate-in fade-in-0 zoom-in-95"
            sideOffset={5}
            align="end"
          >
            <DropdownMenu.Item
              className="group flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer transition-colors"
              onSelect={() => handleTabClick('profile')}
            >
              <div className="mr-3 flex h-5 w-5 items-center justify-center">
                <div className="i-ph:user-circle w-[18px] h-[18px] text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
              </div>
              <span className="group-hover:text-purple-500 transition-colors">Profile</span>
            </DropdownMenu.Item>

            {/* ... other dropdown items ... */}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>

        {/* Window with improved transitions */}
        <WindowTransition isOpen={open && developerMode} onClose={handleClose} type="developer">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {activeTab || showTabManagement ? (
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
                  {showTabManagement ? 'Tab Management' : activeTab ? 'Developer Tools' : 'Developer Settings'}
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                {!activeTab && !showTabManagement && (
                  <motion.button
                    onClick={() => setShowTabManagement(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="i-ph:sliders-horizontal w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors">
                      Manage Tabs
                    </span>
                  </motion.button>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={developerMode}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        handleModeSwitch();
                      }
                    }}
                    className="data-[state=checked]:bg-purple-500"
                    aria-label="Toggle developer mode"
                  />
                  <label className="text-sm text-gray-500 dark:text-gray-400">Switch to User Mode</label>
                </div>

                <div className="relative">
                  <UserDropdownMenu
                    onNavigate={handleTabClick}
                    onClose={handleClose}
                    hasUnreadNotifications={hasUnreadNotifications}
                    unreadNotificationsCount={unreadNotifications.length}
                    avatarUrl={profile.avatar}
                    _windowType="developer"
                  />
                </div>

                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                >
                  <div className="i-ph:x w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {showTabManagement ? (
                <TabManagement />
              ) : activeTab ? (
                getTabComponent()
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="developer-tabs">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-4 gap-4">
                        {getVisibleDeveloperTabs().map((tab, index) => (
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
      </DropdownMenu.Root>
    </>
  );
}
