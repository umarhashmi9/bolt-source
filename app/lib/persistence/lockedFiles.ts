import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('LockedFiles');

// Key for storing locked files in localStorage
export const LOCKED_FILES_KEY = 'bolt.lockedFiles';

export type LockMode = 'full' | 'scoped';

export interface LockedFile {
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
 */
export function addLockedFile(filePath: string, lockMode: LockMode): void {
  const lockedFiles = getLockedFiles();

  // Remove any existing entry for this file
  const filteredFiles = lockedFiles.filter((file) => file.path !== filePath);

  // Add the new entry
  filteredFiles.push({ path: filePath, lockMode });

  // Save the updated list
  saveLockedFiles(filteredFiles);
}

/**
 * Remove a file from the locked files list
 */
export function removeLockedFile(filePath: string): void {
  const lockedFiles = getLockedFiles();

  // Filter out the file to remove
  const filteredFiles = lockedFiles.filter((file) => file.path !== filePath);

  // Save the updated list
  saveLockedFiles(filteredFiles);
}

/**
 * Check if a file is locked
 */
export function isFileLocked(filePath: string): { locked: boolean; lockMode?: LockMode } {
  const lockedFiles = getLockedFiles();
  const lockedFile = lockedFiles.find((file) => file.path === filePath);

  if (lockedFile) {
    return { locked: true, lockMode: lockedFile.lockMode };
  }

  return { locked: false };
}
