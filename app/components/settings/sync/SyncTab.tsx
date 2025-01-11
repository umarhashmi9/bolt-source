import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { IconButton } from '~/components/ui/IconButton';
import { Switch } from '~/components/ui/Switch';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import SyncStats from './SyncStats';

export default function SyncTab() {
  const syncSettings = useStore(workbenchStore.syncSettings);
  const syncFolder = useStore(workbenchStore.syncFolder);
  const currentSession = useStore(workbenchStore.currentSession);
  const [excludePattern, setExcludePattern] = useState('');
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    if (!currentSession?.lastSync) {
      return undefined;
    }

    const updateLastSyncTime = () => {
      const now = Date.now();
      const diff = now - currentSession.lastSync;

      if (diff < 60000) {
        setLastSyncTime('just now');
      } else if (diff < 3600000) {
        setLastSyncTime(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setLastSyncTime(`${Math.floor(diff / 3600000)}h ago`);
      }
    };

    updateLastSyncTime();

    const interval = setInterval(updateLastSyncTime, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSession?.lastSync]);

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

  const handleManualSync = async () => {
    if (!syncFolder) {
      toast.error('Please select a sync folder first');
      return;
    }

    setIsManualSyncing(true);

    try {
      await workbenchStore.syncFiles();
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Manual sync failed');
    } finally {
      setIsManualSyncing(false);
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
      {/* Sync Status Bar */}
      <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg flex items-center justify-between border border-bolt-elements-borderColor/20">
        <div className="flex items-center gap-4">
          <div className={`w-2.5 h-2.5 rounded-full ${syncFolder ? 'bg-green-400' : 'bg-amber-400'}`} />
          <div>
            <div className="font-medium text-white">Sync Status</div>
            <div className="text-sm text-gray-400">
              {syncFolder ? 'Connected' : 'Not connected'} {lastSyncTime && `• Last sync: ${lastSyncTime}`}
            </div>
          </div>
        </div>
        <PanelHeaderButton
          onClick={handleManualSync}
          disabled={!syncFolder || isManualSyncing}
          className={`flex items-center gap-2 ${isManualSyncing ? 'animate-pulse' : ''}`}
        >
          {isManualSyncing ? (
            <>
              <div className="i-svg-spinners:180-ring-with-bg w-4 h-4" />
              Syncing...
            </>
          ) : (
            <>
              <div className="i-ph:arrows-clockwise" />
              Sync Now
            </>
          )}
        </PanelHeaderButton>
      </div>

      {/* Sync Controls */}
      <div className="bg-bolt-elements-background-depth-2 p-4 rounded-lg space-y-4 border border-bolt-elements-borderColor/10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Sync Location</h3>
          <PanelHeaderButton onClick={handleSelectFolder} className="flex items-center gap-2">
            <div className="i-ph:folder-simple" />
            {syncFolder ? 'Change Folder' : 'Select Folder'}
          </PanelHeaderButton>
        </div>

        <div className="flex flex-col gap-2">
          {syncFolder && (
            <div className="text-sm bg-bolt-elements-background-depth-3 p-3 rounded flex items-center justify-between border border-bolt-elements-borderColor/10">
              <div className="flex items-center gap-2">
                <div className="i-ph:folder-open text-blue-400" />
                <span className="text-white">{syncFolder.name}</span>
              </div>
              <IconButton
                icon="i-ph:x"
                onClick={() => workbenchStore.setSyncFolder(null)}
                title="Clear sync folder"
                className="hover:text-red-400 transition-colors"
              />
            </div>
          )}
        </div>

        {currentSession?.projectFolder && (
          <div className="text-sm mt-4">
            <div className="font-medium text-white mb-2">Current Project</div>
            <div className="bg-bolt-elements-background-depth-3 p-3 rounded flex items-center gap-2 border border-bolt-elements-borderColor/10">
              <div className="i-ph:folder-notch text-purple-400" />
              <span className="text-white">{currentSession.projectFolder}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="bg-bolt-elements-background-depth-2 p-4 rounded-lg space-y-6 border border-bolt-elements-borderColor/10">
        <h3 className="text-lg font-medium text-white">Sync Settings</h3>

        <div className="space-y-6">
          {/* Auto Sync Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <div className="i-ph:clock text-blue-400" />
                Auto Sync
              </div>
              <div className="text-sm text-gray-400">Automatically sync files at regular intervals</div>
            </div>
            <Switch
              checked={syncSettings.autoSync}
              onCheckedChange={(checked) => handleSaveSettings({ autoSync: checked })}
            />
          </div>

          {syncSettings.autoSync && (
            <div className="pl-4 border-l-2 border-bolt-elements-borderColor/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Sync Interval</div>
                  <div className="text-sm text-gray-400">How often to automatically sync files</div>
                </div>
                <select
                  value={syncSettings.autoSyncInterval}
                  onChange={(e) => handleSaveSettings({ autoSyncInterval: parseInt(e.target.value, 10) })}
                  className="w-32 px-3 py-1.5 border border-bolt-elements-borderColor/20 rounded bg-bolt-elements-background-depth-3 text-white hover:border-bolt-elements-borderColor/40 focus:border-bolt-elements-borderColor/60 transition-colors"
                >
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>
          )}

          {/* Sync on Save Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <div className="i-ph:floppy-disk text-green-400" />
                Sync on Save
              </div>
              <div className="text-sm text-gray-400">Automatically sync when files are saved</div>
            </div>
            <Switch
              checked={syncSettings.syncOnSave}
              onCheckedChange={(checked) => handleSaveSettings({ syncOnSave: checked })}
            />
          </div>

          {/* Sync Mode Section */}
          <div className="space-y-2">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <div className="i-ph:gear text-yellow-400" />
                Sync Mode
              </div>
              <div className="text-sm text-gray-400">How to handle existing files during sync</div>
            </div>
            <select
              value={syncSettings.syncMode}
              onChange={(e) => handleSaveSettings({ syncMode: e.target.value as 'ask' | 'overwrite' | 'skip' })}
              className="w-full px-3 py-2 border border-bolt-elements-borderColor/20 rounded bg-bolt-elements-background-depth-3 text-white hover:border-bolt-elements-borderColor/40 focus:border-bolt-elements-borderColor/60 transition-colors"
            >
              <option value="ask">Ask before overwriting</option>
              <option value="overwrite">Always overwrite</option>
              <option value="skip">Skip existing files</option>
            </select>
          </div>

          {/* Exclude Patterns Section */}
          <div className="space-y-3">
            <div>
              <div className="font-medium text-white flex items-center gap-2">
                <div className="i-ph:prohibit text-red-400" />
                Exclude Patterns
              </div>
              <div className="text-sm text-gray-400">Files and folders to exclude from sync</div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={excludePattern}
                onChange={(e) => setExcludePattern(e.target.value)}
                placeholder="e.g., *.log, node_modules/**"
                className="flex-1 px-3 py-2 border border-bolt-elements-borderColor/20 rounded bg-bolt-elements-background-depth-3 text-white placeholder:text-gray-500 hover:border-bolt-elements-borderColor/40 focus:border-bolt-elements-borderColor/60 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && excludePattern) {
                    handleAddExcludePattern();
                  }
                }}
              />
              <PanelHeaderButton
                onClick={handleAddExcludePattern}
                disabled={!excludePattern}
                className="flex items-center gap-2"
              >
                <div className="i-ph:plus" />
                Add
              </PanelHeaderButton>
            </div>
            <div className="space-y-2">
              {syncSettings.excludePatterns.map((pattern) => (
                <div
                  key={pattern}
                  className="flex items-center justify-between bg-bolt-elements-background-depth-3 px-3 py-2 rounded group hover:bg-bolt-elements-background-depth-4 transition-colors border border-bolt-elements-borderColor/10"
                >
                  <span className="text-sm font-mono text-white">{pattern}</span>
                  <IconButton
                    icon="i-ph:x"
                    onClick={() => handleRemoveExcludePattern(pattern)}
                    title="Remove pattern"
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Statistics */}
      <div className="border-t border-bolt-elements-borderColor/20 pt-6">
        <SyncStats />
      </div>
    </div>
  );
}
