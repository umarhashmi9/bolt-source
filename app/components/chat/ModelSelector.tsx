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
      .filter((p) => {
        // Check if provider has an API key or base URL set
        const settings = apiKeys[p.name];
        if (!settings) return false;
        
        // For providers that need API keys, ensure they have one
        if ('apiKey' in settings && !settings.apiKey) return false;
        
        // For providers that need base URLs, ensure they have one
        if ('baseUrl' in settings && !settings.baseUrl) return false;
        
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providerList, apiKeys]);

  // Handle changes in active providers
  useEffect(() => {
    if (activeProviders.length === 0) {
      // If no providers are active, clear current selection
      setProvider?.(undefined);
      setModel?.(undefined);
      return;
    }

    // If current provider becomes inactive, switch to first active provider
    if (!provider || !apiKeys[provider.name]) {
      const firstProvider = activeProviders[0];
      setProvider?.(firstProvider);
      
      // Set first available model for the new provider
      const firstAvailableModel = modelList.find(m => m.provider === firstProvider.name);
      if (firstAvailableModel) {
        setModel?.(firstAvailableModel.name);
      }
    }
  }, [activeProviders, provider, apiKeys]);

  if (activeProviders.length === 0) {
    return (
      <div className="mb-2 p-3 text-sm text-bolt-elements-textTertiary bg-bolt-elements-background-depth-3 rounded-lg flex items-center justify-between">
        <span>No active providers. Please configure API keys in settings.</span>
        <button
          onClick={() => {
            // Trigger settings modal open (you'll need to implement this)
            document.dispatchEvent(new CustomEvent('openSettings', { detail: { tab: 'api-settings' } }));
          }}
          className="text-xs px-2 py-1 bg-bolt-elements-background-depth-4 hover:bg-bolt-elements-background-depth-5 rounded transition-colors"
        >
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="mb-2 flex gap-2 flex-col sm:flex-row">
      <select
        value={provider?.name ?? ''}
        onChange={(e) => {
          const newProvider = providerList.find((p: ProviderInfo) => p.name === e.target.value);
          if (newProvider && setProvider) {
            setProvider(newProvider);
            
            // When changing provider, select the first available model
            const firstModel = modelList.find((m) => m.provider === newProvider.name);
            if (firstModel && setModel) {
              setModel(firstModel.name);
            }
          }
        }}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {activeProviders.map((provider: ProviderInfo) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
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
        {[...modelList]
          .filter((e) => e.provider === provider?.name && e.name)
          .map((modelOption) => (
            <option key={modelOption.name} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};
