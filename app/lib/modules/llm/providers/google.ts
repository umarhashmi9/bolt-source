import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logger } from '~/utils/logger';

// Define interfaces to structure the Google API responses for model listing.
interface GoogleListModelsResponse {
  models: GoogleApiModelInfo[]; // Array of model information objects.
  nextPageToken?: string;      // Token for pagination if more models are available.
}

interface GoogleApiModelInfo {
  name: string;             // Unique name of the model (e.g., 'models/gemini-pro').
  version: string;          // Version of the model.
  displayName: string;      // Human-readable name of the model (e.g., 'Gemini Pro').
  description: string;      // Description of the model.
  inputTokenLimit: number;  // Maximum number of input tokens the model can handle.
  outputTokenLimit: number; // Maximum number of output tokens the model can generate.
  // ... other fields from the Google API response that are not used here are omitted for brevity.
}


export default class GoogleProvider extends BaseProvider {
  name = 'Google'; // Provider name, used for identifying this provider in the application.
  getApiKeyLink = 'https://aistudio.google.com/app/apikey'; // Link to Google AI Studio to get an API key.

  config = {
    apiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY', // Key used to retrieve the Google API token from environment variables or settings.
  };

  staticModels: ModelInfo[] = []; //  No longer using static models, this array is now empty as models are fetched dynamically.

  /**
   * Fetches the list of available models dynamically from the Google API.
   *
   * @param apiKeys - Optional record of API keys, potentially from different sources.
   * @param settings - Optional provider settings, potentially containing API keys.
   * @param serverEnv - Server environment variables, used as a fallback for API keys.
   * @returns A promise that resolves to an array of ModelInfo objects representing the dynamically fetched models.
   */
  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    try {
      // 1. Retrieve the API key using the helper function `getProviderBaseUrlAndKey`.
      //    This function handles优先级 of API key sources: provider settings > apiKeys param > serverEnv.
      const { apiKey } = this.getProviderBaseUrlAndKey({
        apiKeys,
        providerSettings: settings,
        serverEnv,
        defaultBaseUrlKey: '', // Google API doesn't use a base URL that needs to be configured separately.
        defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY', // Fallback key to look for in environment variables.
      });

      // 2. Check if the API key is present. If not, throw an error.
      if (!apiKey) {
        throw new Error(`Missing API key for ${this.name} provider`);
      }

      // 3. Define the base URL for the Google Generative Language API.
      const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'; // or 'https://generativelanguage.google.com/v1beta' - using the recommended one.

      // 4. Initialize an array to store all fetched models and a variable for pagination token.
      let allModels: GoogleApiModelInfo[] = [];
      let nextPageToken: string | undefined;

      // 5. Implement pagination to fetch all models. Google API might return models in pages.
      do {
        // Construct the API URL to list models. Includes API key and pagination token if available.
        const url = `${baseUrl}/models?key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        // Fetch data from the Google API.
        const response = await fetch(url);

        // 6. Handle potential errors during the API request.
        if (!response.ok) {
          logger.error(`Google API models fetch failed with status ${response.status}: ${response.statusText}`);
          throw new Error(`Failed to fetch Google models: ${response.status} ${response.statusText}`);
        }

        // 7. Parse the JSON response from the API.
        const data: GoogleListModelsResponse = (await response.json()) as GoogleListModelsResponse;
        // 8. If models are returned in the response, append them to the `allModels` array.
        if (data.models) {
          allModels = [...allModels, ...data.models];
        }
        // 9. Update the `nextPageToken` for the next iteration if more pages are available.
        nextPageToken = data.nextPageToken;
      } while (nextPageToken); // Continue fetching as long as there is a `nextPageToken`.


      // 10. Map the Google API model information to the application's `ModelInfo` format.
      return allModels.map((model) => {
        const modelName = model.name.replace('models/', ''); // Remove 'models/' prefix from the model name for cleaner usage in the application.
        return {
          name: modelName, // Use the cleaned model name.
          label: model.displayName || modelName, // Use `displayName` if available, otherwise fallback to the model `name`.
          provider: this.name, // Set the provider name to 'Google'.
          maxTokenAllowed: model.inputTokenLimit, // Use the input token limit from the Google API response.
        };
      });
    } catch (error) {
      // 11. Handle any errors during the model fetching process. Log the error and return an empty array to prevent application crashes.
      logger.error('Error fetching dynamic models from Google API:', error);
      return []; // Return empty array in case of error to avoid app crash
    }
  }


  /**
   * Gets an instance of the Google Language Model (LanguageModelV1) for making API calls.
   *
   * @param options - Options object containing model name, server environment, API keys, and provider settings.
   * @returns An instance of LanguageModelV1 configured with the specified model and API key.
   */
  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    // 1. Retrieve the API key, similar to `getDynamicModels` method.
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name], // Access provider settings specific to 'Google'.
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    });

    // 2. Check if API key is available, throw error if not.
    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // 3. Initialize the Google Generative AI SDK with the API key.
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    // 4. Return an instance of LanguageModelV1 for the specified model.
    return google(model);
  }
}
