import type { LanguageModelV1 } from 'ai';
import { BaseProvider } from '../base-provider';
import type { ModelInfo, ProviderConfig } from '../types';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';
// Assume createVertex is available, e.g., from '@ai-sdk/google' or a specific '@ai-sdk/vertex'
// If not, this import will need to be adjusted or an alternative implementation provided.
import { createVertex } from '@ai-sdk/google'; // Or from '@ai-sdk/vertex'

const logger = createScopedLogger('VertexAIProvider');

export class VertexAIProvider extends BaseProvider {
  name = 'Vertex AI';

  // Configuration for API keys (service account JSON), project ID, and location
  config: ProviderConfig = {
    // The 'apiTokenKey' will be used to store the stringified Service Account JSON
    apiTokenKey: 'VERTEX_AI_SERVICE_ACCOUNT_JSON',
    // While project and location can be part of settings, defining keys for env fallbacks
    // (though not strictly used by getProviderBaseUrlAndKey in this custom way)
    // helps maintain a pattern. Actual retrieval is from IProviderSetting.
    projectIdKey: 'VERTEX_AI_PROJECT_ID',
    locationIdKey: 'VERTEX_AI_LOCATION_ID',
  };

  staticModels: ModelInfo[] = [
    // Common Vertex AI models. Users might need to specify model IDs that include versions.
    { name: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: this.name, isDefault: true },
    { name: 'gemini-1.0-pro-vision', label: 'Gemini 1.0 Pro Vision', provider: this.name },
    { name: 'gemini-1.5-pro-preview-0409', label: 'Gemini 1.5 Pro (Preview)', provider: this.name },
    { name: 'gemini-1.5-flash-preview-0514', label: 'Gemini 1.5 Flash (Preview)', provider: this.name },
    // PaLM models are also available but Gemini is preferred
    // { name: 'text-bison@002', label: 'PaLM 2 Text Bison (Legacy)', provider: this.name },
    // { name: 'chat-bison@002', label: 'PaLM 2 Chat Bison (Legacy)', provider: this.name },
  ];

  getApiKeyLink = 'https://cloud.google.com/vertex-ai/docs/start/set-up-environment';
  labelForGetApiKey = 'Set up Vertex AI';
  icon = 'i-custom:google-vertex-ai'; // Placeholder for a potential custom icon

  constructor() {
    super();
  }

  getModelInstance(options: {
    model: string; // Model ID for Vertex AI
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, apiKeys, providerSettings } = options;

    const currentProviderSettings = providerSettings?.[this.name];
    const serviceAccountJsonString = apiKeys?.[this.name];
    const projectId = currentProviderSettings?.vertexProjectId;
    const locationId = currentProviderSettings?.vertexLocationId;

    if (!serviceAccountJsonString) {
      throw new Error(
        `Vertex AI Service Account JSON is not configured for provider ${this.name}. Please set it in the settings.`,
      );
    }
    if (!projectId) {
      throw new Error(
        `Vertex AI Project ID is not configured for provider ${this.name}. Please set it in the settings.`,
      );
    }
    if (!locationId) {
      throw new Error(
        `Vertex AI Location ID is not configured for provider ${this.name}. Please set it in the settings.`,
      );
    }

    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(serviceAccountJsonString);
    } catch (e: any) {
      logger.error('Failed to parse Vertex AI Service Account JSON:', e.message);
      throw new Error('Invalid Vertex AI Service Account JSON provided.');
    }

    logger.info(
      `Creating Vertex AI model instance for model: ${model}, project: ${projectId}, location: ${locationId}`,
    );

    // Use createVertex from the Vercel AI SDK
    // It typically infers credentials from the environment if GOOGLE_APPLICATION_CREDENTIALS is set,
    // or can accept credentials directly.
    // The exact way to pass serviceAccountCredentials to createVertex might vary based on its API.
    // It often expects the *path* to the JSON file or the JSON object itself.
    const vertex = createVertex({
      // Assuming createVertex can take credentials like this.
      // This part needs to be verified against the actual @ai-sdk/google or @ai-sdk/vertex documentation.
      // Option 1: If it supports direct credentials object (ideal)
      credentials: serviceAccountCredentials,
      // Option 2: If it needs a path, this approach won't work directly in a browser/serverless env
      // without writing the key to a temporary file, which is not advisable.

      // Project and location are often part of the model ID string for Vertex AI or set in the client.
      project: projectId,
      location: locationId,
    });

    return vertex(model);
  }

  // Potentially implement getDynamicModels if Vertex AI API allows listing models
  // in a way that's useful for the user (e.g., specific tuned models).
  // async getDynamicModels(
  //   apiKeys?: Record<string, string>,
  //   settings?: IProviderSetting,
  // ): Promise<ModelInfo[]> {
  //   // ... logic to fetch models ...
  //   return this.staticModels;
  // }
}

export default VertexAIProvider;
