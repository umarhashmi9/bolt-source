import React, { useState, useEffect, useRef } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

const ENV_API_KEY_MAP: Record<string, string> = {
  Anthropic: 'ANTHROPIC_API_KEY',
  OpenAI: 'OPENAI_API_KEY',
  xAI: 'XAI_API_KEY',
  Cohere: 'COHERE_API_KEY',
  Google: 'GOOGLE_API_KEY',
  Groq: 'GROQ_API_KEY',
  HuggingFace: 'HUGGINGFACE_API_KEY',
  Deepseek: 'DEEPSEEK_API_KEY',
  Mistral: 'MISTRAL_API_KEY',
  Together: 'TOGETHER_API_KEY',
  OpenRouter: 'OPENROUTER_API_KEY',
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);
  const previousProvider = useRef(provider.name);

  useEffect(() => {
    if (previousProvider.current !== provider.name) {
      setTempKey('');
      setApiKey('');
      setIsEditing(false);
      previousProvider.current = provider.name;
    }
  }, [provider.name, setApiKey]);

  useEffect(() => {
    const checkEnvApiKey = async () => {
      try {
        const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
        const data = await response.json();
        setIsEnvKeySet((data as { isSet: boolean }).isSet);
      } catch (error) {
        console.error('Failed to check environment API key:', error);
        setIsEnvKeySet(false);
      }
    };

    checkEnvApiKey();
  }, [provider.name]);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bolt-elements-textSecondary">{provider?.name} API Key:</span>
          {!isEditing && (
            <div className="flex items-center gap-2">
              {isEnvKeySet ? (
                <>
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">
                    Set via {ENV_API_KEY_MAP[provider.name]} environment variable
                  </span>
                </>
              ) : apiKey ? (
                <>
                  <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                  <span className="text-xs text-green-500">Set via UI</span>
                </>
              ) : (
                <>
                  <div className="i-ph:x-circle-fill text-red-500 w-4 h-4" />
                  <span className="text-xs text-red-500">Not Set (Please set via UI or ENV_VAR)</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing && !isEnvKeySet ? (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={tempKey}
              placeholder="Enter API Key"
              onChange={(e) => setTempKey(e.target.value)}
              className="w-[300px] px-3 py-1.5 text-sm rounded border border-bolt-elements-borderColor 
                        bg-bolt-elements-prompt-background text-bolt-elements-textPrimary 
                        focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
            />
            <IconButton
              onClick={handleSave}
              title="Save API Key"
              className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
            >
              <div className="i-ph:check w-4 h-4" />
            </IconButton>
            <IconButton
              onClick={() => setIsEditing(false)}
              title="Cancel"
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
            >
              <div className="i-ph:x w-4 h-4" />
            </IconButton>
          </div>
        ) : (
          <>
            {!isEnvKeySet && (
              <IconButton
                onClick={() => setIsEditing(true)}
                title="Edit API Key"
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"
              >
                <div className="i-ph:pencil-simple w-4 h-4" />
              </IconButton>
            )}
            {provider?.getApiKeyLink && !isEnvKeySet && (
              <IconButton
                onClick={() => window.open(provider?.getApiKeyLink)}
                title="Get API Key"
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 flex items-center gap-2"
              >
                <span className="text-xs whitespace-nowrap">{provider?.labelForGetApiKey || 'Get API Key'}</span>
                <div className={`${provider?.icon || 'i-ph:key'} w-4 h-4`} />
              </IconButton>
            )}
          </>
        )}
      </div>
    </div>
  );
};
