import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { IconButton } from '~/components/ui/IconButton';
import { Switch } from '~/components/ui/Switch';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { toast } from 'react-toastify';
import { useState } from 'react';
import SyncStats from './SyncStats';

export default function SyncTab() {
  const syncSettings = useStore(workbenchStore.syncSettings);
  const syncFolder = useStore(workbenchStore.syncFolder);
  const [excludePattern, setExcludePattern] = useState('');

  const handleSelectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await workbenchStore.setSyncFolder(handle);
      toast.success('Sync folder selected successfully');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      toast.error('Failed to select sync folder');
    }
  };

  const handleSaveSettings = async (updates: Partial<typeof syncSettings>) => {
    try {
      await workbenchStore.saveSyncSettings({
        ...syncSettings,
        ...updates,
      });
      toast.success('Sync settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save sync settings');
    }
  };

  const handleAddExcludePattern = () => {
    if (!excludePattern) {
      return;
    }

    handleSaveSettings({
      excludePatterns: [...syncSettings.excludePatterns, excludePattern],
    });
    setExcludePattern('');
  };

  const handleRemoveExcludePattern = (pattern: string) => {
    handleSaveSettings({
      excludePatterns: syncSettings.excludePatterns.filter((p) => p !== pattern),
    });
  };

  return (
    <div className="space-y-8">
      {/* Sync Settings */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Sync Folder</h3>
          <div className="flex items-center gap-4">
            <PanelHeaderButton onClick={handleSelectFolder}>
              {syncFolder ? 'Change Folder' : 'Select Folder'}
            </PanelHeaderButton>
            {syncFolder && <span className="text-sm text-gray-500">Selected: {syncFolder.name}</span>}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sync Settings</h3>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Auto Sync</label>
            <Switch
              checked={syncSettings.autoSync}
              onCheckedChange={(checked) => handleSaveSettings({ autoSync: checked })}
            />
          </div>

          {syncSettings.autoSync && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Sync Interval</label>
              <select
                value={syncSettings.autoSyncInterval}
                onChange={(e) => handleSaveSettings({ autoSyncInterval: parseInt(e.target.value, 10) })}
                className="w-32 px-3 py-1 border border-bolt-elements-borderColor rounded bg-bolt-elements-background-depth-1"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Sync on Save</label>
            <Switch
              checked={syncSettings.syncOnSave}
              onCheckedChange={(checked) => handleSaveSettings({ syncOnSave: checked })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sync Mode</label>
            <select
              value={syncSettings.syncMode}
              onChange={(e) => handleSaveSettings({ syncMode: e.target.value as 'ask' | 'overwrite' | 'skip' })}
              className="w-full px-3 py-1 border border-bolt-elements-borderColor rounded bg-bolt-elements-background-depth-1"
            >
              <option value="ask">Ask</option>
              <option value="overwrite">Overwrite</option>
              <option value="skip">Skip</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Exclude Patterns</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={excludePattern}
                onChange={(e) => setExcludePattern(e.target.value)}
                placeholder="e.g., *.log"
                className="flex-1 px-3 py-1 border border-bolt-elements-borderColor rounded bg-bolt-elements-background-depth-1"
              />
              <PanelHeaderButton onClick={handleAddExcludePattern}>Add</PanelHeaderButton>
            </div>
            <div className="space-y-1">
              {syncSettings.excludePatterns.map((pattern) => (
                <div
                  key={pattern}
                  className="flex items-center justify-between bg-bolt-elements-background-depth-1 px-3 py-1 rounded"
                >
                  <span className="text-sm">{pattern}</span>
                  <IconButton
                    icon="i-ph:x"
                    onClick={() => handleRemoveExcludePattern(pattern)}
                    title="Remove pattern"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="border-t border-bolt-elements-borderColor pt-6">
        <SyncStats />
      </div>
    </div>
  );
}
