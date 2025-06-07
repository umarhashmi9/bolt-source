import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';

export default class ChuteProvider extends BaseProvider {
  name = 'Chute';

  config = {
    apiTokenKey: 'CHUTES_API_TOKEN',
    baseUrl: 'https://llm.chutes.ai/v1',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'deepseek-ai/DeepSeek-V3-0324',
      label: 'Deepseek V3 (Chute)',
      provider: 'Chute',
      maxTokenAllowed: 4096,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { baseUrl, apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '', // Chute has a fixed base URL
      defaultApiTokenKey: 'CHUTES_API_TOKEN',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    if (!baseUrl) {
      throw new Error(`Missing base URL for ${this.name} provider`);
    }

    return getOpenAILikeModel(baseUrl, apiKey, model);
  }
}