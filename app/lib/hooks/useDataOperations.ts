import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ImportExportService } from '~/lib/services/importExportService';
import { useIndexedDB } from '~/lib/hooks/useIndexedDB';

interface UseDataOperationsProps {
  /**
   * Callback to reload settings after import
   */
  onReloadSettings?: () => void;

  /**
   * Callback to reload chats after import
   */
  onReloadChats?: () => void;

  /**
   * Callback to reset settings to defaults
   */
  onResetSettings?: () => void;

  /**
   * Callback to reset chats
   */
  onResetChats?: () => void;
}

/**
 * Hook for managing data operations in the DataTab
 */
export function useDataOperations({
  onReloadSettings,
  onReloadChats,
  onResetSettings,
  onResetChats,
}: UseDataOperationsProps = {}) {
  const { db } = useIndexedDB();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [lastOperation, setLastOperation] = useState<{ type: string; data: any } | null>(null);

  /**
   * Show progress toast with percentage
   */
  const showProgress = useCallback((message: string, percent: number) => {
    setProgressMessage(message);
    setProgressPercent(percent);
    toast.loading(`${message} (${percent}%)`, { id: 'operation-progress' });
  }, []);

  /**
   * Export all settings to a JSON file
   */
  const handleExportSettings = useCallback(async () => {
    setIsExporting(true);
    setProgressPercent(0);
    toast.loading('Preparing settings export...', { id: 'operation-progress' });

    try {
      // Step 1: Export settings
      showProgress('Exporting settings', 25);

      const settingsData = await ImportExportService.exportSettings();

      // Step 2: Create blob
      showProgress('Creating file', 50);

      const blob = new Blob([JSON.stringify(settingsData, null, 2)], {
        type: 'application/json',
      });

      // Step 3: Download file
      showProgress('Downloading file', 75);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bolt-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Step 4: Complete
      showProgress('Completing export', 100);
      toast.success('Settings exported successfully', { id: 'operation-progress' });

      // Save operation for potential undo
      setLastOperation({ type: 'export-settings', data: settingsData });
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsExporting(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [showProgress]);

  /**
   * Export selected settings categories to a JSON file
   * @param categoryIds Array of category IDs to export
   */
  const handleExportSelectedSettings = useCallback(
    async (categoryIds: string[]) => {
      if (!categoryIds || categoryIds.length === 0) {
        toast.error('No settings categories selected');
        return;
      }

      setIsExporting(true);
      setProgressPercent(0);
      toast.loading(`Preparing export of ${categoryIds.length} settings categories...`, { id: 'operation-progress' });

      try {
        // Step 1: Export all settings
        showProgress('Exporting settings', 20);

        const allSettings = await ImportExportService.exportSettings();

        // Step 2: Filter settings by category
        showProgress('Filtering selected categories', 40);

        const filteredSettings: Record<string, any> = {
          exportDate: allSettings.exportDate,
        };

        // Add selected categories to filtered settings
        categoryIds.forEach((category) => {
          if (allSettings[category]) {
            filteredSettings[category] = allSettings[category];
          }
        });

        // Step 3: Create blob
        showProgress('Creating file', 60);

        const blob = new Blob([JSON.stringify(filteredSettings, null, 2)], {
          type: 'application/json',
        });

        // Step 4: Download file
        showProgress('Downloading file', 80);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bolt-settings-selected.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Step 5: Complete
        showProgress('Completing export', 100);
        toast.success(`${categoryIds.length} settings categories exported successfully`, { id: 'operation-progress' });

        // Save operation for potential undo
        setLastOperation({ type: 'export-selected-settings', data: { categoryIds, settings: filteredSettings } });
      } catch (error) {
        console.error('Error exporting selected settings:', error);
        toast.error(`Failed to export selected settings: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'operation-progress',
        });
      } finally {
        setIsExporting(false);
        setProgressPercent(0);
        setProgressMessage('');
      }
    },
    [showProgress],
  );

  /**
   * Export all chats to a JSON file
   */
  const handleExportAllChats = useCallback(async () => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    setIsExporting(true);
    setProgressPercent(0);
    toast.loading('Preparing chats export...', { id: 'operation-progress' });

    try {
      // Step 1: Export chats
      showProgress('Retrieving chats from database', 25);

      const exportData = await ImportExportService.exportAllChats(db);

      // Step 2: Create blob
      showProgress('Creating file', 50);

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      // Step 3: Download file
      showProgress('Downloading file', 75);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bolt-chats.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Step 4: Complete
      showProgress('Completing export', 100);
      toast.success(`${exportData.chats.length} chats exported successfully`, { id: 'operation-progress' });

      // Save operation for potential undo
      setLastOperation({ type: 'export-all-chats', data: exportData });
    } catch (error) {
      console.error('Error exporting chats:', error);
      toast.error(`Failed to export chats: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsExporting(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [db, showProgress]);

  /**
   * Export selected chats to a JSON file
   * @param chatIds Array of chat IDs to export
   */
  const handleExportSelectedChats = useCallback(
    async (chatIds: string[]) => {
      if (!db) {
        toast.error('Database not available');
        return;
      }

      if (!chatIds || chatIds.length === 0) {
        toast.error('No chats selected');
        return;
      }

      setIsExporting(true);
      setProgressPercent(0);
      toast.loading(`Preparing export of ${chatIds.length} chats...`, { id: 'operation-progress' });

      try {
        // Step 1: Export all chats
        showProgress('Retrieving chats from database', 20);

        const allChatsData = await ImportExportService.exportAllChats(db);
        const allChats = allChatsData.chats;

        // Step 2: Filter chats by ID
        showProgress('Filtering selected chats', 40);

        const filteredChats = allChats.filter((chat: any) => chatIds.includes(chat.id));

        const exportData = {
          chats: filteredChats,
          exportDate: new Date().toISOString(),
        };

        // Step 3: Create blob
        showProgress('Creating file', 60);

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });

        // Step 4: Download file
        showProgress('Downloading file', 80);

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bolt-chats-selected.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Step 5: Complete
        showProgress('Completing export', 100);
        toast.success(`${filteredChats.length} chats exported successfully`, { id: 'operation-progress' });

        // Save operation for potential undo
        setLastOperation({ type: 'export-selected-chats', data: { chatIds, chats: filteredChats } });
      } catch (error) {
        console.error('Error exporting selected chats:', error);
        toast.error(`Failed to export selected chats: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'operation-progress',
        });
      } finally {
        setIsExporting(false);
        setProgressPercent(0);
        setProgressMessage('');
      }
    },
    [db, showProgress],
  );

  /**
   * Import settings from a JSON file
   * @param file The file to import
   */
  const handleImportSettings = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setProgressPercent(0);
      toast.loading(`Importing settings from ${file.name}...`, { id: 'operation-progress' });

      try {
        // Step 1: Read file
        showProgress('Reading file', 20);

        const fileContent = await file.text();

        // Step 2: Parse JSON
        showProgress('Parsing settings data', 40);

        const importedData = JSON.parse(fileContent);

        // Step 3: Validate data
        showProgress('Validating settings data', 60);

        // Save current settings for potential undo
        const currentSettings = await ImportExportService.exportSettings();
        setLastOperation({ type: 'import-settings', data: { previous: currentSettings } });

        // Step 4: Import settings
        showProgress('Applying settings', 80);
        await ImportExportService.importSettings(importedData);

        // Step 5: Complete
        showProgress('Completing import', 100);
        toast.success('Settings imported successfully', { id: 'operation-progress' });

        if (onReloadSettings) {
          onReloadSettings();
        }
      } catch (error) {
        console.error('Error importing settings:', error);
        toast.error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'operation-progress',
        });
      } finally {
        setIsImporting(false);
        setProgressPercent(0);
        setProgressMessage('');
      }
    },
    [onReloadSettings, showProgress],
  );

  /**
   * Import chats from a JSON file
   * @param file The file to import
   */
  const handleImportChats = useCallback(
    async (file: File) => {
      if (!db) {
        toast.error('Database not available');
        return;
      }

      setIsImporting(true);
      setProgressPercent(0);
      toast.loading(`Importing chats from ${file.name}...`, { id: 'operation-progress' });

      try {
        // Step 1: Read file
        showProgress('Reading file', 20);

        const fileContent = await file.text();

        // Step 2: Parse JSON
        showProgress('Parsing chat data', 40);

        const importedData = JSON.parse(fileContent);

        // Process and import each chat
        if (importedData.chats && Array.isArray(importedData.chats)) {
          const { chats } = importedData;

          // Step 3: Save current chats for potential undo
          showProgress('Preparing database transaction', 60);

          const currentChats = await ImportExportService.exportAllChats(db);
          setLastOperation({ type: 'import-chats', data: { previous: currentChats } });

          // Step 4: Import chats
          showProgress(`Importing ${chats.length} chats`, 80);

          const transaction = db.transaction(['chats'], 'readwrite');
          const store = transaction.objectStore('chats');

          let processed = 0;

          for (const chat of chats) {
            store.put(chat);
            processed++;

            if (processed % 5 === 0 || processed === chats.length) {
              showProgress(`Imported ${processed} of ${chats.length} chats`, 80 + (processed / chats.length) * 20);
            }
          }

          await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
          });

          // Step 5: Complete
          showProgress('Completing import', 100);
          toast.success(`${chats.length} chats imported successfully`, { id: 'operation-progress' });

          if (onReloadChats) {
            onReloadChats();
          }
        } else {
          throw new Error('Invalid chat data format');
        }
      } catch (error) {
        console.error('Error importing chats:', error);
        toast.error(`Failed to import chats: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'operation-progress',
        });
      } finally {
        setIsImporting(false);
        setProgressPercent(0);
        setProgressMessage('');
      }
    },
    [db, onReloadChats, showProgress],
  );

  /**
   * Import API keys from a JSON file
   * @param file The file to import
   */
  const handleImportAPIKeys = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setProgressPercent(0);
      toast.loading(`Importing API keys from ${file.name}...`, { id: 'operation-progress' });

      try {
        // Step 1: Read file
        showProgress('Reading file', 20);

        const fileContent = await file.text();

        // Step 2: Parse JSON
        showProgress('Parsing API keys data', 40);

        const importedData = JSON.parse(fileContent);

        // Step 3: Validate data
        showProgress('Validating API keys data', 60);

        // Get current API keys from cookies for potential undo
        const apiKeysStr = document.cookie.split(';').find((row) => row.trim().startsWith('apiKeys='));
        const currentApiKeys = apiKeysStr ? JSON.parse(decodeURIComponent(apiKeysStr.split('=')[1])) : {};
        setLastOperation({ type: 'import-api-keys', data: { previous: currentApiKeys } });

        // Step 4: Import API keys
        showProgress('Applying API keys', 80);

        const newKeys = ImportExportService.importAPIKeys(importedData);
        const apiKeysJson = JSON.stringify(newKeys);
        document.cookie = `apiKeys=${apiKeysJson}; path=/; max-age=31536000`;

        // Step 5: Complete
        showProgress('Completing import', 100);

        // Count how many keys were imported
        const keyCount = Object.keys(newKeys).length;
        const newKeyCount = Object.keys(newKeys).filter(
          (key) => !currentApiKeys[key] || currentApiKeys[key] !== newKeys[key],
        ).length;

        toast.success(
          `${keyCount} API keys imported successfully (${newKeyCount} new/updated)\n` +
            'Note: Keys are stored in browser cookies. For server-side usage, add them to your .env.local file.',
          { id: 'operation-progress', duration: 5000 },
        );

        if (onReloadSettings) {
          onReloadSettings();
        }
      } catch (error) {
        console.error('Error importing API keys:', error);
        toast.error(`Failed to import API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          id: 'operation-progress',
        });
      } finally {
        setIsImporting(false);
        setProgressPercent(0);
        setProgressMessage('');
      }
    },
    [onReloadSettings, showProgress],
  );

  /**
   * Reset all settings to default values
   */
  const handleResetSettings = useCallback(async () => {
    setIsResetting(true);
    setProgressPercent(0);
    toast.loading('Resetting settings...', { id: 'operation-progress' });

    try {
      if (db) {
        // Step 1: Save current settings for potential undo
        showProgress('Backing up current settings', 25);

        const currentSettings = await ImportExportService.exportSettings();
        setLastOperation({ type: 'reset-settings', data: { previous: currentSettings } });

        // Step 2: Reset settings
        showProgress('Resetting settings to defaults', 50);
        await ImportExportService.resetAllSettings(db);

        // Step 3: Complete
        showProgress('Completing reset', 100);
        toast.success('Settings reset successfully', { id: 'operation-progress' });

        if (onResetSettings) {
          onResetSettings();
        }
      } else {
        toast.error('Database not available', { id: 'operation-progress' });
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error(`Failed to reset settings: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsResetting(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [db, onResetSettings, showProgress]);

  /**
   * Reset all chats
   */
  const handleResetChats = useCallback(async () => {
    if (!db) {
      toast.error('Database not available');
      return;
    }

    setIsResetting(true);
    setProgressPercent(0);
    toast.loading('Deleting all chats...', { id: 'operation-progress' });

    try {
      // Step 1: Save current chats for potential undo
      showProgress('Backing up current chats', 25);

      const currentChats = await ImportExportService.exportAllChats(db);
      setLastOperation({ type: 'reset-chats', data: { previous: currentChats } });

      // Step 2: Delete chats
      showProgress('Deleting chats from database', 50);
      await ImportExportService.deleteAllChats(db);

      // Step 3: Complete
      showProgress('Completing deletion', 100);
      toast.success('All chats deleted successfully', { id: 'operation-progress' });

      if (onResetChats) {
        onResetChats();
      }
    } catch (error) {
      console.error('Error resetting chats:', error);
      toast.error(`Failed to delete chats: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsResetting(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [db, onResetChats, showProgress]);

  /**
   * Download API keys template
   */
  const handleDownloadTemplate = useCallback(async () => {
    setIsDownloadingTemplate(true);
    setProgressPercent(0);
    toast.loading('Preparing API keys template...', { id: 'operation-progress' });

    try {
      // Step 1: Create template
      showProgress('Creating template', 50);

      const templateData = ImportExportService.createAPIKeysTemplate();

      // Step 2: Download file
      showProgress('Downloading template', 75);

      const blob = new Blob([JSON.stringify(templateData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bolt-api-keys-template.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Step 3: Complete
      showProgress('Completing download', 100);
      toast.success('API keys template downloaded successfully', { id: 'operation-progress' });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsDownloadingTemplate(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [showProgress]);

  /**
   * Export API keys to a JSON file
   */
  const handleExportAPIKeys = useCallback(async () => {
    setIsExporting(true);
    setProgressPercent(0);
    toast.loading('Preparing API keys export...', { id: 'operation-progress' });

    try {
      // Step 1: Get API keys from all sources
      showProgress('Retrieving API keys', 25);

      // Create a fetch request to get API keys from server
      const response = await fetch('/api/export-api-keys');

      if (!response.ok) {
        throw new Error('Failed to retrieve API keys from server');
      }

      const apiKeys = await response.json();

      // Step 2: Create blob
      showProgress('Creating file', 50);

      const blob = new Blob([JSON.stringify(apiKeys, null, 2)], {
        type: 'application/json',
      });

      // Step 3: Download file
      showProgress('Downloading file', 75);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bolt-api-keys.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Step 4: Complete
      showProgress('Completing export', 100);
      toast.success('API keys exported successfully', { id: 'operation-progress' });

      // Save operation for potential undo
      setLastOperation({ type: 'export-api-keys', data: apiKeys });
    } catch (error) {
      console.error('Error exporting API keys:', error);
      toast.error(`Failed to export API keys: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    } finally {
      setIsExporting(false);
      setProgressPercent(0);
      setProgressMessage('');
    }
  }, [showProgress]);

  /**
   * Undo the last operation if possible
   */
  const handleUndo = useCallback(async () => {
    if (!lastOperation || !db) {
      toast.error('Nothing to undo');
      return;
    }

    toast.loading('Attempting to undo last operation...', { id: 'operation-progress' });

    try {
      switch (lastOperation.type) {
        case 'import-settings': {
          // Restore previous settings
          await ImportExportService.importSettings(lastOperation.data.previous);
          toast.success('Settings import undone', { id: 'operation-progress' });

          if (onReloadSettings) {
            onReloadSettings();
          }

          break;
        }

        case 'import-chats': {
          // Delete imported chats and restore previous state
          await ImportExportService.deleteAllChats(db);

          // Reimport previous chats
          const transaction = db.transaction(['chats'], 'readwrite');
          const store = transaction.objectStore('chats');

          for (const chat of lastOperation.data.previous.chats) {
            store.put(chat);
          }

          await new Promise((resolve, reject) => {
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
          });

          toast.success('Chats import undone', { id: 'operation-progress' });

          if (onReloadChats) {
            onReloadChats();
          }

          break;
        }

        case 'reset-settings': {
          // Restore previous settings
          await ImportExportService.importSettings(lastOperation.data.previous);
          toast.success('Settings reset undone', { id: 'operation-progress' });

          if (onReloadSettings) {
            onReloadSettings();
          }

          break;
        }

        case 'reset-chats': {
          // Restore previous chats
          const chatTransaction = db.transaction(['chats'], 'readwrite');
          const chatStore = chatTransaction.objectStore('chats');

          for (const chat of lastOperation.data.previous.chats) {
            chatStore.put(chat);
          }

          await new Promise((resolve, reject) => {
            chatTransaction.oncomplete = resolve;
            chatTransaction.onerror = reject;
          });

          toast.success('Chats deletion undone', { id: 'operation-progress' });

          if (onReloadChats) {
            onReloadChats();
          }

          break;
        }

        case 'import-api-keys': {
          // Restore previous API keys
          const previousAPIKeys = lastOperation.data.previous;
          const newKeys = ImportExportService.importAPIKeys(previousAPIKeys);
          const apiKeysJson = JSON.stringify(newKeys);
          document.cookie = `apiKeys=${apiKeysJson}; path=/; max-age=31536000`;
          toast.success('API keys import undone', { id: 'operation-progress' });

          if (onReloadSettings) {
            onReloadSettings();
          }

          break;
        }

        default:
          toast.error('Cannot undo this operation', { id: 'operation-progress' });
      }

      // Clear the last operation after undoing
      setLastOperation(null);
    } catch (error) {
      console.error('Error undoing operation:', error);
      toast.error(`Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        id: 'operation-progress',
      });
    }
  }, [lastOperation, db, onReloadSettings, onReloadChats]);

  return {
    isExporting,
    isImporting,
    isResetting,
    isDownloadingTemplate,
    progressMessage,
    progressPercent,
    lastOperation,
    handleExportSettings,
    handleExportSelectedSettings,
    handleExportAllChats,
    handleExportSelectedChats,
    handleImportSettings,
    handleImportChats,
    handleImportAPIKeys,
    handleResetSettings,
    handleResetChats,
    handleDownloadTemplate,
    handleExportAPIKeys,
    handleUndo,
  };
}
