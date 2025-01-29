import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logger } from '~/utils/logger';

// Define interface for Groq API model information based on the provided JSON response.
interface GroqApiModelInfo {
  id: string;             // Model ID (e.g., 'llama-3.1-8b-instant')
  object: string;         // Type of object, should be "model"
  created: number;        // Timestamp of model creation
  owned_by: string;       // Organization owning the model (e.g., "Meta", "Google")
  active: boolean;        // Indicates if the model is currently active
  context_window: number; // Maximum context window (tokens) for the model
  public_apps: null;      //  Currently always null in the response
}

interface GroqListModelsResponse {
  object: string;        // Type of object, should be "list"
  data: GroqApiModelInfo[]; // Array of model information objects
}


export default class GroqProvider extends BaseProvider {
  name = 'Groq';
  getApiKeyLink = 'https://console.groq.com/keys';

  config = {
    apiTokenKey: 'GROQ_API_KEY',
  };

  staticModels: ModelInfo[] = []; // Static list is now empty, dynamic models will be fetched

  /**
   * Fetches the list of available models dynamically from the Groq API.
   *
   * @param apiKeys - Optional record of API keys.
   * @param settings - Optional provider settings.
   * @param serverEnv - Server environment variables.
   * @returns A promise that resolves to an array of ModelInfo objects representing the dynamically fetched models.
   */
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    try {
      // 1. Retrieve the API key using the helper function `getProviderBaseUrlAndKey`.
      const { apiKey } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv,
        defaultBaseUrlKey: '',
        defaultApiTokenKey: 'GROQ_API_KEY',
      });

      // 2. Check if the API key is present. If not, throw an error.
      if (!apiKey) {
        throw new Error(`Missing API key for ${this.name} provider`);
      }

      // 3. Define the base URL for the Groq OpenAI-compatible API and the models endpoint.
      const baseUrl = 'https://api.groq.com/openai/v1';
      const url = `${baseUrl}/models`;

      // 4. Fetch data from the Groq API. Include Authorization header with the API key.
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json', // Explicitly set content type as JSON
        },
      });

      // 5. Handle potential errors during the API request.
      if (!response.ok) {
        logger.error(`Groq API models fetch failed with status ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to fetch Groq models: ${response.status} ${response.statusText}`);
      }

      // 6. Parse the JSON response from the API.
      const data: GroqListModelsResponse = (await response.json()) as GroqListModelsResponse;

      // 7. Map the Groq API model information to the application's `ModelInfo` format.
      if (data.data) {
        return data.data.map((model) => {
          return {
            name: model.id, // Use model ID as name
            label: `${model.id} (Groq)`, // Create a label including provider name
            provider: this.name,
            maxTokenAllowed: model.context_window, // Use context_window from Groq API response for maxTokenAllowed
          };
        });
      }
      return []; // Return empty array if no models are found in the response
    } catch (error) {
      // 8. Handle any errors during the model fetching process. Log the error and return an empty array.
      logger.error('Error fetching dynamic models from Groq API:', error);
      return []; // Return empty array in case of error to avoid app crash
    }
  }


  /**
   * Gets an instance of the OpenAI Language Model (LanguageModelV1) configured to use Groq's API.
   *
   * @param options - Options object containing model name, server environment, API keys, and provider settings.
   * @returns An instance of LanguageModelV1 for making API calls to Groq.
   */
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
