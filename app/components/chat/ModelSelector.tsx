import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';
import { useEffect, useState } from 'react';
import { useSettings } from '~/lib/hooks/useSettings';

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
}: ModelSelectorProps) => {
  const { activeProviders } = useSettings();
  const [enabledProviders, setEnabledProviders] = useState(() => {
    return activeProviders.length > 0 ? activeProviders : providerList;
  });


  // Set initial provider and model if not set
  useEffect(() => {
    if (!provider && enabledProviders.length > 0) {
      const firstProvider = enabledProviders[0];
      setProvider?.(firstProvider);

      const firstModel = modelList.find((m) => m.provider === firstProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [provider, enabledProviders, modelList, setProvider, setModel]);

  // Update enabled providers when activeProviders changes
  useEffect(() => {
    if (activeProviders.length > 0) {
      setEnabledProviders(activeProviders);

      // If current provider is not in active providers, switch to first enabled provider
      if (provider && !activeProviders.find((p) => p.name === provider.name)) {
        const firstEnabledProvider = activeProviders[0];
        setProvider?.(firstEnabledProvider);
      }
    }
  }, [activeProviders, provider, setProvider]);

  // Update model when provider changes
  useEffect(() => {
    if (provider) {
      const availableModels = modelList.filter((m) => m.provider === provider.name);

      if (availableModels.length > 0 && (!model || !availableModels.find((m) => m.name === model))) {
        const firstModel = availableModels[0];
        setModel?.(firstModel.name);
      }
    }
  }, [provider, modelList, model, setModel]);


  if (providerList.length === 0) {
    return (
      <div className="mb-2 p-4 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary">
        <p className="text-center">
          No providers are currently enabled. Please enable at least one provider in the settings to start using the
          chat.
        </p>
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
          }

          const firstModel = modelList.find((m) => m.provider === e.target.value);

          if (firstModel && setModel) {
            setModel(firstModel.name);
          }
        }}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
      >
        {providerList.map((provider: ProviderInfo) => (
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
      >
        {[...modelList]
          .filter((e) => e.provider === provider?.name && e.name)
          .map((modelOption, index) => (
            <option key={index} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};
