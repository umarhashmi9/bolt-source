import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LockedFiles');

// Key for storing locked files in localStorage
export const LOCKED_FILES_KEY = 'bolt.lockedFiles';

export type LockMode = 'full' | 'scoped';

export interface LockedFile {
  chatId: string; // Chat ID to scope locks to a specific project
  path: string;
  lockMode: LockMode;
}

/**
 * Save locked files to localStorage
 */
export function saveLockedFiles(files: LockedFile[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCKED_FILES_KEY, JSON.stringify(files));
    }
  } catch (error) {
    logger.error('Failed to save locked files to localStorage', error);
  }
}

/**
 * Get locked files from localStorage
 */
export function getLockedFiles(): LockedFile[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const lockedFilesJson = localStorage.getItem(LOCKED_FILES_KEY);

      if (lockedFilesJson) {
        return JSON.parse(lockedFilesJson);
      }
    }

    return [];
  } catch (error) {
    logger.error('Failed to get locked files from localStorage', error);
    return [];
  }
}

/**
 * Add a file to the locked files list
 * @param chatId The chat ID to scope the lock to
 * @param filePath The path of the file to lock
 * @param lockMode The type of lock to apply
 */
export function addLockedFile(chatId: string, filePath: string, lockMode: LockMode): void {
  const lockedFiles = getLockedFiles();

  // Remove any existing entry for this file in this chat
  const filteredFiles = lockedFiles.filter((file) => !(file.chatId === chatId && file.path === filePath));

  // Add the new entry
  filteredFiles.push({ chatId, path: filePath, lockMode });

  // Save the updated list
  saveLockedFiles(filteredFiles);
}

/**
 * Remove a file from the locked files list
 * @param chatId The chat ID the lock belongs to
 * @param filePath The path of the file to unlock
 */
export function removeLockedFile(chatId: string, filePath: string): void {
  const lockedFiles = getLockedFiles();

  // Filter out the file to remove for this specific chat
  const filteredFiles = lockedFiles.filter((file) => !(file.chatId === chatId && file.path === filePath));

  // Save the updated list
  saveLockedFiles(filteredFiles);
}

/**
 * Check if a file is locked
 * @param chatId The chat ID to check locks for
 * @param filePath The path of the file to check
 * @returns Object with locked status and lock mode
 */
export function isFileLocked(chatId: string, filePath: string): { locked: boolean; lockMode?: LockMode } {
  const lockedFiles = getLockedFiles();
  const lockedFile = lockedFiles.find((file) => file.chatId === chatId && file.path === filePath);

  if (lockedFile) {
    return { locked: true, lockMode: lockedFile.lockMode };
  }

  return { locked: false };
}

/**
 * Get all locked files for a specific chat
 * @param chatId The chat ID to get locks for
 * @returns Array of locked files for the specified chat
 */
export function getLockedFilesForChat(chatId: string): LockedFile[] {
  const lockedFiles = getLockedFiles();
  return lockedFiles.filter((file) => file.chatId === chatId);
}

/**
 * Migrate legacy locks (without chatId) to the new format
 * @param currentChatId The current chat ID to assign to legacy locks
 */
export function migrateLegacyLocks(currentChatId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const lockedFilesJson = localStorage.getItem(LOCKED_FILES_KEY);

      if (lockedFilesJson) {
        const lockedFiles = JSON.parse(lockedFilesJson);

        if (Array.isArray(lockedFiles)) {
          let hasLegacyLocks = false;

          // Check if any locks are in the old format (missing chatId)
          const updatedLocks = lockedFiles.map((file) => {
            if (!file.chatId) {
              hasLegacyLocks = true;
              return { ...file, chatId: currentChatId };
            }

            return file;
          });

          // Only save if we found and updated legacy locks
          if (hasLegacyLocks) {
            saveLockedFiles(updatedLocks);
            logger.info(`Migrated ${updatedLocks.length} legacy locks to chat ID: ${currentChatId}`);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Failed to migrate legacy locks', error);
  }
}
