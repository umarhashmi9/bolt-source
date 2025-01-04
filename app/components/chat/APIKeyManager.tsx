import React, { useState, useEffect } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { Switch } from '~/components/ui/Switch';
import type { ProviderInfo } from '~/types/model';
import Cookies from 'js-cookie';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

const apiKeyMemoizeCache: { [k: string]: Record<string, string> } = {};

export function getApiKeysFromCookies() {
  const storedApiKeys = Cookies.get('apiKeys');
  let parsedKeys = {};

  if (storedApiKeys) {
    parsedKeys = apiKeyMemoizeCache[storedApiKeys];

    if (!parsedKeys) {
      parsedKeys = apiKeyMemoizeCache[storedApiKeys] = JSON.parse(storedApiKeys);
    }
  }

  return parsedKeys;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isPromptCachingEnabled, setIsPromptCachingEnabled] = useState(() => {
    // Read initial state from localStorage, defaulting to true
    const savedState = localStorage.getItem('PROMPT_CACHING_ENABLED');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    // Update localStorage whenever the prompt caching state changes
    localStorage.setItem('PROMPT_CACHING_ENABLED', JSON.stringify(isPromptCachingEnabled));
  }, [isPromptCachingEnabled]);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start sm:items-center mt-2 mb-2 flex-col sm:flex-row">
        <div>
          <span className="text-sm text-bolt-elements-textSecondary">{provider?.name} API Key:</span>
          {!isEditing && (
            <div className="flex items-center">
              <span className="flex-1 text-xs text-bolt-elements-textPrimary mr-2">
                {apiKey ? '••••••••' : 'Not set (will still work if set in .env file)'}
              </span>
              <IconButton onClick={() => setIsEditing(true)} title="Edit API Key">
                <div className="i-ph:pencil-simple" />
              </IconButton>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-3 mt-2">
            <input
              type="password"
              value={tempKey}
              placeholder="Your API Key"
              onChange={(e) => setTempKey(e.target.value)}
              className="flex-1 px-2 py-1 text-xs lg:text-sm rounded border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
            />
            <IconButton onClick={handleSave} title="Save API Key">
              <div className="i-ph:check" />
            </IconButton>
            <IconButton onClick={() => setIsEditing(false)} title="Cancel">
              <div className="i-ph:x" />
            </IconButton>
          </div>
        ) : (
          <>
            {provider?.getApiKeyLink && (
              <IconButton className="ml-auto" onClick={() => window.open(provider?.getApiKeyLink)} title="Edit API Key">
                <span className="mr-2 text-xs lg:text-sm">{provider?.labelForGetApiKey || 'Get API Key'}</span>
                <div className={provider?.icon || 'i-ph:key'} />
              </IconButton>
            )}
          </>
        )}
      </div>

      {provider?.name === 'Anthropic' && (
        <div className="border-t pt-4 pb-4 -mt-4">
          <div className="flex items-center space-x-2">
            <Switch checked={isPromptCachingEnabled} onCheckedChange={setIsPromptCachingEnabled} />
            <label htmlFor="prompt-caching" className="text-sm text-bolt-elements-textSecondary">
              Enable Prompt Caching
            </label>
          </div>
          <p className="text-xs text-bolt-elements-textTertiary mt-2">
            When enabled, allows caching of prompts for 10x cheaper responses. Recommended for Claude models.
          </p>
        </div>
      )}
    </div>
  );
};
