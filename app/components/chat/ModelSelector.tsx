import type { ProviderInfo } from '~/types/model';
import { useEffect, useState } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import * as RadixSwitch from '@radix-ui/react-switch';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
  modelLoading,
}: ModelSelectorProps) => {
  const [showFreeModels, setShowFreeModels] = useState(false);

  const filteredModelList =
    provider?.name === 'OpenRouter'
      ? modelList
          .filter((m) => m.provider === 'OpenRouter')
          .sort((a, b) => {
            const getProviderName = (label: string) => {
              const match = label.match(/^([^:]+):/);
              return match ? match[1].toLowerCase() : label.toLowerCase();
            };

            return getProviderName(a.label).localeCompare(getProviderName(b.label));
          })
          .filter((m) => !showFreeModels || m.name.includes(':free'))
      : modelList.filter((m) => m.provider === provider?.name);

  useEffect(() => {
    if (providerList.length === 0) {
      return;
    }

    if (provider && !providerList.map((p) => p.name).includes(provider.name)) {
      const firstEnabledProvider = providerList[0];
      setProvider?.(firstEnabledProvider);

      const firstModel = modelList.find((m) => m.provider === firstEnabledProvider.name);

      if (firstModel) {
        setModel?.(firstModel.name);
      }
    }
  }, [providerList, provider, setProvider, modelList, setModel]);

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
    <div className="w-full max-w-full">
      <div className="mb-2 flex gap-2 flex-col sm:flex-row">
        <select
          className="flex-[0_1_30%] p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all"
          value={provider?.name}
          onChange={(e) => {
            const newProvider = providerList.find((p) => p.name === e.target.value);

            if (newProvider) {
              setProvider?.(newProvider);

              const firstModel = modelList.find((m) => m.provider === newProvider.name);

              if (firstModel) {
                setModel?.(firstModel.name);
              }
            }
          }}
        >
          {providerList.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          className="flex-[1_1_70%] min-w-0 p-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus transition-all truncate"
          value={model}
          onChange={(e) => setModel?.(e.target.value)}
        >
          {modelLoading === 'all' || modelLoading === provider?.name ? (
            <option key={0} value="">
              Loading...
            </option>
          ) : (
            filteredModelList.map((m) => (
              <option key={m.name} value={m.name} className="truncate">
                {m.label}
              </option>
            ))
          )}
        </select>
      </div>

      {provider?.name === 'OpenRouter' && (
        <div className="flex items-center justify-between p-3 mb-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-prompt-background hover:bg-bolt-elements-item-backgroundHover transition-colors">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-bolt-elements-textPrimary">Free Models Only</label>
            <span className="text-xs text-bolt-elements-textSecondary">Show models that are free to use</span>
          </div>
          <RadixSwitch.Root
            checked={showFreeModels}
            onCheckedChange={setShowFreeModels}
            className={`${
              showFreeModels ? 'bg-bolt-elements-item-backgroundAccent' : 'bg-bolt-elements-item-backgroundDefault'
            } relative inline-flex items-center h-[24px] w-[44px] cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:ring-offset-2 focus:ring-offset-bolt-elements-background-depth-1 border border-black/20 shadow-sm`}
          >
            <RadixSwitch.Thumb
              className={`${
                showFreeModels ? 'translate-x-[22px]' : 'translate-x-[2px]'
              } block h-[18px] w-[18px] transform rounded-full bg-white shadow-md transition-transform duration-100 will-change-transform my-auto border border-black/20`}
            />
          </RadixSwitch.Root>
        </div>
      )}
    </div>
  );
};
