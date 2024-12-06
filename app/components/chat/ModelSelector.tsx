import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/utils/types';
import { classNames } from '~/utils/classNames';

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
}: ModelSelectorProps) => {
  return (
    <div className="mb-4 flex gap-4 flex-row w-full">
      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium leading-none text-bolt-elements-textPrimary">Provider</label>
        <select
          value={provider?.name ?? ''}
          onChange={(e) => {
            const newProvider = providerList.find((p: ProviderInfo) => p.name === e.target.value);

            if (newProvider && setProvider) {
              setProvider(newProvider);
            }

            const firstModel = [...modelList].find((m) => m.provider === e.target.value);

            if (firstModel && setModel) {
              setModel(firstModel.name);
            }
          }}
          className={classNames(
            'flex h-10 w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
            'px-3 py-2 text-sm text-bolt-elements-textPrimary ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {providerList.map((provider: ProviderInfo) => (
            <option key={provider.name} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 flex-1">
        <label className="text-sm font-medium leading-none text-bolt-elements-textPrimary">Model</label>
        <select
          key={provider?.name}
          value={model}
          onChange={(e) => setModel?.(e.target.value)}
          className={classNames(
            'flex h-10 w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1',
            'px-3 py-2 text-sm text-bolt-elements-textPrimary ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {[...modelList]
            .filter((e) => e.provider == provider?.name && e.name)
            .map((modelOption) => (
              <option key={modelOption.name} value={modelOption.name}>
                {modelOption.label}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
