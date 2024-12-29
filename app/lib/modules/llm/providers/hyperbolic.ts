import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class HyperbolicProvider extends BaseProvider {
  name = 'Hyperbolic';
  getApiKeyLink = 'https://hyperbolic.xyz/settings';

  config = {
    apiTokenKey: 'HYPERBOLIC_API_KEY',
    //baseUrlKey: 'HYPERBOLIC_API_BASE_URL',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'Qwen/Qwen2.5-Coder-32B-Instruct',
      label: 'Qwen 2.5 Coder 32B Instruct',
      provider: 'Hyperbolic',
      maxTokenAllowed: 8192,
    },
    {
      name: 'Qwen/Qwen2.5-72B-Instruct',
      label: 'Qwen2.5-72B-Instruct',
      provider: 'Hyperbolic',
      maxTokenAllowed: 8192,
    },
    {
      name: 'deepseek-ai/DeepSeek-V2.5',
      label: 'DeepSeek-V2.5',
      provider: 'Hyperbolic',
      maxTokenAllowed: 8192,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'HYPERBOLIC_API_KEY',
    });

    if (!apiKey) {
      console.log(`Missing configuration for ${this.name} provider`);
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.hyperbolic.xyz/v1/',
      apiKey,
    });

    return openai(model);
  }
}
