import { getLockedFiles, type LockMode } from '~/lib/persistence/lockedFiles';
import { createScopedLogger } from './logger';

const logger = createScopedLogger('FileLocks');

/**
 * Get the current chat ID from the URL
 * @returns The current chat ID or a default value if not found
 */
export function getCurrentChatId(): string {
  try {
    if (typeof window !== 'undefined') {
      // Extract chat ID from URL (format: /chat/123)
      const match = window.location.pathname.match(/\/chat\/([^/]+)/);

      if (match && match[1]) {
        return match[1];
      }
    }

    // Return a default chat ID if none is found
    return 'default';
  } catch (error) {
    logger.error('Failed to get current chat ID', error);
    return 'default';
  }
}

/**
 * Check if a file is locked directly from localStorage
 * This avoids circular dependencies between components and stores
 * @param filePath The path of the file to check
 * @param chatId Optional chat ID (will be extracted from URL if not provided)
 */
export function isFileLocked(filePath: string, chatId?: string): { locked: boolean; lockMode?: LockMode } {
  try {
    const currentChatId = chatId || getCurrentChatId();
    const lockedFiles = getLockedFiles();

    // First check for a chat-specific lock
    const lockedFile = lockedFiles.find((file) => file.chatId === currentChatId && file.path === filePath);

    if (lockedFile) {
      return { locked: true, lockMode: lockedFile.lockMode };
    }

    // For backward compatibility, also check for legacy locks without chatId
    const legacyLock = lockedFiles.find((file) => !file.chatId && file.path === filePath);

    if (legacyLock) {
      return { locked: true, lockMode: legacyLock.lockMode };
    }

    return { locked: false };
  } catch (error) {
    logger.error('Failed to check if file is locked', error);
    return { locked: false };
  }
}
