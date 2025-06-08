import type { ModelInfo } from '~/lib/modules/llm/types';

export type ProviderInfo = {
  staticModels: ModelInfo[];
  name: string; // Add 'Azure OpenAI' as a possible value here
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
  baseUrl?: string;
  azureEndpoint?: string; // Add this line for Azure OpenAI endpoint
  vertexProjectId?: string; // Add this line for Vertex AI Project ID
  vertexLocationId?: string; // Add this line for Vertex AI Location ID
  graniteEndpoint?: string; // Add this line for Granite Endpoint
}

export type IProviderConfig = ProviderInfo & {
  settings: IProviderSetting;
};
