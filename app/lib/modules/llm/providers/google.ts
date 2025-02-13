import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export default class GoogleProvider extends BaseProvider {
  name = 'Google';
  getApiKeyLink = 'https://aistudio.google.com/app/apikey';

  config = {
    apiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  staticModels: ModelInfo[] = [
    { name: 'gemini-2.0-pro-exp-02-05', label: 'Gemini 2.0 Pro (exp)', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-2.0-flash-thinking-exp-01-21', label: 'Gemini 2.0 Flash (thinking)', provider: 'Google', maxTokenAllowed: 8192 },
    { name: 'gemini-exp-1206', label: 'Gemini exp-1206', provider: 'Google', maxTokenAllowed: 8192 },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    return google(model);
  }
}
