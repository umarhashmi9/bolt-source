import { useEffect, useState } from 'react';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  providerList,
  apiKeys,
}: ModelSelectorProps) => {
  const [modelList, setModelList] = useState<ModelInfo[]>([]);
  const [dynamicModelList, setDynamicModelList] = useState<ModelInfo[]>([]);

  useEffect(() => {
    if (provider && provider.getDynamicModels) {
      provider.getDynamicModels(apiKeys[provider.name]).then((x) => setDynamicModelList(x));
    } else {
      setDynamicModelList([]);
    }
  }, [provider, apiKeys]);
  useEffect(() => {
    setModelList([...(provider?.staticModels || []), ...dynamicModelList]);
  }, [provider, dynamicModelList, apiKeys]);
  useEffect(() => {
    if (!modelList.some((x) => x.name == model)) {
      const firstModel = modelList[0];

      if (firstModel && setModel) {
        setModel(firstModel.name);
      }
    }
  }, [modelList]);

  return (
    <div className="mb-2 flex gap-2 flex-col sm:flex-row">
      <select
        value={provider?.name ?? ''}
        onChange={(e) => {
          const newProvider = providerList.find((p: ProviderInfo) => p.name === e.target.value);

          if (newProvider && setProvider) {
            setProvider(newProvider);
          }

          const firstModel = modelList[0];

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
        {modelList.map((modelOption) => (
          <option key={modelOption.name} value={modelOption.name}>
            {modelOption.label}
          </option>
        ))}
      </select>
    </div>
  );
};
