import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import type { SyncHistoryEntry, SyncSession } from '~/types/sync';
import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';

export default function SyncStats() {
  const currentSession = useStore(workbenchStore.currentSession);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [isClearing, setIsClearing] = useState(false);

  // Load initial history from localStorage
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');

      if (Array.isArray(history)) {
        setSyncHistory(history);
      } else {
        console.error('Invalid sync history format in localStorage');
        localStorage.setItem('syncHistory', '[]');
        setSyncHistory([]);
      }
    } catch (error) {
      console.error('Failed to load sync history:', error);
      localStorage.setItem('syncHistory', '[]');
      setSyncHistory([]);
    }
  }, []);

  // Update history when new syncs happen
  useEffect(() => {
    if (currentSession?.history) {
      setSyncHistory((prev) => {
        try {
          const newHistory = [...prev];

          // Add new entries from current session
          for (const entry of currentSession.history) {
            const existingIndex = newHistory.findIndex((h) => h.id === entry.id);

            if (existingIndex === -1) {
              newHistory.push(entry);
            } else {
              // Update existing entry if it has changed
              newHistory[existingIndex] = entry;
            }
          }

          // Sort by timestamp in descending order
          newHistory.sort((a, b) => b.timestamp - a.timestamp);

          // Keep last 100 entries
          const latestHistory = newHistory.slice(0, 100);

          // Save to localStorage
          localStorage.setItem('syncHistory', JSON.stringify(latestHistory));

          return latestHistory;
        } catch (error) {
          console.error('Failed to update sync history:', error);
          return prev;
        }
      });
    }
  }, [currentSession?.history]);

  const handleClearHistory = useCallback(async () => {
    if (isClearing) {
      return;
    }

    if (confirm('Are you sure you want to clear all sync history? This cannot be undone.')) {
      try {
        setIsClearing(true);

        localStorage.setItem('syncHistory', '[]');
        setSyncHistory([]);
        setExpandedEntries(new Set());

        // Clear current session history
        if (currentSession) {
          const clearedSession: SyncSession = {
            ...currentSession,
            id: currentSession.id,
            timestamp: currentSession.timestamp,
            history: [],
            statistics: [],
            files: new Set(),
          };
          await workbenchStore.currentSession.set(clearedSession);
        }

        toast.success('Sync history cleared');
      } catch (error) {
        console.error('Failed to clear sync history:', error);
        toast.error('Failed to clear sync history');
      } finally {
        setIsClearing(false);
      }
    }
  }, [currentSession, isClearing]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const getStatusIcon = useCallback((status: 'success' | 'partial' | 'failed') => {
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
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) {
      return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  const getFilteredHistory = useCallback(() => {
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
  }, [syncHistory, selectedTimeRange]);

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
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Sync History</h3>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as typeof selectedTimeRange)}
            className="px-2 py-1 text-sm border border-bolt-elements-borderColor/20 rounded-md bg-bolt-elements-background-depth-4 text-bolt-elements-textPrimary hover:border-bolt-elements-borderColor/40 focus:border-bolt-elements-borderColor/60 transition-colors"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
            <option value="all">All time</option>
          </select>
        </div>
        <IconButton
          onClick={handleClearHistory}
          disabled={isClearing}
          className={classNames('text-bolt-elements-textSecondary hover:text-red-400 transition-colors', {
            'opacity-50 cursor-not-allowed': isClearing,
          })}
          title="Clear History"
        >
          <div className={classNames('i-ph:trash', { 'animate-pulse': isClearing })} />
        </IconButton>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg border border-bolt-elements-borderColor/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:list-numbers text-blue-400" />
            <div className="text-sm text-bolt-elements-textSecondary">Total Syncs</div>
          </div>
          <div className="text-2xl font-medium text-bolt-elements-textPrimary">{totalSyncs}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg border border-bolt-elements-borderColor/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:files text-purple-400" />
            <div className="text-sm text-bolt-elements-textSecondary">Files Synced</div>
          </div>
          <div className="text-2xl font-medium text-bolt-elements-textPrimary">{totalFilesSynced}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg border border-bolt-elements-borderColor/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:database text-green-400" />
            <div className="text-sm text-bolt-elements-textSecondary">Data Synced</div>
          </div>
          <div className="text-2xl font-medium text-bolt-elements-textPrimary">{formatFileSize(totalDataSynced)}</div>
        </div>
        <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg border border-bolt-elements-borderColor/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="i-ph:timer text-yellow-400" />
            <div className="text-sm text-bolt-elements-textSecondary">Avg Duration</div>
          </div>
          <div className="text-2xl font-medium text-bolt-elements-textPrimary">{averageDuration.toFixed(1)}s</div>
        </div>
      </div>

      {/* Latest Sync Summary */}
      {filteredHistory.length > 0 && (
        <div className="bg-bolt-elements-background-depth-3 p-3 rounded-lg border border-bolt-elements-borderColor/10">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-bolt-elements-textPrimary">
            <div className="i-ph:clock-clockwise text-blue-400" />
            Latest Sync
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="i-ph:folder text-bolt-elements-textTertiary" />
                <span className="text-sm text-bolt-elements-textPrimary truncate">
                  {filteredHistory[0].projectName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="i-ph:clock text-bolt-elements-textTertiary" />
                <span className="text-sm text-bolt-elements-textPrimary">
                  {formatDistanceToNow(filteredHistory[0].timestamp)} ago
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="i-ph:files text-bolt-elements-textTertiary" />
                <span className="text-sm text-bolt-elements-textPrimary">
                  {filteredHistory[0].statistics.totalFiles} files
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="i-ph:database text-bolt-elements-textTertiary" />
                <span className="text-sm text-bolt-elements-textPrimary">
                  {formatFileSize(filteredHistory[0].statistics.totalSize)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="i-ph:timer text-bolt-elements-textTertiary" />
                <span className="text-sm text-bolt-elements-textPrimary">
                  {(filteredHistory[0].statistics.duration / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-bolt-elements-borderColor scrollbar-track-transparent">
        {filteredHistory.map((entry) => (
          <div
            key={entry.id}
            className="bg-bolt-elements-background-depth-3 p-3 rounded-lg text-sm hover:bg-bolt-elements-background-depth-4 transition-colors border border-bolt-elements-borderColor/10"
          >
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(entry.id)}>
              <div className="flex items-center gap-3 flex-1">
                {getStatusIcon(entry.status)}
                <div>
                  <div className="font-medium text-bolt-elements-textPrimary">{entry.projectName}</div>
                  <div className="text-xs text-bolt-elements-textSecondary flex items-center gap-2">
                    <span>{formatDistanceToNow(entry.timestamp)} ago</span>
                    <span>•</span>
                    <span>{entry.statistics.totalFiles} files</span>
                    <span>•</span>
                    <span>{formatFileSize(entry.statistics.totalSize)}</span>
                    <span>•</span>
                    <span>{(entry.statistics.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
              <div
                className={`i-ph:caret-down transition-transform ${expandedEntries.has(entry.id) ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Expanded Details */}
            {expandedEntries.has(entry.id) && (
              <div className="mt-3 border-t border-bolt-elements-borderColor/10 pt-3">
                <div className="text-xs space-y-1">
                  {entry.files.map((file) => (
                    <div
                      key={file}
                      className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors flex items-center gap-2"
                    >
                      <div className="i-ph:file-text text-xs" />
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
