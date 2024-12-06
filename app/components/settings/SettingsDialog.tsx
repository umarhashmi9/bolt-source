import React, { useState, type PropsWithChildren } from 'react';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import type { ProviderInfo } from '~/types/model';
import APISettings from './APISettings';
import FeaturesSettings from './FeaturesSettings';

export interface SettingsTabProps {
  provider?: ProviderInfo;
  apiKey?: string;
  setApiKey?: (key: string) => void;
  onClose: () => void;
}
type SettingsDialogProps = SettingsTabProps & {
  isOpen: boolean;
  onClose: () => void;
  provider?: ProviderInfo;
  apiKey?: string;
  setApiKey?: (key: string) => void;
};

interface Menu {
  label: string;
  key: string;
  description?: string;
}

const menus = [
  {
    label: 'API Settings',
    key: 'api-settings',
    description: 'Manage your API keys and URLs',
    component: APISettings,
  },
  {
    label: 'Features',
    key: 'features',
    description: 'Additional chat management features',
    component: FeaturesSettings,
  },
];

const SettingsTab = ({ label, description, children }: PropsWithChildren<Menu>) => {
  return (
    <div className="h-full overflow-y-auto pr-4">
      <h2 className="text-xl font-semibold mb-4 text-bolt-elements-textPrimary">{label}</h2>
      {description && (
        <p className="text-sm text-bolt-elements-textSecondary mb-4 text-bolt-elements-textSecondary">{description}</p>
      )}
      {children}
    </div>
  );
};

export function SettingsDialog({ isOpen, onClose, provider, apiKey = '', setApiKey }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('api-settings');

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose} className="!max-w-[900px]">
        <DialogTitle>Settings</DialogTitle>
        <div className="flex-1 overflow-hidden flex h-[500px]">
          <div className="w-1/4 border-r border-bolt-elements-borderColor pr-4">
            <ul className="space-y-2 p-1">
              {menus.map((menu) => (
                <li key={menu.key}>
                  <button
                    className={`w-full text-bolt-elements-textPrimary text-left py-2 px-4 rounded  bg-bolt-elements-background-depth-2 ${
                      activeTab === menu.key
                        ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                        : 'hover:bg-bolt-elements-background-depth-3'
                    }`}
                    onClick={() => setActiveTab(menu.key)}
                  >
                    {menu.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 pl-4 overflow-y-auto">
            {menus.map((menu) => (
              <div key={menu.key} style={{ display: activeTab === menu.key ? 'block' : 'none' }}>
                <SettingsTab label={menu.label} key={menu.key} description={menu.description}>
                  {React.createElement(menu.component, { provider, apiKey, setApiKey, onClose })}
                </SettingsTab>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
