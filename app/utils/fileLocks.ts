import { getLockedFiles, type LockMode } from '~/lib/persistence/lockedFiles';
import { createScopedLogger } from './logger';

const logger = createScopedLogger('FileLocks');

/**
 * Check if a file is locked directly from localStorage
 * This avoids circular dependencies between components and stores
 */
export function isFileLocked(filePath: string): { locked: boolean; lockMode?: LockMode } {
  try {
    const lockedFiles = getLockedFiles();
    const lockedFile = lockedFiles.find((file) => file.path === filePath);

    if (lockedFile) {
      return { locked: true, lockMode: lockedFile.lockMode };
    }

    return { locked: false };
  } catch (error) {
    logger.error('Failed to check if file is locked', error);
    return { locked: false };
  }
}
