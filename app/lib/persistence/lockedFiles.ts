import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LockedFiles');

// Key for storing locked files in localStorage
export const LOCKED_FILES_KEY = 'bolt.lockedFiles';

export type LockMode = 'full' | 'scoped';

export interface LockedItem {
  chatId: string; // Chat ID to scope locks to a specific project
  path: string;
  lockMode: LockMode;
  isFolder: boolean; // Indicates if this is a folder lock
}

/**
 * Save locked items to localStorage
 */
export function saveLockedItems(items: LockedItem[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCKED_FILES_KEY, JSON.stringify(items));
    }
  } catch (error) {
    logger.error('Failed to save locked items to localStorage', error);
  }
}

/**
 * Get locked items from localStorage
 */
export function getLockedItems(): LockedItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const lockedItemsJson = localStorage.getItem(LOCKED_FILES_KEY);

      if (lockedItemsJson) {
        const items = JSON.parse(lockedItemsJson);

        // Handle legacy format (without isFolder property)
        return items.map((item: any) => ({
          ...item,
          isFolder: item.isFolder !== undefined ? item.isFolder : false,
        }));
      }
    }

    return [];
  } catch (error) {
    logger.error('Failed to get locked items from localStorage', error);
    return [];
  }
}

/**
 * Add a file or folder to the locked items list
 * @param chatId The chat ID to scope the lock to
 * @param path The path of the file or folder to lock
 * @param lockMode The type of lock to apply
 * @param isFolder Whether this is a folder lock
 */
export function addLockedItem(chatId: string, path: string, lockMode: LockMode, isFolder: boolean = false): void {
  const lockedItems = getLockedItems();

  // Remove any existing entry for this path in this chat
  const filteredItems = lockedItems.filter((item) => !(item.chatId === chatId && item.path === path));

  // Add the new entry
  filteredItems.push({ chatId, path, lockMode, isFolder });

  // Save the updated list
  saveLockedItems(filteredItems);
}

/**
 * Add a file to the locked items list (for backward compatibility)
 */
export function addLockedFile(chatId: string, filePath: string, lockMode: LockMode): void {
  addLockedItem(chatId, filePath, lockMode, false);
}

/**
 * Add a folder to the locked items list
 */
export function addLockedFolder(chatId: string, folderPath: string, lockMode: LockMode): void {
  addLockedItem(chatId, folderPath, lockMode, true);
}

/**
 * Remove an item from the locked items list
 * @param chatId The chat ID the lock belongs to
 * @param path The path of the item to unlock
 */
export function removeLockedItem(chatId: string, path: string): void {
  const lockedItems = getLockedItems();

  // Filter out the item to remove for this specific chat
  const filteredItems = lockedItems.filter((item) => !(item.chatId === chatId && item.path === path));

  // Save the updated list
  saveLockedItems(filteredItems);
}

/**
 * Remove a file from the locked items list (for backward compatibility)
 */
export function removeLockedFile(chatId: string, filePath: string): void {
  removeLockedItem(chatId, filePath);
}

/**
 * Remove a folder from the locked items list
 */
export function removeLockedFolder(chatId: string, folderPath: string): void {
  removeLockedItem(chatId, folderPath);
}

/**
 * Check if a path is directly locked (not considering parent folders)
 * @param chatId The chat ID to check locks for
 * @param path The path to check
 * @returns Object with locked status, lock mode, and whether it's a folder lock
 */
export function isPathDirectlyLocked(
  chatId: string,
  path: string,
): { locked: boolean; lockMode?: LockMode; isFolder?: boolean } {
  const lockedItems = getLockedItems();
  const lockedItem = lockedItems.find((item) => item.chatId === chatId && item.path === path);

  if (lockedItem) {
    return { locked: true, lockMode: lockedItem.lockMode, isFolder: lockedItem.isFolder };
  }

  return { locked: false };
}

/**
 * Check if a file is locked, either directly or by a parent folder
 * @param chatId The chat ID to check locks for
 * @param filePath The path of the file to check
 * @returns Object with locked status, lock mode, and the path that caused the lock
 */
export function isFileLocked(
  chatId: string,
  filePath: string,
): { locked: boolean; lockMode?: LockMode; lockedBy?: string } {
  const lockedItems = getLockedItems();

  // First check if the file itself is locked
  const directLock = lockedItems.find((item) => item.chatId === chatId && item.path === filePath && !item.isFolder);

  if (directLock) {
    return { locked: true, lockMode: directLock.lockMode, lockedBy: filePath };
  }

  // Then check if any parent folder is locked
  const pathParts = filePath.split('/');
  let currentPath = '';

  for (let i = 0; i < pathParts.length - 1; i++) {
    currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];

    const folderLock = lockedItems.find((item) => item.chatId === chatId && item.path === currentPath && item.isFolder);

    if (folderLock) {
      return { locked: true, lockMode: folderLock.lockMode, lockedBy: currentPath };
    }
  }

  return { locked: false };
}

/**
 * Check if a folder is locked
 * @param chatId The chat ID to check locks for
 * @param folderPath The path of the folder to check
 * @returns Object with locked status and lock mode
 */
export function isFolderLocked(
  chatId: string,
  folderPath: string,
): { locked: boolean; lockMode?: LockMode; lockedBy?: string } {
  const lockedItems = getLockedItems();

  // First check if the folder itself is locked
  const directLock = lockedItems.find((item) => item.chatId === chatId && item.path === folderPath && item.isFolder);

  if (directLock) {
    return { locked: true, lockMode: directLock.lockMode, lockedBy: folderPath };
  }

  // Then check if any parent folder is locked
  const pathParts = folderPath.split('/');
  let currentPath = '';

  for (let i = 0; i < pathParts.length - 1; i++) {
    currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];

    const folderLock = lockedItems.find((item) => item.chatId === chatId && item.path === currentPath && item.isFolder);

    if (folderLock) {
      return { locked: true, lockMode: folderLock.lockMode, lockedBy: currentPath };
    }
  }

  return { locked: false };
}

/**
 * Get all locked items for a specific chat
 * @param chatId The chat ID to get locks for
 * @returns Array of locked items for the specified chat
 */
export function getLockedItemsForChat(chatId: string): LockedItem[] {
  const lockedItems = getLockedItems();
  return lockedItems.filter((item) => item.chatId === chatId);
}

/**
 * Get all locked files for a specific chat (for backward compatibility)
 */
export function getLockedFilesForChat(chatId: string): LockedItem[] {
  const lockedItems = getLockedItems();
  return lockedItems.filter((item) => item.chatId === chatId && !item.isFolder);
}

/**
 * Get all locked folders for a specific chat
 */
export function getLockedFoldersForChat(chatId: string): LockedItem[] {
  const lockedItems = getLockedItems();
  return lockedItems.filter((item) => item.chatId === chatId && item.isFolder);
}

/**
 * Check if a path is within a locked folder
 * @param chatId The chat ID to check locks for
 * @param path The path to check
 * @returns Object with locked status, lock mode, and the folder that caused the lock
 */
export function isPathInLockedFolder(
  chatId: string,
  path: string,
): { locked: boolean; lockMode?: LockMode; lockedBy?: string } {
  const lockedFolders = getLockedFoldersForChat(chatId);

  for (const folder of lockedFolders) {
    // Check if the path starts with the folder path and has a / or is exactly the folder path
    if (path === folder.path || path.startsWith(`${folder.path}/`)) {
      return { locked: true, lockMode: folder.lockMode, lockedBy: folder.path };
    }
  }

  return { locked: false };
}

/**
 * Migrate legacy locks (without chatId or isFolder) to the new format
 * @param currentChatId The current chat ID to assign to legacy locks
 */
export function migrateLegacyLocks(currentChatId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const lockedItemsJson = localStorage.getItem(LOCKED_FILES_KEY);

      if (lockedItemsJson) {
        const lockedItems = JSON.parse(lockedItemsJson);

        if (Array.isArray(lockedItems)) {
          let hasLegacyItems = false;

          // Check if any locks are in the old format (missing chatId or isFolder)
          const updatedItems = lockedItems.map((item) => {
            const needsUpdate = !item.chatId || item.isFolder === undefined;

            if (needsUpdate) {
              hasLegacyItems = true;
              return {
                ...item,
                chatId: item.chatId || currentChatId,
                isFolder: item.isFolder !== undefined ? item.isFolder : false,
              };
            }

            return item;
          });

          // Only save if we found and updated legacy items
          if (hasLegacyItems) {
            saveLockedItems(updatedItems);
            logger.info(`Migrated ${updatedItems.length} legacy locks to chat ID: ${currentChatId}`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Failed to migrate legacy locks', error);
  }
}
