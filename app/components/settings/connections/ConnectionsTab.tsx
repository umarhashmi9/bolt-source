import React, { useState, useEffect } from 'react';
import { logStore } from '~/lib/stores/logs';
import { lookupSavedPassword, saveGitAuth, ensureEncryption } from '~/lib/hooks/useCredentials';

export default function ConnectionsTab() {
  const [credentials, setCredentials] = useState({
    github: { username: '', token: '' },
    gitlab: { username: '', token: '' },
  });

  useEffect(() => {
    initializeEncryption();
  }, []);

  const initializeEncryption = async () => {
    const success = await ensureEncryption();

    if (success) {
      loadSavedCredentials();
    }
  };

  const loadSavedCredentials = async () => {
    for (const [, config] of Object.entries(providers)) {
      const auth = await lookupSavedPassword(config.url);

      if (auth?.username && auth?.password) {
        config.setCredentials(auth.username, auth.password);
      }
    }
  };

  const providers = {
    github: {
      url: 'github.com',
      username: credentials.github.username,
      token: credentials.github.token,
      title: 'GitHub',
      setCredentials: (username: string, token: string) =>
        setCredentials((prev) => ({
          ...prev,
          github: { username, token },
        })),
    },
    gitlab: {
      url: 'gitlab.com',
      username: credentials.gitlab.username,
      token: credentials.gitlab.token,
      title: 'GitLab',
      setCredentials: (username: string, token: string) =>
        setCredentials((prev) => ({
          ...prev,
          gitlab: { username, token },
        })),
    },
  };

  const handleSaveConnection = async (provider: keyof typeof providers) => {
    const { url, username, token, title } = providers[provider];

    await saveGitAuth(url, {
      username,
      password: token,
    });

    logStore.logSystem(`${title} connection settings updated`, {
      username,
      hasToken: !!token,
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(providers).map(([key, provider]) => (
        <div
          key={key}
          className="p-4 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-3"
        >
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">{provider.title} Connection</h3>
          <div className="flex mb-4">
            <div className="flex-1 mr-2">
              <label className="block text-sm text-bolt-elements-textSecondary mb-1">{provider.title} Username:</label>
              <input
                type="text"
                value={provider.username}
                onChange={(e) => provider.setCredentials(e.target.value, provider.token)}
                className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-bolt-elements-textSecondary mb-1">Personal Access Token:</label>
              <input
                type="password"
                value={provider.token}
                onChange={(e) => provider.setCredentials(provider.username, e.target.value)}
                className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor"
              />
            </div>
          </div>
          <div className="flex">
            <button
              onClick={() => handleSaveConnection(key as keyof typeof providers)}
              className="bg-bolt-elements-button-primary-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text"
            >
              Save {provider.title} Connection
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
