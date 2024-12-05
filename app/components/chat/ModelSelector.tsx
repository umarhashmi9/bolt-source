import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';
import { useEffect, useMemo } from 'react';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  apiKeys,
}: ModelSelectorProps) => {
  // Get active providers with proper configuration
  const activeProviders = useMemo(() => {
    return providerList
      .filter((p: ProviderInfo) => {
        const settings = apiKeys[p.name];
        // Special handling for Ollama and LM Studio - require explicit URL input
        if (p.name === 'Ollama' || p.name === 'LMStudio') {
          return settings?.baseUrl && settings.baseUrl !== 'http://localhost:11434' && settings.baseUrl !== 'http://localhost:1234';
        }
        return settings && (
          // Either has API key if required
          (!('apiKey' in settings) || settings.apiKey) &&
          // Or has base URL if required
          (!('baseUrl' in settings) || settings.baseUrl)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providerList, apiKeys]);

  // Only update provider if current one becomes inactive
  useEffect(() => {
    const currentProviderIsActive = provider && apiKeys[provider.name];
    
    if (!currentProviderIsActive && activeProviders.length > 0) {
      const newProvider = activeProviders[0];
      setProvider?.(newProvider);
      
      const newModel = modelList.find(m => m.provider === newProvider.name);
      if (newModel) {
        setModel?.(newModel.name);
      }
    }
  }, [apiKeys, activeProviders.length]);

  if (activeProviders.length === 0) {
    return (
      <div className="mb-2 p-3 text-sm text-bolt-elements-textTertiary bg-bolt-elements-background-depth-3 rounded-lg">
        <span>No active providers. Please configure API keys in settings.</span>
      </div>
    );
  }

  const handleProviderChange = (providerName: string) => {
    const newProvider = providerList.find((p: ProviderInfo) => p.name === providerName);
    if (!newProvider || !setProvider) return;
    
    setProvider(newProvider);
    
    const newModel = modelList.find(m => m.provider === providerName);
    if (newModel && setModel) {
      setModel(newModel.name);
    }
  };

  return (
    <div className="mb-2 flex gap-2 flex-col sm:flex-row">
      <select
        value={provider?.name ?? ''}
        onChange={(e) => handleProviderChange(e.target.value)}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {activeProviders.map((p: ProviderInfo) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        key={provider?.name}
        value={model}
        onChange={(e) => setModel?.(e.target.value)}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all lg:max-w-[70%]"
        disabled={!provider}
      >
        {modelList
          .filter((m) => m.provider === provider?.name && m.name)
          .map((modelOption) => (
            <option key={modelOption.name} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};
