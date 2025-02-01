import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { classNames } from '~/utils/classNames';
import {
  TAB_CONFIGURATION,
  DEFAULT_USER_TABS,
  DEFAULT_DEVELOPER_TABS,
  type TabType,
  type WindowType,
} from '~/components/settings/settings.types';
import { toast } from 'react-toastify';
import { useSettings } from '~/lib/hooks/useSettings';
import { useStore } from '@nanostores/react';
import { tabConfigurationStore } from '~/lib/stores/settings';

interface TabListProps {
  windowType: WindowType;
  onToggleTab: (tabId: TabType, visible: boolean) => void;
}

function TabList({ windowType, onToggleTab }: TabListProps) {
  const tabConfiguration = useStore(tabConfigurationStore);
  const windowTabs = tabConfiguration[windowType];

  return (
    <div className="space-y-2">
      {Object.entries(TAB_CONFIGURATION).map(([tabId, config]) => {
        const tab = windowTabs[tabId as TabType];
        const isVisible = tab?.visible ?? false;
        const isDefaultTab =
          windowType === 'user'
            ? DEFAULT_USER_TABS.includes(tabId as TabType)
            : DEFAULT_DEVELOPER_TABS.includes(tabId as TabType);

        return (
          <motion.div
            key={tabId}
            layout
            className={classNames(
              'group relative flex items-center justify-between',
              'rounded-lg border p-4',
              'bg-white dark:bg-gray-800',
              'border-gray-200 dark:border-gray-700',
              'hover:border-purple-200 dark:hover:border-purple-500/30',
              'transition-all',
            )}
          >
            <div className="flex items-center space-x-3">
              <div className={classNames(config.icon, 'h-5 w-5 text-purple-500')} />
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{config.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isDefaultTab && <span className="text-xs text-purple-500">Default</span>}
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => onToggleTab(tabId as TabType, e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-700" />
              </label>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function TabManagement() {
  const [activeWindow, setActiveWindow] = useState<WindowType>('user');
  const { updateTabConfiguration, resetTabConfiguration } = useSettings();
  const tabConfiguration = useStore(tabConfigurationStore);

  const handleToggleTab = useCallback(
    (tabId: TabType, visible: boolean) => {
      const currentTab = tabConfiguration[activeWindow][tabId];
      updateTabConfiguration(activeWindow, tabId, {
        visible,
        order: currentTab.order,
      });

      // Use a shorter toast duration to prevent UI blocking
      toast.success(`${TAB_CONFIGURATION[tabId].label} ${visible ? 'enabled' : 'disabled'} in ${activeWindow} window`, {
        autoClose: 500,
      });
    },
    [activeWindow, tabConfiguration, updateTabConfiguration],
  );

  const handleReset = useCallback(() => {
    resetTabConfiguration();
    toast.success('Tab settings reset to defaults', { autoClose: 500 });
  }, [resetTabConfiguration]);

  const handleWindowChange = useCallback((newWindow: WindowType) => {
    setActiveWindow(newWindow);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Tab Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure which tabs are visible in each window</p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-2 rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20"
        >
          <span className="i-ph:arrow-counter-clockwise" />
          <span>Reset to Defaults</span>
        </button>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => handleWindowChange('user')}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-lg',
            activeWindow === 'user' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-purple-500',
          )}
        >
          User Window
        </button>
        <button
          onClick={() => handleWindowChange('developer')}
          className={classNames(
            'px-4 py-2 text-sm font-medium rounded-lg',
            activeWindow === 'developer' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-purple-500',
          )}
        >
          Developer Window
        </button>
      </div>

      <TabList windowType={activeWindow} onToggleTab={handleToggleTab} />
    </div>
  );
}
