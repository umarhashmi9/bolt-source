import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class GroqProvider extends BaseProvider {
  name = 'Groq';
  getApiKeyLink = 'https://console.groq.com/keys';

  config = {
    apiTokenKey: 'GROQ_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70b', provider: 'Groq', maxTokenAllowed: 8000 },
    { name: 'deepseek-r1-distill-qwen-32b', label: 'DeepSeek R1 Distill Qwen 32b', provider: 'Groq', maxTokenAllowed: 8000 },
    { name: 'qwen-2.5-32b', label: 'Qwen 2.5 32b', provider: 'Groq', maxTokenAllowed: 8000 },
    { name: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70b', provider: 'Groq', maxTokenAllowed: 8000 },
    { name: 'llama-3.1-8b-instant', label: 'Llama 3.1 8b', provider: 'Groq', maxTokenAllowed: 8000 },
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
      defaultApiTokenKey: 'GROQ_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    });

    return openai(model);
  }
}
