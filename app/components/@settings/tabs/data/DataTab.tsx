import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { DialogRoot, DialogClose, Dialog, DialogTitle } from '~/components/ui/Dialog';
import { db, getAll, deleteById } from '~/lib/persistence';
import Cookies from 'js-cookie';

export default function DataTab() {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isImportingKeys, setIsImportingKeys] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportingChats, setIsExportingChats] = useState(false);
  const [isExportingSettings, setIsExportingSettings] = useState(false);
  const [isImportingSettings, setIsImportingSettings] = useState(false);
  const [isExportingApiKeys, setIsExportingApiKeys] = useState(false);
  const [showResetInlineConfirm, setShowResetInlineConfirm] = useState(false);
  const [showDeleteInlineConfirm, setShowDeleteInlineConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiKeyFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAllChats = useCallback(async () => {
    setIsExportingChats(true);

    try {
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Get all chats from IndexedDB
      const allChats = await getAll(db);

      if (allChats.length === 0) {
        toast.info('No chats to export');
        return;
      }

      // Get chat snapshots from localStorage
      const chatSnapshots: Record<string, any> = {};
      const snapshotKeys = Object.keys(localStorage).filter((key) => key.startsWith('snapshot:'));

      snapshotKeys.forEach((key) => {
        try {
          const snapshotData = localStorage.getItem(key);

          if (snapshotData) {
            chatSnapshots[key] = JSON.parse(snapshotData);
          }
        } catch (err) {
          console.error(`Error parsing snapshot ${key}:`, err);
        }
      });

      // Collect chat-related metadata
      const chatMetadata: Record<string, any> = {};
      const chatRelatedKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith('bolt_chat_') || key.includes('_chat_'),
      );

      chatRelatedKeys.forEach((key) => {
        try {
          const data = localStorage.getItem(key);

          if (data) {
            chatMetadata[key] = data;
          }
        } catch (err) {
          console.error(`Error retrieving chat metadata ${key}:`, err);
        }
      });

      const exportData = {
        meta: {
          version: '1.0',
          exportDate: new Date().toISOString(),
          totalChats: allChats.length,
          totalSnapshots: Object.keys(chatSnapshots).length,
          appInfo: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            platform: navigator.platform,
          },
        },
        chats: allChats,
        snapshots: chatSnapshots,
        chatMetadata,
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bolt-chats-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        `${allChats.length} chats exported successfully (with ${Object.keys(chatSnapshots).length} snapshots)`,
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export chats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExportingChats(false);
    }
  }, []);

  const handleExportSettings = useCallback(() => {
    setIsExportingSettings(true);

    try {
      // Create a comprehensive export of all settings
      const allStorageItems: Record<string, string | null> = {};
      const boltSettings: Record<string, string | null> = {};
      const appSettings: Record<string, string | null> = {};
      const featureSettings: Record<string, string | null> = {};
      const providerSettings: Record<string, string | null> = {};
      const tabSettings: Record<string, string | null> = {};
      const otherSettings: Record<string, string | null> = {};

      // Collect ALL items from localStorage (except API keys for security)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (!key) {
          continue;
        }

        const value = localStorage.getItem(key);
        allStorageItems[key] = value;

        // Skip sensitive data from detailed export
        if (key.includes('api_key') || key.includes('token') || key.includes('password') || key.includes('secret')) {
          continue;
        }

        if (key.startsWith('bolt_')) {
          boltSettings[key] = value;
        } else if (key.includes('feature') || key.includes('flag') || key.includes('enable')) {
          featureSettings[key] = value;
        } else if (key.includes('provider') || key.includes('connector') || key.includes('endpoint')) {
          providerSettings[key] = value;
        } else if (key.includes('tab') || key.includes('panel') || key.includes('view')) {
          tabSettings[key] = value;
        } else if (
          key.includes('settings') ||
          key.includes('config') ||
          key.includes('preferences') ||
          key.includes('profile')
        ) {
          appSettings[key] = value;
        } else {
          otherSettings[key] = value;
        }
      }

      // Get cookies (excluding sensitive ones)
      const cookies = Cookies.get();
      const cookieKeys = Object.keys(cookies);
      const cookieCount = cookieKeys.length;

      // Collect domain and path info
      const siteInfo = {
        url: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        exportTime: new Date().toISOString(),
      };

      // Add specific settings we want to include
      const settings = {
        meta: {
          version: '1.1', // Upgraded export format version
          exportDate: new Date().toISOString(),
          totalStorageItems: Object.keys(allStorageItems).length,
          totalCookies: cookieCount,
          categories: {
            bolt: Object.keys(boltSettings).length,
            app: Object.keys(appSettings).length,
            features: Object.keys(featureSettings).length,
            providers: Object.keys(providerSettings).length,
            tabs: Object.keys(tabSettings).length,
            other: Object.keys(otherSettings).length,
          },
          siteInfo,
        },
        userProfile: localStorage.getItem('bolt_user_profile'),
        settings: localStorage.getItem('bolt_settings'),
        boltSettings,
        appSettings,
        featureSettings,
        providerSettings,
        tabSettings,
        otherSettings,
        cookies,
      };

      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bolt-full-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Prepare a detailed summary for the toast message
      const summary = [
        `Total: ${Object.keys(allStorageItems).length} items`,
        `Features: ${Object.keys(featureSettings).length}`,
        `Providers: ${Object.keys(providerSettings).length}`,
        `Tabs: ${Object.keys(tabSettings).length}`,
      ].join(', ');

      toast.success(`Settings export successful. ${summary}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExportingSettings(false);
    }
  }, []);

  const handleImportSettings = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingSettings(true);

    try {
      const content = await file.text();
      const importedData = JSON.parse(content);

      // Validate the imported data
      if (!importedData.exportDate) {
        throw new Error('Invalid settings file format');
      }

      // Import specific settings
      if (importedData.userProfile) {
        localStorage.setItem('bolt_user_profile', importedData.userProfile);
      }

      if (importedData.settings) {
        localStorage.setItem('bolt_settings', importedData.settings);
      }

      // Import all settings if available (from newer export format)
      if (importedData.allSettings && typeof importedData.allSettings === 'object') {
        Object.entries(importedData.allSettings).forEach(([key, value]) => {
          if (typeof value === 'string' && !key.includes('api_key')) {
            try {
              localStorage.setItem(key, value);
            } catch (err) {
              console.error(`Error importing setting ${key}:`, err);
            }
          }
        });
      }

      toast.success('Settings imported successfully');

      // Ask user to reload application
      if (confirm('Settings imported successfully. Reload application to apply changes?')) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Failed to import settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImportingSettings(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const handleImportAPIKeys = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingKeys(true);

    try {
      const content = await file.text();
      const keys = JSON.parse(content);

      // Validate structure
      if (typeof keys !== 'object' || keys === null) {
        throw new Error('Invalid API keys file format - expected an object');
      }

      // Track successfully imported keys
      let importCount = 0;
      let errorCount = 0;

      // Validate and save each key
      await Promise.all(
        Object.entries(keys).map(async ([key, value]) => {
          try {
            if (typeof value !== 'string') {
              console.error(`Skipping invalid value for key: ${key}`);
              errorCount++;

              return;
            }

            // Normalize key format (lowercase, ensure bolt_ prefix)
            const normalizedKey = key.toLowerCase();
            const storageKey = normalizedKey.startsWith('bolt_') ? normalizedKey : `bolt_${normalizedKey}`;

            localStorage.setItem(storageKey, value);
            importCount++;
          } catch (err) {
            console.error(`Error importing key ${key}:`, err);
            errorCount++;
          }
        }),
      );

      if (importCount > 0) {
        toast.success(`${importCount} API keys imported successfully`);

        if (errorCount > 0) {
          toast.warning(`${errorCount} keys could not be imported`);
        }
      } else if (errorCount > 0) {
        toast.error(`Failed to import any API keys. ${errorCount} errors encountered.`);
      } else {
        toast.info('No API keys found in the imported file');
      }
    } catch (error) {
      console.error('Error importing API keys:', error);
      toast.error(`Failed to import API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImportingKeys(false);

      if (apiKeyFileInputRef.current) {
        apiKeyFileInputRef.current.value = '';
      }
    }
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    setIsDownloadingTemplate(true);

    try {
      const template = {
        /*
         * API keys section - organized by provider
         * OpenAI and compatible services
         */
        OpenAI_API_KEY: '',
        AzureOpenAI_API_KEY: '',
        OpenAILike_API_KEY: '', // For compatible providers

        // Other major AI providers
        Anthropic_API_KEY: '',
        Google_API_KEY: '',
        Groq_API_KEY: '',
        Mistral_API_KEY: '',
        Perplexity_API_KEY: '',
        Cohere_API_KEY: '',
        Together_API_KEY: '',
        HuggingFace_API_KEY: '',
        Deepseek_API_KEY: '',
        OpenRouter_API_KEY: '',
        xAI_API_KEY: '',

        // Base URLs for self-hosted or non-standard endpoints
        OPENAI_LIKE_API_BASE_URL: '',
        OLLAMA_API_BASE_URL: 'http://localhost:11434/api',
        LMSTUDIO_API_BASE_URL: 'http://localhost:1234/v1',
        TOGETHER_API_BASE_URL: '',

        // Organization IDs
        OPENAI_ORG_ID: '',

        // Add a comment to explain usage
        __INSTRUCTIONS__: "Fill in your API keys and save this file. Then import using the 'Import API Keys' button.",
      };

      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bolt-api-keys-template.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error(`Failed to download template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, []);

  const handleResetSettings = async () => {
    setIsResetting(true);

    try {
      console.log('Starting complete settings reset');

      // 1. Clear all localStorage items related to application settings
      const localStorageKeysToPreserve: string[] = ['debug_mode']; // Keys to preserve if needed

      // Get all localStorage keys
      const allLocalStorageKeys = Object.keys(localStorage);
      console.log('Clearing localStorage items:', allLocalStorageKeys.length, 'items found');

      // Clear all localStorage items except those to preserve
      allLocalStorageKeys.forEach((key) => {
        if (!localStorageKeysToPreserve.includes(key)) {
          try {
            console.log(`Removing localStorage item: ${key}`);
            localStorage.removeItem(key);
          } catch (err) {
            console.error(`Error removing localStorage item ${key}:`, err);
          }
        }
      });

      // 2. Clear all cookies related to application settings
      const cookiesToPreserve: string[] = []; // Cookies to preserve if needed

      // Get all cookies
      const allCookies = Cookies.get();
      const cookieKeys = Object.keys(allCookies);
      console.log('Clearing cookies:', cookieKeys.length, 'items found');

      // Clear all cookies except those to preserve
      cookieKeys.forEach((key) => {
        if (!cookiesToPreserve.includes(key)) {
          try {
            console.log(`Removing cookie: ${key}`);
            Cookies.remove(key);
          } catch (err) {
            console.error(`Error removing cookie ${key}:`, err);
          }
        }
      });

      // 3. Clear all data from IndexedDB
      if (!db) {
        console.warn('Database not initialized, skipping IndexedDB reset');
      } else {
        console.log('Clearing IndexedDB data');

        // Get all chats and delete them
        const chats = await getAll(db as IDBDatabase);
        console.log(`Deleting ${chats.length} chats from IndexedDB`);

        const deletePromises = chats.map((chat) => deleteById(db as IDBDatabase, chat.id));
        await Promise.all(deletePromises);
      }

      // 4. Clear any chat snapshots
      const snapshotKeys = Object.keys(localStorage).filter((key) => key.startsWith('snapshot:'));
      console.log(`Clearing ${snapshotKeys.length} chat snapshots`);
      snapshotKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Error removing snapshot ${key}:`, err);
        }
      });

      console.log('Settings reset completed successfully');

      // Close the dialog first
      setShowResetInlineConfirm(false);

      // Show success message and reload
      toast.success('All settings have been reset to default values');

      // Use setTimeout to ensure the toast is shown before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Reset error:', error);
      setShowResetInlineConfirm(false);
      toast.error('Failed to reset settings: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAllChats = useCallback(async () => {
    setIsDeleting(true);

    try {
      // Clear chat history from localStorage
      localStorage.removeItem('bolt_chat_history');

      // Also clear any chat-related items in localStorage
      const chatKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith('bolt_chat_') || key.startsWith('snapshot:'),
      );

      console.log(`Found ${chatKeys.length} chat-related localStorage items to clear`);

      // Remove all chat-related localStorage items
      chatKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Failed to remove localStorage item: ${key}`, err);
        }
      });

      // Clear chats from IndexedDB
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Get all chats and delete them one by one
      const chats = await getAll(db as IDBDatabase);
      console.log(`Deleting ${chats.length} chats from IndexedDB`);

      if (chats.length === 0) {
        toast.info('No chat history to delete');
        setShowDeleteInlineConfirm(false);

        return;
      }

      const deletePromises = chats.map((chat) => deleteById(db as IDBDatabase, chat.id));
      await Promise.all(deletePromises);

      // Close the dialog first
      setShowDeleteInlineConfirm(false);

      // Then show the success message
      toast.success(`${chats.length} chats deleted successfully`);
    } catch (error) {
      console.error('Delete error:', error);
      setShowDeleteInlineConfirm(false);
      toast.error(`Failed to delete chat history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const handleExportCurrentAPIKeys = useCallback(() => {
    setIsExportingApiKeys(true);

    try {
      // Get all API keys from localStorage with bolt_ prefix
      const apiKeys: Record<string, string> = {};
      const apiKeyCount = { withValue: 0, total: 0 };

      // Collect all API key items from localStorage, including provider settings
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (
          key &&
          (key.toLowerCase().includes('api_key') ||
            key.toLowerCase().includes('api_base_url') ||
            key.toLowerCase().includes('_org_id') ||
            key.toLowerCase().includes('provider') || // Added to capture provider settings
            key.toLowerCase().includes('endpoint') ||
            key.toLowerCase().includes('auth_') ||
            key.toLowerCase().includes('feature') || // Added to capture feature settings
            key.toLowerCase().includes('_tab') ||
            key.toLowerCase().includes('local_'))
        ) {
          const value = localStorage.getItem(key);

          if (value) {
            // Remove bolt_ prefix for cleaner export
            const exportKey = key.startsWith('bolt_') ? key.substring(5) : key;
            apiKeys[exportKey] = value;
            apiKeyCount.total++;

            if (value.trim() !== '') {
              apiKeyCount.withValue++;
            }
          }
        }
      }

      if (apiKeyCount.total === 0) {
        toast.info('No API keys found to export');
        return;
      }

      const exportData = {
        apiKeys,
        providerSettings: true, // Flag to indicate this includes provider settings
        exportDate: new Date().toISOString(),
        version: '1.0.1', // Incremented version
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bolt-api-keys-and-providers-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${apiKeyCount.withValue} API keys and provider settings exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExportingApiKeys(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
      {/* Reset Settings Dialog */}
      <DialogRoot open={showResetInlineConfirm} onOpenChange={setShowResetInlineConfirm}>
        <Dialog showCloseButton={false} className="z-[1000]">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="i-ph:warning-circle-fill w-5 h-5 text-yellow-500" />
              <DialogTitle>Reset All Settings?</DialogTitle>
            </div>
            <p className="text-sm text-bolt-elements-textSecondary mt-2">
              This will reset all your settings to their default values. This action cannot be undone.
            </p>
            <div className="flex justify-end items-center gap-3 mt-6">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg text-sm bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#666666] dark:text-[#999999] hover:text-[#333333] dark:hover:text-white">
                  Cancel
                </button>
              </DialogClose>
              <motion.button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-white dark:bg-[#1A1A1A] text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/10 dark:hover:border-yellow-500/20"
                onClick={handleResetSettings}
                disabled={isResetting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isResetting ? (
                  <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                ) : (
                  <div className="i-ph:arrow-counter-clockwise w-4 h-4" />
                )}
                Reset Settings
              </motion.button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={showDeleteInlineConfirm} onOpenChange={setShowDeleteInlineConfirm}>
        <Dialog showCloseButton={false} className="z-[1000]">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="i-ph:warning-circle-fill w-5 h-5 text-red-500" />
              <DialogTitle>Delete All Chats?</DialogTitle>
            </div>
            <p className="text-sm text-bolt-elements-textSecondary mt-2">
              This will permanently delete all your chat history. This action cannot be undone.
            </p>
            <div className="flex justify-end items-center gap-3 mt-6">
              <DialogClose asChild>
                <button className="px-4 py-2 rounded-lg text-sm bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#666666] dark:text-[#999999] hover:text-[#333333] dark:hover:text-white">
                  Cancel
                </button>
              </DialogClose>
              <motion.button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-white dark:bg-[#1A1A1A] text-red-500 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-500/10 dark:hover:border-red-500/20"
                onClick={handleDeleteAllChats}
                disabled={isDeleting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isDeleting ? (
                  <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
                ) : (
                  <div className="i-ph:trash w-4 h-4" />
                )}
                Delete All
              </motion.button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>

      {/* Chat History Section */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg p-6 border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="i-ph:chat-circle-duotone w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Chat History</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Export or delete all your chat history.</p>
        <div className="flex gap-4">
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportAllChats}
            disabled={isExportingChats}
          >
            {isExportingChats ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:download-simple w-4 h-4" />
            )}
            {isExportingChats ? 'Exporting...' : 'Export All Chats'}
          </motion.button>
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-500 text-sm hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeleteInlineConfirm(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:trash w-4 h-4" />
            )}
            {isDeleting ? 'Deleting...' : 'Delete All Chats'}
          </motion.button>
        </div>
      </motion.div>

      {/* Settings Backup Section */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg p-6 border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="i-ph:gear-duotone w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Settings Backup</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all your settings including features, tabs, providers, and preferences to a single JSON file. Import
          settings from a previously exported file.
        </p>
        <div className="flex gap-4">
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportSettings}
            disabled={isExportingSettings}
          >
            {isExportingSettings ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:download-simple w-4 h-4" />
            )}
            {isExportingSettings ? 'Exporting...' : 'Export All Settings'}
          </motion.button>
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isImportingSettings}
          >
            {isImportingSettings ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:upload-simple w-4 h-4" />
            )}
            {isImportingSettings ? 'Importing...' : 'Import Settings'}
          </motion.button>
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 text-yellow-600 text-sm hover:bg-yellow-100 dark:bg-yellow-500/10 dark:hover:bg-yellow-500/20 dark:text-yellow-500 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowResetInlineConfirm(true)}
            disabled={isResetting}
          >
            {isResetting ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:arrow-counter-clockwise w-4 h-4" />
            )}
            {isResetting ? 'Resetting...' : 'Reset Settings'}
          </motion.button>
        </div>
      </motion.div>

      {/* API Keys Management Section */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg p-6 border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="i-ph:key-duotone w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Keys Management</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import API keys from a JSON file or download a template to fill in your keys.
        </p>
        <div className="flex gap-4">
          <input
            ref={apiKeyFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportAPIKeys}
            className="hidden"
          />
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
          >
            {isDownloadingTemplate ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:download-simple w-4 h-4" />
            )}
            {isDownloadingTemplate ? 'Downloading...' : 'Download Template'}
          </motion.button>
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => apiKeyFileInputRef.current?.click()}
            disabled={isImportingKeys}
          >
            {isImportingKeys ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:upload-simple w-4 h-4" />
            )}
            {isImportingKeys ? 'Importing...' : 'Import API Keys'}
          </motion.button>
        </div>
      </motion.div>

      {/* Current API Keys Section */}
      <motion.div
        className="bg-white dark:bg-[#0A0A0A] rounded-lg p-6 border border-[#E5E5E5] dark:border-[#1A1A1A]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="i-ph:key-duotone w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current API Keys & Providers</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export your current API keys, provider settings, feature flags, and tab configurations to a single JSON file.
        </p>
        <div className="flex gap-4">
          <motion.button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 disabled:opacity-50 disabled:pointer-events-none"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportCurrentAPIKeys}
            disabled={isExportingApiKeys}
          >
            {isExportingApiKeys ? (
              <div className="i-ph:spinner-gap-bold animate-spin w-4 h-4" />
            ) : (
              <div className="i-ph:download-simple w-4 h-4" />
            )}
            {isExportingApiKeys ? 'Exporting...' : 'Export API Keys & Providers'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
