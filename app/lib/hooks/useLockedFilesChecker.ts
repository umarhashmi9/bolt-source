import { useState } from 'react';
import { createScopedLogger } from '~/utils/logger';
import { isFileLocked, isFolderLocked, getCurrentChatId } from '~/utils/fileLocks';
import { workbenchStore } from '~/lib/stores/workbench';

const logger = createScopedLogger('useLockedFilesChecker');

/**
 * Extract file paths from a user prompt
 * This is a simple heuristic that looks for patterns like:
 * - Modify file.js
 * - Update app/components/file.tsx
 * - Change the code in src/utils/helper.ts
 * - Fix the bug in folder/file.js
 */
function extractPotentialFilePaths(prompt: string): string[] {
  // Common file extensions to look for
  const fileExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'css',
    'scss',
    'html',
    'json',
    'md',
    'py',
    'rb',
    'php',
    'java',
    'c',
    'cpp',
    'h',
    'cs',
    'go',
    'rs',
    'swift',
    'kt',
    'sh',
    'yaml',
    'yml',
    'toml',
    'xml',
    'sql',
    'graphql',
  ];

  // Create a regex pattern that matches file paths with the extensions
  const extensionPattern = fileExtensions.join('|');
  const filePathRegex = new RegExp(`\\b([\\w\\-./]+\\.(${extensionPattern}))\\b`, 'g');

  // Find all matches
  const matches = [...prompt.matchAll(filePathRegex)];
  const filePaths = matches.map((match) => match[1]);

  // Also look for folder paths (patterns like "in the folder/directory X")
  const folderRegex = /\b(folder|directory|dir)\s+['"]?([\/\w\-_.]+)['"]?/gi;
  const folderMatches = [...prompt.matchAll(folderRegex)];
  const folderPaths = folderMatches.map((match) => match[2]);

  // Combine and remove duplicates
  return [...new Set([...filePaths, ...folderPaths])];
}

/**
 * Hook to check if a user's prompt is trying to modify locked files or folders
 */
export function useLockedFilesChecker() {
  const [lockedItems, setLockedItems] = useState<{
    files: { path: string; lockMode: string }[];
    folders: { path: string; lockMode: string }[];
  }>({ files: [], folders: [] });

  /**
   * Check if a prompt is trying to modify locked files or folders
   * @param prompt The user's prompt
   * @returns An object with the modified prompt and whether any locked items were found
   */
  const checkForLockedItems = (prompt: string) => {
    const potentialPaths = extractPotentialFilePaths(prompt);
    const currentChatId = getCurrentChatId();
    const lockedFiles: { path: string; lockMode: string }[] = [];
    const lockedFolders: { path: string; lockMode: string }[] = [];

    // Check each potential path
    potentialPaths.forEach((path) => {
      // Check if it's a file
      const fileCheck = isFileLocked(path, currentChatId);

      if (fileCheck.locked) {
        lockedFiles.push({
          path,
          lockMode: fileCheck.lockMode || 'full',
        });
        logger.info(`Detected locked file in prompt: ${path}`);
      }

      // Check if it's a folder
      const folderCheck = isFolderLocked(path, currentChatId);

      if (folderCheck.locked) {
        lockedFolders.push({
          path,
          lockMode: folderCheck.lockMode || 'full',
        });
        logger.info(`Detected locked folder in prompt: ${path}`);
      }
    });

    setLockedItems({ files: lockedFiles, folders: lockedFolders });

    // If we found locked items, modify the prompt to warn the AI
    let modifiedPrompt = prompt;

    if (lockedFiles.length > 0 || lockedFolders.length > 0) {
      // Create a warning message for the AI
      let warningMessage = '\n\n[IMPORTANT: The following items are locked and cannot be modified:';

      if (lockedFiles.length > 0) {
        warningMessage += '\nLocked files:';
        lockedFiles.forEach((file) => {
          warningMessage += `\n- ${file.path} (${file.lockMode} lock)`;
        });
      }

      if (lockedFolders.length > 0) {
        warningMessage += '\nLocked folders:';
        lockedFolders.forEach((folder) => {
          warningMessage += `\n- ${folder.path} (${folder.lockMode} lock)`;
        });
      }

      warningMessage +=
        '\nPlease do not attempt to modify these items. If modifications to these items are necessary, please inform the user that they need to unlock them first.]\n\n';

      // Add the warning to the beginning of the prompt
      modifiedPrompt = warningMessage + prompt;

      // Also show an alert to the user
      workbenchStore.actionAlert.set({
        type: 'warning',
        title: 'Locked Files/Folders Detected',
        description: 'Your request mentions locked files or folders',
        content:
          'The AI has been instructed not to modify these locked items. If you need to modify them, please unlock them first.',
        isLockedFile: true,
      });
    }

    return {
      modifiedPrompt,
      hasLockedItems: lockedFiles.length > 0 || lockedFolders.length > 0,
      lockedFiles,
      lockedFolders,
    };
  };

  return {
    lockedItems,
    checkForLockedItems,
  };
}
