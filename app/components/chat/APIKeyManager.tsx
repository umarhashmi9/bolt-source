import React, { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';

interface APIKeyManagerProps {
  provider: Pick<ProviderInfo, 'name' | 'getApiKeyLink' | 'labelForGetApiKey' | 'icon'>;
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
  };

  return (
    <div className="flex items-start sm:items-center mt-2 mb-2 flex-col sm:flex-row">
      {!isEditing ? (
        <div className="flex items-center w-full">
          <span className="flex-1 text-xs text-bolt-elements-textPrimary mr-2">
            {apiKey ? '••••••••' : 'Not set (will still work if set in .env file)'}
          </span>
          <IconButton onClick={() => setIsEditing(true)} title="Edit API Key">
            <div className="i-ph:pencil-simple" />
          </IconButton>
          {provider.getApiKeyLink && (
            <IconButton className="ml-2" onClick={() => window.open(provider.getApiKeyLink)} title="Get API Key">
              <span className="mr-2 text-xs lg:text-sm">{provider.labelForGetApiKey || 'Get API Key'}</span>
              <div className={provider.icon || 'i-ph:key'} />
            </IconButton>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
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
      )}
    </div>
  );
};
