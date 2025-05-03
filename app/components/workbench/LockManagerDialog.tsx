import { useState, useEffect } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';

interface LockedItem {
  path: string;
  type: 'file' | 'folder';
  lockMode: 'full' | 'scoped';
}

interface LockManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LockManagerDialog({ isOpen, onClose }: LockManagerDialogProps) {
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

    if (isOpen) {
      loadLockedItems();
    }

    // Set up an interval to refresh the list periodically if dialog is open
    let intervalId: NodeJS.Timeout | null = null;

    if (isOpen) {
      intervalId = setInterval(loadLockedItems, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOpen]);

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
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <Dialog className="w-[800px] max-w-[90vw]">
        <div className="p-6 bg-white dark:bg-gray-950 relative z-10">
          <DialogTitle className="flex items-center gap-2">
            <span className="i-ph:lock-simple-duotone text-bolt-elements-textPrimary" />
            Lock Manager
          </DialogTitle>
          <DialogDescription className="mb-4">Manage locked files and folders</DialogDescription>
          <div className="flex flex-col h-full min-h-[400px] max-h-[80vh]">
            <div className="flex flex-wrap items-center gap-2 p-3 mb-3 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 dark:bg-gray-900">
              <div className="flex items-center flex-1 relative min-w-[200px]">
                <span className="absolute left-2 text-bolt-elements-textTertiary">
                  <span className="i-ph:magnifying-glass" />
                </span>
                <input
                  type="text"
                  placeholder="Search locked files and folders..."
                  className="w-full pl-8 pr-2 py-1.5 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorFocus dark:bg-gray-800"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-2 py-1.5 bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary rounded border border-bolt-elements-borderColor focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorFocus dark:bg-gray-800"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All Items</option>
                <option value="files">Files Only</option>
                <option value="folders">Folders Only</option>
              </select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleUnlockSelected}
                  disabled={selectedItems.size === 0}
                >
                  <span className="i-ph:lock-open-duotone" />
                  Unlock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleChangeLockMode('full')}
                  disabled={selectedItems.size === 0}
                >
                  <span className="i-ph:lock-key-duotone" />
                  Full Lock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => handleChangeLockMode('scoped')}
                  disabled={selectedItems.size === 0}
                >
                  <span className="i-ph:lock-simple-open-duotone" />
                  Scoped Lock
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto modern-scrollbar border rounded-md border-bolt-elements-borderColor dark:border-gray-700">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left border-b border-bolt-elements-borderColor dark:border-gray-700">
                      <Checkbox
                        checked={selectedItems.size > 0 && selectedItems.size === filteredAndSortedItems.length}
                        onCheckedChange={handleSelectAll}
                        className="data-[state=checked]:bg-bolt-elements-item-backgroundAccent data-[state=checked]:border-bolt-elements-item-backgroundAccent"
                      />
                    </th>
                    <th
                      className="p-3 text-left border-b border-bolt-elements-borderColor dark:border-gray-700 cursor-pointer hover:text-bolt-elements-textPrimary"
                      onClick={() => handleSort('path')}
                    >
                      <div className="flex items-center">
                        Path
                        {sortBy === 'path' && (
                          <span className="ml-1 text-bolt-elements-item-contentAccent">
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
                      className="p-3 text-left border-b border-bolt-elements-borderColor dark:border-gray-700 cursor-pointer hover:text-bolt-elements-textPrimary"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortBy === 'type' && (
                          <span className="ml-1 text-bolt-elements-item-contentAccent">
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
                      className="p-3 text-left border-b border-bolt-elements-borderColor dark:border-gray-700 cursor-pointer hover:text-bolt-elements-textPrimary"
                      onClick={() => handleSort('lockMode')}
                    >
                      <div className="flex items-center">
                        Lock Mode
                        {sortBy === 'lockMode' && (
                          <span className="ml-1 text-bolt-elements-item-contentAccent">
                            {sortDirection === 'asc' ? (
                              <span className="i-ph:sort-ascending" />
                            ) : (
                              <span className="i-ph:sort-descending" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="p-3 text-left border-b border-bolt-elements-borderColor dark:border-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950">
                  {filteredAndSortedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-bolt-elements-textTertiary">
                        <div className="flex flex-col items-center py-8">
                          <div className="w-16 h-16 rounded-full bg-bolt-elements-background-depth-2 dark:bg-gray-800 flex items-center justify-center mb-4">
                            <span className="i-ph:lock-open-duotone text-4xl text-bolt-elements-textTertiary" />
                          </div>
                          <p className="text-lg font-medium text-bolt-elements-textSecondary">No locked items found</p>
                          <p className="text-sm mt-1 text-bolt-elements-textTertiary max-w-md text-center">
                            Lock files or folders to protect them from modifications by the AI assistant
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedItems.map((item) => (
                      <tr
                        key={item.path}
                        className="border-b border-bolt-elements-borderColor dark:border-gray-700 hover:bg-bolt-elements-background-depth-1 dark:hover:bg-gray-900"
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedItems.has(item.path)}
                            onCheckedChange={() => handleSelectItem(item.path)}
                            className="data-[state=checked]:bg-bolt-elements-item-backgroundAccent data-[state=checked]:border-bolt-elements-item-backgroundAccent"
                          />
                        </td>
                        <td className="p-3 truncate max-w-[300px]" title={item.path}>
                          <div className="flex items-center">
                            <span
                              className={classNames(
                                'mr-2 shrink-0 text-bolt-elements-textTertiary text-lg',
                                item.type === 'file' ? 'i-ph:file-text-duotone' : 'i-ph:folder-duotone',
                              )}
                            />
                            <span className="truncate text-bolt-elements-textPrimary">{item.path}</span>
                          </div>
                        </td>
                        <td className="p-3 text-bolt-elements-textSecondary">
                          {item.type === 'file' ? 'File' : 'Folder'}
                        </td>
                        <td className="p-3">
                          <span
                            className={classNames(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              item.lockMode === 'full'
                                ? 'bg-red-500/10 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
                            )}
                          >
                            <span
                              className={classNames(
                                'mr-1',
                                item.lockMode === 'full' ? 'i-ph:lock-key-duotone' : 'i-ph:lock-simple-open-duotone',
                              )}
                            />
                            {item.lockMode === 'full' ? 'Full' : 'Scoped'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 h-7 px-2 text-xs"
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
                              <span className="i-ph:lock-open-duotone" />
                              Unlock
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 h-7 px-2 text-xs"
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
                              <span className="i-ph:arrows-clockwise-duotone" />
                              Toggle Mode
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 mt-3 border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 dark:bg-gray-900 text-sm text-bolt-elements-textTertiary flex justify-between items-center rounded-b-md">
              <div className="flex items-center">
                <span className="i-ph:info-duotone mr-1.5 text-bolt-elements-textTertiary" />
                {filteredAndSortedItems.length} item(s) • {selectedItems.size} selected
              </div>
              {selectedItems.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                  onClick={() => setSelectedItems(new Set())}
                >
                  <span className="i-ph:x-circle-duotone mr-1" />
                  Clear selection
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
}
