import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { classNames } from '~/shared/utils/classNames';
import { TabManagement } from '~/settings/shared/components/TabManagement';
import { TabTile } from '~/settings/shared/components/TabTile';
import { useFeatures } from '~/shared/hooks/useFeatures';
import { useNotifications } from '~/shared/hooks/useNotifications';
import { useConnectionStatus } from '~/shared/hooks/useConnectionStatus';
import { tabConfigurationStore, resetTabConfiguration } from '~/settings/stores/settings';
import { profileStore } from '~/shared/stores/profile';
import type { TabType, Profile } from './types';
import { TAB_LABELS, DEFAULT_TAB_CONFIG } from './constants';
import { DialogTitle } from '~/shared/components/ui/Dialog';
import { AvatarDropdown } from './AvatarDropdown';
import BackgroundRays from '~/shared/components/ui/BackgroundRays';

// Import tab content components
import ProfileTab from '~/settings/tabs/profile/ProfileTab';
import SettingsTab from '~/settings/tabs/settings/SettingsTab';
import NotificationsTab from '~/settings/tabs/notifications/NotificationsTab';
import FeaturesTab from '~/settings/tabs/features/FeaturesTab';
import { DataTab } from '~/settings/tabs/data/DataTab';
import ConnectionsTab from '~/settings/tabs/connections/ConnectionsTab';
import LocalProvidersTab from '~/settings/tabs/providers/local/LocalProvidersTab';
import CloudProvidersTab from '~/settings/tabs/providers/cloud/CloudProvidersTab';

interface ControlPanelProps {
  open: boolean;
  onClose: () => void;
}

const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Manage your profile and account settings',
  settings: 'Configure application preferences',
  notifications: 'View and manage your notifications',
  features: 'Explore new and upcoming features',
  data: 'Manage your data and storage',
  'cloud-providers': 'Configure cloud AI providers and models',
  'local-providers': 'Configure local AI providers and models',
  connection: 'Check connection status and settings',
};

// Beta status for experimental features
const BETA_TABS = new Set<TabType>(['local-providers']);

const BetaLabel = () => (
  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20">
    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">BETA</span>
  </div>
);

// Add this function to render tab content
const renderTabContent = (activeTab: TabType) => {
  switch (activeTab) {
    case 'profile':
      return <ProfileTab />;
    case 'settings':
      return <SettingsTab />;
    case 'notifications':
      return <NotificationsTab />;
    case 'features':
      return <FeaturesTab />;
    case 'data':
      return <DataTab />;
    case 'connection':
      return <ConnectionsTab />;
    case 'cloud-providers':
      return <CloudProvidersTab />;
    case 'local-providers':
      return <LocalProvidersTab />;
    default:
      return null;
  }
};

export const ControlPanel = ({ open, onClose }: ControlPanelProps) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [showTabManagement, setShowTabManagement] = useState(false);

  // Store values
  const tabConfiguration = useStore(tabConfigurationStore);
  const profile = useStore(profileStore) as Profile;

  // Status hooks
  const { hasNewFeatures, unviewedFeatures, acknowledgeAllFeatures } = useFeatures();
  const { hasUnreadNotifications, unreadNotifications, markAllAsRead } = useNotifications();
  const { hasConnectionIssues, currentIssue, acknowledgeIssue } = useConnectionStatus();

  // Memoize the base tab configurations to avoid recalculation
  const baseTabConfig = useMemo(() => {
    return new Map(DEFAULT_TAB_CONFIG.map((tab) => [tab.id, tab]));
  }, []);

  // Add visibleTabs logic using useMemo with optimized calculations
  const visibleTabs = useMemo(() => {
    if (!tabConfiguration?.userTabs || !Array.isArray(tabConfiguration.userTabs)) {
      console.warn('Invalid tab configuration, resetting to defaults');
      resetTabConfiguration();

      return [];
    }

    const notificationsDisabled = profile?.preferences?.notifications === false;

    // Optimize user mode tab filtering
    return tabConfiguration.userTabs
      .filter((tab) => {
        if (!tab?.id) {
          return false;
        }

        if (tab.id === 'notifications' && notificationsDisabled) {
          return false;
        }

        return tab.visible && tab.window === 'user';
      })
      .sort((a, b) => a.order - b.order);
  }, [tabConfiguration, profile?.preferences?.notifications, baseTabConfig]);

  // Optimize animation performance with layout animations
  const gridLayoutVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20,
        mass: 0.6,
      },
    },
  };

  // Reset to default view when modal opens/closes
  useEffect(() => {
    if (!open) {
      // Reset when closing
      setActiveTab(null);
      setLoadingTab(null);
      setShowTabManagement(false);
    } else {
      // When opening, set to null to show the main view
      setActiveTab(null);
    }
  }, [open]);

  // Handle closing
  const handleClose = () => {
    setActiveTab(null);
    setLoadingTab(null);
    setShowTabManagement(false);
    onClose();
  };

  // Handlers
  const handleBack = () => {
    if (showTabManagement) {
      setShowTabManagement(false);
    } else if (activeTab) {
      setActiveTab(null);
    }
  };

  const getTabUpdateStatus = (tabId: TabType): boolean => {
    switch (tabId) {
      case 'features':
        return hasNewFeatures;
      case 'notifications':
        return hasUnreadNotifications;
      case 'connection':
        return hasConnectionIssues;
      default:
        return false;
    }
  };

  const getStatusMessage = (tabId: TabType): string => {
    switch (tabId) {
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
      default:
        return '';
    }
  };

  const handleTabClick = (tabId: TabType) => {
    setLoadingTab(tabId);
    setActiveTab(tabId);
    setShowTabManagement(false);

    // Acknowledge notifications based on tab
    switch (tabId) {
      case 'features':
        acknowledgeAllFeatures();
        break;
      case 'notifications':
        markAllAsRead();
        break;
      case 'connection':
        acknowledgeIssue();
        break;
    }

    // Clear loading state after a delay
    setTimeout(() => setLoadingTab(null), 500);
  };

  return (
    <RadixDialog.Root open={open}>
      <RadixDialog.Portal>
        <div className="fixed inset-0 flex items-center justify-center z-[100] modern-scrollbar">
          <RadixDialog.Overlay asChild>
            <motion.div
              className="absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </RadixDialog.Overlay>

          <RadixDialog.Content
            aria-describedby={undefined}
            onEscapeKeyDown={handleClose}
            onPointerDownOutside={handleClose}
            className="relative z-[101]"
          >
            <motion.div
              className={classNames(
                'w-[1200px] h-[90vh]',
                'bg-[#FAFAFA] dark:bg-[#0A0A0A]',
                'rounded-2xl shadow-2xl',
                'border border-[#E5E5E5] dark:border-[#1A1A1A]',
                'flex flex-col overflow-hidden',
                'relative',
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <BackgroundRays />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    {(activeTab || showTabManagement) && (
                      <button
                        onClick={handleBack}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                      >
                        <div className="i-ph:arrow-left w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
                      </button>
                    )}
                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                      {showTabManagement ? 'Tab Management' : activeTab ? TAB_LABELS[activeTab] : 'Control Panel'}
                    </DialogTitle>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Avatar and Dropdown */}
                    <div className="border-l border-gray-200 dark:border-gray-800 pl-6">
                      <AvatarDropdown onSelectTab={handleTabClick} />
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent hover:bg-purple-500/10 dark:hover:bg-purple-500/20 group transition-all duration-200"
                    >
                      <div className="i-ph:x w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div
                  className={classNames(
                    'flex-1',
                    'overflow-y-auto',
                    'hover:overflow-y-auto',
                    'scrollbar scrollbar-w-2',
                    'scrollbar-track-transparent',
                    'scrollbar-thumb-[#E5E5E5] hover:scrollbar-thumb-[#CCCCCC]',
                    'dark:scrollbar-thumb-[#333333] dark:hover:scrollbar-thumb-[#444444]',
                    'will-change-scroll',
                    'touch-auto',
                  )}
                >
                  <motion.div
                    key={activeTab || 'home'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    {showTabManagement ? (
                      <TabManagement />
                    ) : activeTab ? (
                      renderTabContent(activeTab)
                    ) : (
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative"
                        variants={gridLayoutVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <AnimatePresence mode="popLayout">
                          {visibleTabs.map((tab) => (
                            <motion.div key={tab.id} layout variants={itemVariants} className="aspect-[1.5/1]">
                              <TabTile
                                tab={tab}
                                onClick={() => handleTabClick(tab.id as TabType)}
                                isActive={activeTab === tab.id}
                                hasUpdate={getTabUpdateStatus(tab.id)}
                                statusMessage={getStatusMessage(tab.id)}
                                description={TAB_DESCRIPTIONS[tab.id]}
                                isLoading={loadingTab === tab.id}
                                className="h-full relative"
                              >
                                {BETA_TABS.has(tab.id) && <BetaLabel />}
                              </TabTile>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
