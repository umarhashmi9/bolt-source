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
      label: 'Deepseek V3 (Free)',
      provider: 'Chute',
      maxTokenAllowed: 4096,
    },
    {
      name: 'deepseek-ai/DeepSeek-R1-0528',
      label: 'Deepseek R1 (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'tngtech/DeepSeek-R1T-Chimera',
      label: 'DeepSeek-R1T-Chimera (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'microsoft/MAI-DS-R1-FP8',
      label: 'MAI-DS-R1-FP8 (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'Qwen/Qwen3-235B-A22B',
      label: 'Qwen3-235B-A22B (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      label: 'Mistral-Small-3.1-24B-Instruct-2503 (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
      label: 'DeepSeek-R1-0528-Qwen3-8B (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'agentica-org/DeepCoder-14B-Preview',
      label: 'DeepCoder-14B-Preview (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'nvidia/Llama-3_1-Nemotron-Ultra-253B-v1',
      label: 'Llama-3.1-Nemotron-Ultra-253B-v1 (Free)',
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    {
      name: 'ByteDance-Seed/Seed-Coder-8B-Reasoning-bf16', // New model added
      label: 'Seed-Coder-8B-Reasoning-bf16 (Free)', // Label for the new model
      provider: 'Chute',
      maxTokenAllowed: 1024,
    },
    // Add other Chute models here following the same structure
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
