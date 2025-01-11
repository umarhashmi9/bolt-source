import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { SyncHistoryEntry } from '~/types/sync';
import { useEffect, useState } from 'react';

export default function SyncStats() {
  const currentSession = useStore(workbenchStore.currentSession);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);

  useEffect(() => {
    // Load sync history from localStorage
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    setSyncHistory(history);
  }, []);

  // Update history when new syncs happen
  useEffect(() => {
    if (currentSession?.history) {
      setSyncHistory((prev) => {
        const newHistory = [...prev];

        for (const entry of currentSession.history) {
          if (!newHistory.some((h) => h.id === entry.id)) {
            newHistory.push(entry);
          }
        }

        return newHistory.slice(-100); // Keep last 100 entries
      });
    }
  }, [currentSession?.history]);

  if (!syncHistory.length) {
    return <div className="text-sm text-gray-500 italic">No sync history available yet</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Sync Statistics</h3>

      {/* Latest Sync Summary */}
      {syncHistory.length > 0 && (
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Latest Sync</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Project:</div>
            <div>{syncHistory[syncHistory.length - 1].projectName}</div>
            <div>Files:</div>
            <div>{syncHistory[syncHistory.length - 1].statistics.totalFiles}</div>
            <div>Size:</div>
            <div>{(syncHistory[syncHistory.length - 1].statistics.totalSize / (1024 * 1024)).toFixed(2)} MB</div>
            <div>Duration:</div>
            <div>{(syncHistory[syncHistory.length - 1].statistics.duration / 1000).toFixed(1)}s</div>
            <div>Status:</div>
            <div
              className={
                syncHistory[syncHistory.length - 1].status === 'success'
                  ? 'text-green-500'
                  : syncHistory[syncHistory.length - 1].status === 'partial'
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }
            >
              {syncHistory[syncHistory.length - 1].status.charAt(0).toUpperCase() +
                syncHistory[syncHistory.length - 1].status.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      <div>
        <h4 className="font-medium mb-2">History</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {syncHistory
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.id}
                className="bg-bolt-elements-background-depth-1 p-2 rounded text-sm flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-medium">{entry.projectName}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleString()} •{entry.statistics.totalFiles} files •
                    {(entry.statistics.totalSize / (1024 * 1024)).toFixed(2)} MB •
                    {(entry.statistics.duration / 1000).toFixed(1)}s
                  </div>
                </div>
                <div
                  className={
                    entry.status === 'success'
                      ? 'text-green-500'
                      : entry.status === 'partial'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                  }
                >
                  <div
                    className={
                      entry.status === 'success'
                        ? 'i-ph:check-circle'
                        : entry.status === 'partial'
                          ? 'i-ph:warning-circle'
                          : 'i-ph:x-circle'
                    }
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
