import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class CloudflareProvider extends BaseProvider {
  name = 'Cloudflare';
  getApiKeyLink = 'https://dash.cloudflare.com/profile/api-tokens';

  config = {
    apiTokenKey: 'CLOUDFLARE_API_TOKEN',
    accountIdKey: 'CLOUDFLARE_ACCOUNT_ID',
  };

  staticModels: ModelInfo[] = [
    { name: '@cf/meta/llama-2-7b-chat-int8', label: 'Llama-2-7b-chat-int8', provider: 'Cloudflare', maxTokenAllowed: 4096 },
    { name: '@cf/meta/llama-2-7b-chat-fp16', label: 'Llama-2-7b-chat-fp16', provider: 'Cloudflare', maxTokenAllowed: 4096 },
    { name: '@cf/mistral/mistral-7b-instruct-v0.1', label: 'Mistral-7b-instruct', provider: 'Cloudflare', maxTokenAllowed: 4096 },
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
      defaultApiTokenKey: 'CLOUDFLARE_API_TOKEN',
    });

    const accountId = serverEnv?.CLOUDFLARE_ACCOUNT_ID || process?.env?.CLOUDFLARE_ACCOUNT_ID;

    if (!apiKey) {
      throw new Error(`Missing API token for ${this.name} provider`);
    }

    if (!accountId) {
      throw new Error(`Missing Account ID for ${this.name} provider`);
    }

    const openai = createOpenAI({
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
      apiKey,
    });

    return openai(model);
  }
}
