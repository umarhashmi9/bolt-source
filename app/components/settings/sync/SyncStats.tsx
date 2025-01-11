import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { SyncHistoryEntry } from '~/types/sync';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export default function SyncStats() {
  const currentSession = useStore(workbenchStore.currentSession);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');

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

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const getStatusIcon = (status: 'success' | 'partial' | 'failed') => {
    switch (status) {
      case 'success':
        return <div className="i-ph:check-circle text-green-500" />;
      case 'partial':
        return <div className="i-ph:warning-circle text-yellow-500" />;
      case 'failed':
        return <div className="i-ph:x-circle text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    }

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }

    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFilteredHistory = () => {
    const now = Date.now();

    return syncHistory.filter((entry) => {
      switch (selectedTimeRange) {
        case '24h':
          return now - entry.timestamp < 24 * 60 * 60 * 1000;
        case '7d':
          return now - entry.timestamp < 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return now - entry.timestamp < 30 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  };

  const filteredHistory = getFilteredHistory();
  const totalSyncs = filteredHistory.length;
  const totalFilesSynced = filteredHistory.reduce((sum, entry) => sum + entry.statistics.totalFiles, 0);
  const totalDataSynced = filteredHistory.reduce((sum, entry) => sum + entry.statistics.totalSize, 0);
  const averageDuration =
    totalSyncs > 0 ? filteredHistory.reduce((sum, entry) => sum + entry.statistics.duration, 0) / totalSyncs / 1000 : 0;

  if (!syncHistory.length) {
    return (
      <div className="bg-bolt-elements-background-depth-1 p-6 rounded-lg text-center">
        <div className="i-ph:cloud-slash text-4xl text-gray-400 mx-auto mb-4" />
        <div className="text-lg font-medium mb-2">No Sync History</div>
        <div className="text-sm text-gray-400">Start syncing your files to see statistics here</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sync Statistics</h3>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as typeof selectedTimeRange)}
          className="px-3 py-1 border border-bolt-elements-borderColor rounded bg-bolt-elements-background-depth-2"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Total Syncs</div>
          <div className="text-2xl font-medium">{totalSyncs}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Files Synced</div>
          <div className="text-2xl font-medium">{totalFilesSynced}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Data Synced</div>
          <div className="text-2xl font-medium">{formatFileSize(totalDataSynced)}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Avg Duration</div>
          <div className="text-2xl font-medium">{averageDuration.toFixed(1)}s</div>
        </div>
      </div>

      {/* Latest Sync Summary */}
      {filteredHistory.length > 0 && (
        <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <div className="i-ph:clock-clockwise text-blue-400" />
            Latest Sync
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Project:</span>
                <span className="font-medium">{filteredHistory[0].projectName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Time:</span>
                <span>{formatDistanceToNow(filteredHistory[0].timestamp)} ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Files:</span>
                <span>{filteredHistory[0].statistics.totalFiles}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Size:</span>
                <span>{formatFileSize(filteredHistory[0].statistics.totalSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duration:</span>
                <span>{(filteredHistory[0].statistics.duration / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="flex items-center gap-1">
                  {getStatusIcon(filteredHistory[0].status)}
                  <span
                    className={
                      filteredHistory[0].status === 'success'
                        ? 'text-green-500'
                        : filteredHistory[0].status === 'partial'
                          ? 'text-yellow-500'
                          : 'text-red-500'
                    }
                  >
                    {filteredHistory[0].status.charAt(0).toUpperCase() + filteredHistory[0].status.slice(1)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <div className="i-ph:clock-counter-clockwise text-purple-400" />
          History
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {filteredHistory
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.id}
                className="bg-bolt-elements-background-depth-1 p-3 rounded-lg text-sm hover:bg-bolt-elements-background-depth-2 transition-colors"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(entry.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {getStatusIcon(entry.status)}
                      {entry.projectName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(entry.timestamp)} ago • {entry.statistics.totalFiles} files •{' '}
                      {formatFileSize(entry.statistics.totalSize)} • {(entry.statistics.duration / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div
                    className={`i-ph:caret-down transition-transform ${
                      expandedEntries.has(entry.id) ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Expanded Details */}
                {expandedEntries.has(entry.id) && (
                  <div className="mt-3 border-t border-bolt-elements-borderColor pt-3 space-y-2">
                    <div className="text-xs">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <div className="i-ph:files text-blue-400" />
                        Synced Files:
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {entry.files.map((file) => (
                          <div
                            key={file}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <div className="i-ph:file-text text-xs" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <div className="i-ph:identification-badge" />
                      Sync ID: {entry.id}
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
