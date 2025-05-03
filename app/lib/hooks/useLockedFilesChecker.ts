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
 * - Update the readme
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

  // Look for common file names without extensions
  const commonFileNames = [
    { pattern: /\b(readme|read\s*me)\b/gi, path: 'README.md' },
    { pattern: /\b(license)\b/gi, path: 'LICENSE' },
    { pattern: /\b(changelog|change\s*log)\b/gi, path: 'CHANGELOG.md' },
    { pattern: /\b(package\.json)\b/gi, path: 'package.json' },
    { pattern: /\b(tsconfig|ts\s*config)\b/gi, path: 'tsconfig.json' },
    { pattern: /\b(gitignore|git\s*ignore)\b/gi, path: '.gitignore' },
    { pattern: /\b(env|environment|\.env)\b/gi, path: '.env' },
    { pattern: /\b(docker\s*file)\b/gi, path: 'Dockerfile' },
    { pattern: /\b(compose\.ya?ml)\b/gi, path: 'docker-compose.yml' },

    // Common action verbs that might indicate file modification intent
    { pattern: /\b(update|modify|change|edit|fix|create|add to|implement|write|rewrite)\b/gi, path: '' },
  ];

  const commonFilePaths = commonFileNames.flatMap(({ pattern, path }) => {
    // If this is an action verb pattern and it matches, we need to check all files
    if (path === '' && prompt.match(pattern)) {
      return []; // We'll handle action verbs separately
    }

    return prompt.match(pattern) ? [path] : [];
  });

  // Also check for files in the current workbench store
  const workbenchFiles = Object.keys(workbenchStore.files.get());

  // Check if the prompt mentions updating or modifying any of these files
  const actionWords = [
    'update',
    'modify',
    'change',
    'edit',
    'fix',
    'create',
    'add to',
    'implement',
    'write',
    'rewrite',
  ];

  // Check if any action word is in the prompt
  const hasActionWord = actionWords.some((action) => new RegExp(`\\b${action}\\b`, 'i').test(prompt));

  // If we detect an action word, we need to be more cautious and check all important files
  let mentionedFiles: string[] = [];

  if (hasActionWord) {
    // First, check for specific file mentions
    mentionedFiles = workbenchFiles.filter((file) => {
      const fileName = file.split('/').pop() || '';

      // Check if any action word is followed by this filename
      return actionWords.some((action) => {
        const regex = new RegExp(`${action}\\s+(?:the\\s+)?(?:file\\s+)?['"]?${fileName}['"]?`, 'i');
        return regex.test(prompt);
      });
    });

    /*
     * If no specific files are mentioned but action words are present,
     * include common important files that are often modified
     */
    if (mentionedFiles.length === 0) {
      const importantFilePatterns = [
        /README\.md$/i,
        /package\.json$/i,
        /index\.(js|ts|jsx|tsx)$/i,
        /app\.(js|ts|jsx|tsx)$/i,
        /main\.(js|ts|jsx|tsx)$/i,
        /styles\.(css|scss)$/i,
      ];

      mentionedFiles = workbenchFiles.filter((file) => importantFilePatterns.some((pattern) => pattern.test(file)));
    }
  } else {
    // If no action words, just check for direct file mentions
    mentionedFiles = workbenchFiles.filter((file) => {
      const fileName = file.split('/').pop() || '';
      return new RegExp(`\\b${fileName}\\b`, 'i').test(prompt);
    });
  }

  // Combine and remove duplicates
  return [...new Set([...filePaths, ...folderPaths, ...commonFilePaths, ...mentionedFiles])];
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
