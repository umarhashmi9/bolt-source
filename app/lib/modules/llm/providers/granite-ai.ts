import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
// We are not using a specific AI SDK for Granite, so no 'ai' package imports here for model instantiation.

export interface GraniteAIProviderOptions {
  model: string;
  prompt: string;
  stream?: boolean;
  providerSettings?: IProviderSetting; // Re-using IProviderSetting for consistency
  signal?: AbortSignal;
}

export default class GraniteAIProvider extends BaseProvider {
  name = 'GraniteAI';
  // TODO: Update with actual link if available
  getApiKeyLink = 'https://www.ibm.com/granite'; // Placeholder

  config = {
    apiTokenKey: 'GRANITE_AI_API_KEY',
    baseUrlKey: 'GRANITE_AI_BASE_URL',
  };

  staticModels: ModelInfo[] = []; // Will be populated by getDynamicModels

  constructor() {
    super();
    // Constructor is light, config is applied in methods.
  }

  private getGraniteConfig(settings?: IProviderSetting): {
    apiKey: string;
    baseUrl: string;
  } {
    const apiKey = settings?.apiKey || this.getEnv(this.config.apiTokenKey) || '';
    const baseUrl = settings?.baseUrl || this.getEnv(this.config.baseUrlKey) || '';

    if (!apiKey) {
      console.warn(`Granite AI API key is missing for provider ${this.name}.`);
      // throw new Error(`Granite AI API key is missing for provider ${this.name}.`);
    }
    if (!baseUrl) {
      console.warn(`Granite AI Base URL is missing for provider ${this.name}.`);
      // throw new Error(`Granite AI Base URL is missing for provider ${this.name}.`);
    }

    return { apiKey, baseUrl };
  }

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    _serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const config = this.getGraniteConfig(settings);
    // Ensure config is present, even if not used for this hardcoded list yet
    if (!config.apiKey || !config.baseUrl) {
      // Provider not configured, return no models
      return [];
    }

    return [
      {
        id: 'granite-model-example', // Example model ID
        name: 'Granite Model (Example)',
        provider: this.name,
        maxTokenAllowed: 8000, // Example token limit
      },
      // Add other Granite models if known
    ];
  }

  // This generate method is specific to GraniteAIProvider and uses fetch directly.
  // It does not return a LanguageModelV1 instance from the 'ai' SDK.
  async generate(options: GraniteAIProviderOptions): Promise<string> {
    const { model, prompt, stream, providerSettings, signal } = options;

    const { apiKey, baseUrl } = this.getGraniteConfig(providerSettings);

    if (!apiKey || !baseUrl) {
      throw new Error(`Granite AI provider is not configured. Missing API key or base URL.`);
    }

    // TODO: Confirm the actual API endpoint for Granite AI
    const apiEndpoint = `${baseUrl}/v1/chat/completions`; // Common pattern, adjust if needed

    const payload = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      stream: stream || false, // Default to non-streaming
    };

    // TODO: Implement actual streaming support if required by the application.
    // For now, stream: false is hardcoded in payload effectively,
    // and we will parse a JSON response.
    if (stream) {
      console.warn('GraniteAIProvider: Streaming requested but not fully implemented. Returning non-streamed response.');
      // For true streaming, would return response.body ReadableStream here,
      // and the caller would need to handle it (e.g. using AI SDK's stream processing).
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Granite AI API request failed with status ${response.status} ${response.statusText}: ${errorBody}`);
    }

    const jsonResponse = await response.json();

    // TODO: Adjust based on actual Granite AI response structure.
    // Common paths: choices[0].message.content or choices[0].text
    const messageContent = jsonResponse.choices?.[0]?.message?.content || jsonResponse.choices?.[0]?.text;

    if (typeof messageContent !== 'string') {
      console.error('Granite AI response format unexpected:', jsonResponse);
      throw new Error('Granite AI provider received an unexpected response format.');
    }

    return messageContent;
  }

  // getModelInstance is typically for AI SDK integration.
  // Since Granite is using fetch directly via `generate`, this might not be needed
  // or would need to return a custom object that wraps `generate`.
  // For this subtask, we are focusing on the direct `generate` method.
  /*
  getModelInstance(options: {
    model: string;
    providerSettings?: Record<string, IProviderSetting>;
  }): any { // Return type would need to be compatible with how LLMManager uses it
    // This would need to return an object that has methods expected by the calling code,
    // potentially wrapping the `this.generate` call.
    // For example:
    // return {
    //   generate: async (promptContent: string) => this.generate({
    //     model: options.model,
    //     prompt: promptContent,
    //     providerSettings: options.providerSettings?.[this.name]
    //   })
    // };
    throw new Error("getModelInstance not implemented for GraniteAIProvider in this manner. Use generate().");
  }
  */
}
