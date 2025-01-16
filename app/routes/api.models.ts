import { json } from '@remix-run/cloudflare';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';

interface ModelsResponse {
  modelList: ModelInfo[];
  providers: ProviderInfo[];
  defaultProvider: ProviderInfo;
}

export async function loader({ request }: { request: Request }): Promise<Response> {
  const llmManager = LLMManager.getInstance(import.meta.env);

  // Get API keys from header
  const apiKeysHeader = request.headers.get('x-client-api-keys');
  const apiKeys = apiKeysHeader ? JSON.parse(apiKeysHeader) : {};

  // Get all providers and map to ProviderInfo interface
  const providers = llmManager.getAllProviders().map((provider) => ({
    name: provider.name,
    staticModels: provider.staticModels,
    getApiKeyLink: provider.getApiKeyLink,
    labelForGetApiKey: provider.labelForGetApiKey,
    icon: provider.icon,
  }));

  const defaultProvider = {
    name: llmManager.getDefaultProvider().name,
    staticModels: llmManager.getDefaultProvider().staticModels,
    getApiKeyLink: llmManager.getDefaultProvider().getApiKeyLink,
    labelForGetApiKey: llmManager.getDefaultProvider().labelForGetApiKey,
    icon: llmManager.getDefaultProvider().icon,
  };

  const modelList = await llmManager.updateModelList({
    apiKeys,
    providerSettings: {},
    serverEnv: import.meta.env,
  });

  return json<ModelsResponse>({
    modelList,
    providers,
    defaultProvider,
  });
}
