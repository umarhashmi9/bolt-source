import type { ModelInfo } from '~/lib/modules/llm/types';

export type ProviderInfo = {
  staticModels: ModelInfo[];
  name: string;
  getDynamicModels?: (
    providerName: string,
    apiKeys?: Record<string, string>,
    providerSettings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ) => Promise<ModelInfo[]>;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;
};

export interface IProviderSetting {
  enabled?: boolean;
  baseUrl?: string; // Will store Azure Endpoint for Azure OpenAI
  apiKey?: string;  // Standard, will be used for Azure API Key
  azureDeploymentId?: string; // For Azure's deployment ID (can be a default)
  azureApiVersion?: string;   // Optional, e.g., "2023-07-01-preview"
}

export type IProviderConfig = ProviderInfo & {
  settings: IProviderSetting;
};
