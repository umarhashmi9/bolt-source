import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { PanelHeaderButton } from '~/components/ui/PanelHeaderButton';
import { useState, useEffect } from 'react';
import SyncStats from './SyncStats';
import { classNames } from '~/utils/classNames';
import { IconButton } from '~/components/ui/IconButton';

export default function SyncTab() {
  const syncFolder = useStore(workbenchStore.syncFolder);
  const syncSettings = useStore(workbenchStore.syncSettings);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const handleSelectFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await workbenchStore.setSyncFolder(handle);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Failed to select sync folder:', error);
    }
  };

  const handleManualSync = async () => {
    if (!syncFolder) {
      return;
    }

    try {
      setIsManualSyncing(true);
      await workbenchStore.syncFiles();
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSaveSettings = (settings: Partial<typeof syncSettings>) => {
    workbenchStore.saveSyncSettings({
      ...syncSettings,
      ...settings,
    });
  };

  useEffect(() => {
    if (!workbenchStore.currentSession.get()?.lastSync) {
      return undefined;
    }

    const updateLastSyncTime = () => {
      const lastSync = workbenchStore.currentSession.get()?.lastSync;

      if (!lastSync) {
        return;
      }

      const now = Date.now();
      const diff = now - lastSync;

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

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg border border-bolt-elements-borderColor/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Sync Controls</h3>
          <div className="flex items-center gap-2">
            <PanelHeaderButton
              onClick={handleSelectFolder}
              className="text-sm px-3 py-1.5 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text transition-all rounded-md flex items-center gap-1.5"
            >
              <div className="i-ph:folder-simple-plus" />
              {syncFolder ? 'Change Folder' : 'Select Folder'}
            </PanelHeaderButton>
            {syncFolder && (
              <PanelHeaderButton
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="text-sm px-3 py-1.5 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-md flex items-center gap-1.5"
              >
                <div className={classNames('i-ph:arrows-clockwise', { 'animate-spin': isManualSyncing })} />
                {isManualSyncing ? 'Syncing...' : 'Sync Now'}
              </PanelHeaderButton>
            )}
          </div>
        </div>

        {syncFolder ? (
          <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
            <div className="i-ph:folder text-bolt-elements-textTertiary" />
            <span className="truncate">{syncFolder.name}</span>
            {lastSyncTime && (
              <>
                <span>•</span>
                <span>Last synced {lastSyncTime}</span>
              </>
            )}
          </div>
        ) : (
          <div className="text-sm text-bolt-elements-textSecondary">No sync folder selected</div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="bg-bolt-elements-background-depth-3 p-4 rounded-lg border border-bolt-elements-borderColor/10">
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">Sync Settings</h3>
        <div className="space-y-4">
          {/* Auto Sync */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-bolt-elements-textPrimary">Auto Sync</div>
              <div className="text-xs text-bolt-elements-textSecondary mt-0.5">Automatically sync files when saved</div>
            </div>
            <IconButton
              onClick={() => handleSaveSettings({ syncOnSave: !syncSettings.syncOnSave })}
              className={classNames(
                'text-xl transition-colors',
                syncSettings.syncOnSave
                  ? 'text-green-400 hover:text-green-500'
                  : 'text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary',
              )}
            >
              <div className={syncSettings.syncOnSave ? 'i-ph:check-square-fill' : 'i-ph:square'} />
            </IconButton>
          </div>

          {/* Sync Interval */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-bolt-elements-textPrimary">Sync Interval</div>
              <div className="text-xs text-bolt-elements-textSecondary mt-0.5">
                How often to check for changes (in seconds)
              </div>
            </div>
            <input
              type="number"
              min="1"
              max="3600"
              value={syncSettings.autoSyncInterval}
              onChange={(e) => {
                const value = Math.max(1, Math.min(3600, parseInt(e.target.value) || 1));
                handleSaveSettings({ autoSyncInterval: value });
              }}
              className="w-24 text-sm px-3 py-1.5 bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20 rounded-md text-bolt-elements-textPrimary focus:border-bolt-elements-borderColor/60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Sync History */}
      <SyncStats />
    </div>
  );
}
