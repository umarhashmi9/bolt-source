import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';
import { useEffect } from 'react';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  providerList,
}: ModelSelectorProps) => {
  const { activeProviders } = useSettings();

  useEffect(() => {
    // If current provider is disabled or not in active providers, switch to first active provider
    if ((provider && !activeProviders.find((p) => p.name === provider.name)) || !provider) {
      if (activeProviders.length > 0) {
        const firstEnabledProvider = activeProviders[0];
        setProvider?.(firstEnabledProvider);

        // Also update the model to the first available one for the new provider
        const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

        if (firstModel) {
          setModel?.(firstModel.name);
        }
      }
    }
  }, [activeProviders, provider, setProvider, modelList, setModel]);

  if (activeProviders.length === 0) {
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
        aria-label="Select AI Provider"
        value={provider?.name ?? ''}
        onChange={(e) => {
          const newProvider = activeProviders.find((p: ProviderInfo) => p.name === e.target.value);

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
        {activeProviders.map((provider: ProviderInfo) => (
          <option key={provider.name} value={provider.name}>
            {provider.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Select AI Model"
        key={provider?.name}
        value={model}
        onChange={(e) => setModel?.(e.target.value)}
        className="flex-1 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all lg:max-w-[70%]"
      >
        {modelList
          .filter((m) => m.provider === provider?.name)
          .map((modelOption, index) => (
            <option key={index} value={modelOption.name}>
              {modelOption.label}
            </option>
          ))}
      </select>
    </div>
  );
};
