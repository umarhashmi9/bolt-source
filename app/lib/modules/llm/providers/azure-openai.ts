import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, Message, LanguageModelV1CallOptions, LanguageModelV1StreamPart } from 'ai';
import { LLMManager } from '~/lib/modules/llm/manager';

interface AzureProviderSetting extends IProviderSetting {
  resourceName?: string;
  apiVersion?: string;
}

interface AzureStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'Azure OpenAI';
  getApiKeyLink = 'https://oai.azure.com';

  config = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    baseUrlKey: 'AZURE_OPENAI_API_BASE_URL',
    apiVersionKey: 'AZURE_OPENAI_API_VERSION',
    resourceNameKey: 'AZURE_OPENAI_RESOURCE_NAME',
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'Azure OpenAI', maxTokenAllowed: 8000 },
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'Azure OpenAI', maxTokenAllowed: 8000 },
  ];

  private _validateConfiguration(
    apiKey?: string,
    baseUrl?: string,
    resourceName?: string,
    apiVersion?: string,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!apiKey) {
      errors.push('API key is missing');
    }

    if (!baseUrl) {
      errors.push('Base URL is missing');
    }

    if (!resourceName) {
      errors.push('Resource name is missing');
    }

    if (!apiVersion) {
      errors.push('API version is missing');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private _getAzureConfig(options: {
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
    serverEnv: Record<string, string>;
  }) {
    const { apiKeys, providerSettings, serverEnv } = options;
    const settings = providerSettings?.[this.name] as AzureProviderSetting;
    const manager = LLMManager.getInstance();

    const { apiKey, baseUrl } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv,
      defaultBaseUrlKey: this.config.baseUrlKey,
      defaultApiTokenKey: this.config.apiTokenKey,
    });

    console.debug('Azure OpenAI Config Sources:', {
      'Provider Settings Resource Name': settings?.resourceName,
      'API Keys Resource Name': apiKeys?.[this.config.resourceNameKey],
      'Server Env Resource Name': serverEnv?.[this.config.resourceNameKey],
      'Process Env Resource Name': process?.env?.[this.config.resourceNameKey],
      'Manager Env Resource Name': manager.env?.[this.config.resourceNameKey],
      'Provider Settings API Version': settings?.apiVersion,
      'API Keys API Version': apiKeys?.[this.config.apiVersionKey],
      'Server Env API Version': serverEnv?.[this.config.apiVersionKey],
      'Process Env API Version': process?.env?.[this.config.apiVersionKey],
      'Manager Env API Version': manager.env?.[this.config.apiVersionKey],
    });

    const resourceName =
      settings?.resourceName ||
      apiKeys?.[this.config.resourceNameKey] ||
      serverEnv?.[this.config.resourceNameKey] ||
      process?.env?.[this.config.resourceNameKey] ||
      manager.env?.[this.config.resourceNameKey];

    const apiVersion =
      settings?.apiVersion ||
      apiKeys?.[this.config.apiVersionKey] ||
      serverEnv?.[this.config.apiVersionKey] ||
      process?.env?.[this.config.apiVersionKey] ||
      manager.env?.[this.config.apiVersionKey];

    console.debug('Azure OpenAI Config Result:', {
      resourceName,
      apiVersion,
      baseUrl,
      hasApiKey: !!apiKey,
    });

    return {
      apiKey,
      baseUrl,
      resourceName,
      apiVersion,
    };
  }

  private async _streamCompletion(options: {
    model: string;
    messages: Message[];
    apiKey: string;
    baseUrl: string;
    resourceName: string;
    apiVersion: string;
    signal?: AbortSignal;
  }): Promise<ReadableStream<LanguageModelV1StreamPart>> {
    const { model, messages, apiKey, baseUrl, resourceName, apiVersion, signal } = options;

    console.debug('Azure OpenAI Request:', {
      model,
      messageCount: messages.length,
      hasApiKey: !!apiKey,
      baseUrl,
      resourceName,
      apiVersion,
    });

    const url = `${baseUrl}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
        Accept: 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        messages,
        stream: true,
        model,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Azure OpenAI Error Response:', error);
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}\n${error}`);
    }

    if (!response.body) {
      throw new Error('No response body received from Azure OpenAI API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              if (buffer.trim()) {
                // Process any remaining data in the buffer
                const chunks = buffer.split('\n').filter(Boolean);

                for (const chunk of chunks) {
                  if (chunk.startsWith('data: ')) {
                    const jsonStr = chunk.slice(6);

                    if (jsonStr === '[DONE]') {
                      continue;
                    }

                    try {
                      const json: AzureStreamChunk = JSON.parse(jsonStr);
                      const text = json.choices[0]?.delta?.content || '';

                      if (text) {
                        controller.enqueue({ type: 'text-delta', textDelta: text });
                      }
                    } catch (e) {
                      console.error('Error parsing JSON:', e, jsonStr);
                    }
                  }
                }
              }

              break;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

            for (const line of lines) {
              const trimmedLine = line.trim();

              if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
                continue;
              }

              const jsonStr = trimmedLine.slice(6);

              if (jsonStr === '[DONE]') {
                continue;
              }

              try {
                const json: AzureStreamChunk = JSON.parse(jsonStr);
                const text = json.choices[0]?.delta?.content || '';

                if (text) {
                  controller.enqueue({ type: 'text-delta', textDelta: text });
                }
              } catch (e) {
                console.error('Error parsing JSON:', e, jsonStr);
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    // Only proceed if this model is from our provider
    if (!this.staticModels.some((m) => m.name === options.model)) {
      throw new Error(`Model ${options.model} is not supported by ${this.name} provider`);
    }

    const { model, serverEnv, apiKeys, providerSettings } = options;

    // Convert serverEnv to Record<string, string> safely
    const envAsRecord: Record<string, string> = {};
    Object.entries(serverEnv).forEach(([key, value]) => {
      if (typeof value === 'string') {
        envAsRecord[key] = value;
      }
    });

    console.debug('Azure OpenAI Server Environment:', {
      raw: serverEnv,
      converted: envAsRecord,
      resourceNameKey: this.config.resourceNameKey,
      resourceNameValue: envAsRecord[this.config.resourceNameKey],
    });

    const { apiKey, baseUrl, resourceName, apiVersion } = this._getAzureConfig({
      apiKeys,
      providerSettings,
      serverEnv: envAsRecord,
    });

    // Validate all required configuration
    const { isValid, errors } = this._validateConfiguration(apiKey, baseUrl, resourceName, apiVersion);

    if (!isValid) {
      const errorMessage = `Configuration errors for ${this.name} provider:\n${errors.join('\n')}`;
      console.error(errorMessage, {
        hasApiKey: !!apiKey,
        hasBaseUrl: !!baseUrl,
        hasResourceName: !!resourceName,
        hasApiVersion: !!apiVersion,
        envKeys: Object.keys(envAsRecord),
      });
      throw new Error(errorMessage);
    }

    const languageModel: LanguageModelV1 = {
      specificationVersion: 'v1',
      provider: this.name,
      modelId: model,
      defaultObjectGenerationMode: 'json',
      doStream: async (options: LanguageModelV1CallOptions) => {
        const prompt = options.prompt as Message[];
        const stream = await this._streamCompletion({
          model,
          messages: prompt,
          apiKey,
          baseUrl,
          resourceName,
          apiVersion,
          signal: options.abortSignal,
        });

        return {
          stream,
          rawCall: {
            rawPrompt: prompt,
            rawSettings: {
              model,
              stream: true,
            },
          },
        };
      },
      doGenerate: async () => {
        throw new Error('doGenerate is not supported by Azure OpenAI provider');
      },
    };

    return languageModel;
  }

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    /*
     * Azure OpenAI deployments expose a single model per endpoint.
     * Dynamic model fetching is not supported.
     */
    return [];
  }
}
