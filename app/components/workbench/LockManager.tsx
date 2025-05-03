import { useState, useEffect } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

interface LockedItem {
  path: string;
  type: 'file' | 'folder';
  lockMode: 'full' | 'scoped';
}

export function LockManager() {
  const [lockedItems, setLockedItems] = useState<LockedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'files' | 'folders'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'path' | 'type' | 'lockMode'>('path');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Load locked items
  useEffect(() => {
    const loadLockedItems = () => {
      // We don't need to filter by chat ID here as we want to show all locked files
      const items: LockedItem[] = [];

      // Get all files and folders from the workbench store
      const allFiles = workbenchStore.files.get();

      // Check each file/folder for locks
      Object.entries(allFiles).forEach(([path, item]) => {
        if (!item) {
          return;
        }

        if (item.type === 'file' && item.locked) {
          items.push({
            path,
            type: 'file',
            lockMode: item.lockMode || 'full',
          });
        } else if ((item.type === 'folder' || item.type === 'directory') && item.locked) {
          items.push({
            path,
            type: 'folder',
            lockMode: item.lockMode || 'full',
          });
        }
      });

      setLockedItems(items);
    };

    loadLockedItems();

    // Set up an interval to refresh the list periodically
    const intervalId = setInterval(loadLockedItems, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Filter and sort the locked items
  const filteredAndSortedItems = lockedItems
    .filter((item) => {
      // Apply type filter
      if (filter === 'files' && item.type !== 'file') {
        return false;
      }

      if (filter === 'folders' && item.type !== 'folder') {
        return false;
      }

      // Apply search filter
      if (searchTerm && !item.path.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0;

      if (sortBy === 'path') {
        comparison = a.path.localeCompare(b.path);
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortBy === 'lockMode') {
        comparison = a.lockMode.localeCompare(b.lockMode);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Handle unlocking selected items
  const handleUnlockSelected = () => {
    if (selectedItems.size === 0) {
      workbenchStore.actionAlert.set({
        type: 'info',
        title: 'No items selected',
        description: 'Please select at least one item to unlock',
        content: '',
      });
      return;
    }

    selectedItems.forEach((path) => {
      const item = lockedItems.find((i) => i.path === path);

      if (!item) {
        return;
      }

      if (item.type === 'file') {
        workbenchStore.unlockFile(path);
      } else {
        workbenchStore.unlockFolder(path);
      }
    });

    workbenchStore.actionAlert.set({
      type: 'success',
      title: 'Items Unlocked',
      description: `Successfully unlocked ${selectedItems.size} item(s)`,
      content: '',
    });
    setSelectedItems(new Set());
  };

  // Handle changing lock mode for selected items
  const handleChangeLockMode = (mode: 'full' | 'scoped') => {
    if (selectedItems.size === 0) {
      workbenchStore.actionAlert.set({
        type: 'info',
        title: 'No items selected',
        description: 'Please select at least one item to change lock mode',
        content: '',
      });
      return;
    }

    selectedItems.forEach((path) => {
      const item = lockedItems.find((i) => i.path === path);

      if (!item) {
        return;
      }

      // First unlock the item
      if (item.type === 'file') {
        workbenchStore.unlockFile(path);

        // Then lock it with the new mode
        workbenchStore.lockFile(path, mode);
      } else {
        workbenchStore.unlockFolder(path);

        // Then lock it with the new mode
        workbenchStore.lockFolder(path, mode);
      }
    });

    workbenchStore.actionAlert.set({
      type: 'success',
      title: 'Lock Mode Changed',
      description: `Changed lock mode to ${mode} for ${selectedItems.size} item(s)`,
      content: '',
    });
  };

  // Handle selecting/deselecting all items
  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      // If all are selected, deselect all
      setSelectedItems(new Set());
    } else {
      // Otherwise, select all filtered items
      setSelectedItems(new Set(filteredAndSortedItems.map((item) => item.path)));
    }
  };

  // Handle selecting/deselecting a single item
  const handleSelectItem = (path: string) => {
    const newSelectedItems = new Set(selectedItems);

    if (newSelectedItems.has(path)) {
      newSelectedItems.delete(path);
    } else {
      newSelectedItems.add(path);
    }

    setSelectedItems(newSelectedItems);
  };

  // Handle sorting
  const handleSort = (column: 'path' | 'type' | 'lockMode') => {
    if (sortBy === column) {
      // If already sorting by this column, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, sort by this column in ascending order
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-2 py-1 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
        <div className="flex items-center flex-1 relative">
          <span className="absolute left-2 text-bolt-elements-textTertiary">
            <span className="i-ph:magnifying-glass text-xs" />
          </span>
          <input
            type="text"
            placeholder="Search locked files..."
            className="w-full text-xs pl-6 pr-2 py-0.5 h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="ml-1 text-xs px-1 py-0.5 h-6 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="files">Files</option>
          <option value="folders">Folders</option>
        </select>
        <div className="flex ml-1 gap-1">
          <button
            className={classNames(
              'text-xs px-1.5 py-0.5 h-6 rounded border flex items-center',
              selectedItems.size === 0
                ? 'text-bolt-elements-textTertiary bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor cursor-not-allowed'
                : 'text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3',
            )}
            onClick={handleUnlockSelected}
            disabled={selectedItems.size === 0}
          >
            <span className="i-ph:lock-open-duotone text-xs mr-1" />
            Unlock
          </button>
          <button
            className={classNames(
              'text-xs px-1.5 py-0.5 h-6 rounded border flex items-center',
              selectedItems.size === 0
                ? 'text-bolt-elements-textTertiary bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor cursor-not-allowed'
                : 'text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3',
            )}
            onClick={() => handleChangeLockMode('full')}
            disabled={selectedItems.size === 0}
          >
            <span className="i-ph:lock-key-duotone text-xs mr-1" />
            Full
          </button>
          <button
            className={classNames(
              'text-xs px-1.5 py-0.5 h-6 rounded border flex items-center',
              selectedItems.size === 0
                ? 'text-bolt-elements-textTertiary bg-bolt-elements-background-depth-1 border-bolt-elements-borderColor cursor-not-allowed'
                : 'text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3',
            )}
            onClick={() => handleChangeLockMode('scoped')}
            disabled={selectedItems.size === 0}
          >
            <span className="i-ph:lock-simple-open-duotone text-xs mr-1" />
            Scoped
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto modern-scrollbar">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary">
            <tr>
              <th className="px-1 py-0.5 text-left border-b border-bolt-elements-borderColor">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === filteredAndSortedItems.length}
                  onChange={handleSelectAll}
                  className="w-3 h-3 rounded border-bolt-elements-borderColor"
                />
              </th>
              <th
                className="px-1 py-0.5 text-left border-b border-bolt-elements-borderColor cursor-pointer hover:text-bolt-elements-textPrimary"
                onClick={() => handleSort('path')}
              >
                <div className="flex items-center">
                  Path
                  {sortBy === 'path' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? (
                        <span className="i-ph:sort-ascending" />
                      ) : (
                        <span className="i-ph:sort-descending" />
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-1 py-0.5 text-left border-b border-bolt-elements-borderColor cursor-pointer hover:text-bolt-elements-textPrimary"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {sortBy === 'type' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? (
                        <span className="i-ph:sort-ascending" />
                      ) : (
                        <span className="i-ph:sort-descending" />
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th
                className="px-1 py-0.5 text-left border-b border-bolt-elements-borderColor cursor-pointer hover:text-bolt-elements-textPrimary"
                onClick={() => handleSort('lockMode')}
              >
                <div className="flex items-center">
                  Lock
                  {sortBy === 'lockMode' && (
                    <span className="ml-1 text-xs">
                      {sortDirection === 'asc' ? (
                        <span className="i-ph:sort-ascending" />
                      ) : (
                        <span className="i-ph:sort-descending" />
                      )}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-1 py-0.5 text-left border-b border-bolt-elements-borderColor">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-2 text-center text-bolt-elements-textTertiary">
                  <div className="flex items-center justify-center gap-2">
                    <span className="i-ph:lock-open-duotone text-lg opacity-50" />
                    <span>No locked items found</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedItems.map((item) => (
                <tr
                  key={item.path}
                  className="border-b border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1"
                >
                  <td className="px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.path)}
                      onChange={() => handleSelectItem(item.path)}
                      className="w-3 h-3 rounded border-bolt-elements-borderColor"
                    />
                  </td>
                  <td className="px-1 py-0.5 truncate max-w-[200px]" title={item.path}>
                    <div className="flex items-center">
                      <span
                        className={classNames(
                          'mr-1 shrink-0 text-bolt-elements-textTertiary text-xs',
                          item.type === 'file' ? 'i-ph:file-text-duotone' : 'i-ph:folder-duotone',
                        )}
                      />
                      <span className="truncate">{item.path}</span>
                    </div>
                  </td>
                  <td className="px-1 py-0.5 text-bolt-elements-textSecondary">
                    {item.type === 'file' ? 'File' : 'Folder'}
                  </td>
                  <td className="px-1 py-0.5">
                    <span
                      className={classNames(
                        'inline-flex items-center px-1 rounded-sm text-xs',
                        item.lockMode === 'full' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500',
                      )}
                    >
                      <span
                        className={classNames(
                          'mr-0.5 text-xs',
                          item.lockMode === 'full' ? 'i-ph:lock-key-duotone' : 'i-ph:lock-simple-open-duotone',
                        )}
                      />
                      {item.lockMode === 'full' ? 'Full' : 'Scoped'}
                    </span>
                  </td>
                  <td className="px-1 py-0.5">
                    <div className="flex gap-1">
                      <button
                        className="flex items-center px-1 py-0.5 text-xs bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded hover:bg-bolt-elements-background-depth-3"
                        onClick={() => {
                          if (item.type === 'file') {
                            workbenchStore.unlockFile(item.path);
                          } else {
                            workbenchStore.unlockFolder(item.path);
                          }

                          workbenchStore.actionAlert.set({
                            type: 'success',
                            title: 'Item Unlocked',
                            description: `Successfully unlocked ${item.path}`,
                            content: '',
                          });
                        }}
                      >
                        <span className="i-ph:lock-open-duotone text-xs" />
                      </button>
                      <button
                        className="flex items-center px-1 py-0.5 text-xs bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded hover:bg-bolt-elements-background-depth-3"
                        onClick={() => {
                          // Toggle lock mode
                          const newMode = item.lockMode === 'full' ? 'scoped' : 'full';

                          // First unlock
                          if (item.type === 'file') {
                            workbenchStore.unlockFile(item.path);

                            // Then lock with new mode
                            workbenchStore.lockFile(item.path, newMode);
                          } else {
                            workbenchStore.unlockFolder(item.path);

                            // Then lock with new mode
                            workbenchStore.lockFolder(item.path, newMode);
                          }

                          workbenchStore.actionAlert.set({
                            type: 'success',
                            title: 'Lock Mode Changed',
                            description: `Changed lock mode to ${newMode} for ${item.path}`,
                            content: '',
                          });
                        }}
                      >
                        <span className="i-ph:arrows-clockwise-duotone text-xs" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-2 py-1 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-xs text-bolt-elements-textTertiary flex justify-between items-center">
        <div>
          {filteredAndSortedItems.length} item(s) • {selectedItems.size} selected
        </div>
        {selectedItems.size > 0 && (
          <button
            className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary text-xs"
            onClick={() => setSelectedItems(new Set())}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
