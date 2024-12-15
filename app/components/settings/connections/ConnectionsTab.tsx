import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { logStore } from '~/lib/stores/logs';

interface GitHubUserResponse {
  login: string;
  [key: string]: any;  // for other properties we don't use
}

export default function ConnectionsTab() {
  const [githubUsername, setGithubUsername] = useState(Cookies.get('githubUsername') || '');
  const [githubToken, setGithubToken] = useState(Cookies.get('githubToken') || '');
  const [isSaving, setIsSaving] = useState(false);
  const isConnected = !!(githubUsername && githubToken);

  const verifyGitHubCredentials = async (username: string, token: string) => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json() as GitHubUserResponse;
      if (data.login !== username) {
        throw new Error('Username does not match the provided token');
      }

      return true;
    } catch (error) {
      console.error('GitHub verification failed:', error);
      return false;
    }
  };

  const handleDisconnect = () => {
    Cookies.remove('githubUsername');
    Cookies.remove('githubToken');
    Cookies.remove('git:github.com');
    setGithubUsername('');
    setGithubToken('');
    logStore.logSystem('GitHub connection removed');
    toast.success('GitHub connection removed successfully!');
  };

  const handleSaveConnection = async () => {
    if (!githubUsername || !githubToken) {
      toast.error('Please provide both username and token');
      return;
    }

    setIsSaving(true);
    try {
      const isValid = await verifyGitHubCredentials(githubUsername, githubToken);
      
      if (!isValid) {
        toast.error('Failed to verify GitHub credentials. Please check your username and token.');
        return;
      }

      Cookies.set('githubUsername', githubUsername);
      Cookies.set('githubToken', githubToken);
      logStore.logSystem('GitHub connection settings updated', {
        username: githubUsername,
        hasToken: !!githubToken,
      });
      Cookies.set('git:github.com', JSON.stringify({ username: githubToken, password: 'x-oauth-basic' }));
      toast.success('GitHub credentials verified and saved successfully!');
    } catch (error) {
      toast.error('An error occurred while saving credentials');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 mb-4 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-3">
      <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4">GitHub Connection</h3>
      <div className="flex mb-4">
        <div className="flex-1 mr-2">
          <label className="block text-sm text-bolt-elements-textSecondary mb-1">GitHub Username:</label>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            disabled={isConnected}
            className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-bolt-elements-textSecondary mb-1">Personal Access Token:</label>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            disabled={isConnected}
            className="w-full bg-white dark:bg-bolt-elements-background-depth-4 relative px-2 py-1.5 rounded-md focus:outline-none placeholder-bolt-elements-textTertiary text-bolt-elements-textPrimary dark:text-bolt-elements-textPrimary border border-bolt-elements-borderColor disabled:opacity-50"
          />
        </div>
      </div>
      <div className="flex mb-4">
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="bg-red-500 hover:bg-red-600 rounded-lg px-4 py-2 mr-2 transition-colors duration-200 text-white"
          >
            Disconnect Account
          </button>
        ) : (
          <button
            onClick={handleSaveConnection}
            disabled={isSaving}
            className="bg-bolt-elements-button-primary-background rounded-lg px-4 py-2 mr-2 transition-colors duration-200 hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Verifying...' : 'Save Connection'}
          </button>
        )}
      </div>
    </div>
  );
}
