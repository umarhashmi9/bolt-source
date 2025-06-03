import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createVertex } from '@ai-sdk/google/vertex'; // Updated import for Vertex AI

export default class VertexAIProvider extends BaseProvider {
  name = 'VertexAI';
  getApiKeyLink = 'https://cloud.google.com/vertex-ai/docs/start/authentication'; // Updated link

  // Configuration keys for .env overrides or direct settings.
  // Vertex AI primarily uses Application Default Credentials (ADC).
  // An explicit API key is not typically used for SDK authentication with Vertex.
  // However, these settings keys are for project and region.
  config = {
    projectIdKey: 'VERTEX_AI_PROJECT_ID',
    regionKey: 'VERTEX_AI_REGION',
    // apiTokenKey could be GOOGLE_APPLICATION_CREDENTIALS path, but SDK handles ADC.
  };

  staticModels: ModelInfo[] = []; // Models will be listed in getDynamicModels

  constructor() {
    super();
    // Constructor is light; config is applied in methods using providerSettings.
  }

  private getVertexConfig(settings?: IProviderSetting): {
    projectId: string;
    region: string;
  } {
    const projectId = settings?.projectId || this.getEnv(this.config.projectIdKey) || '';
    const region = settings?.region || this.getEnv(this.config.regionKey) || '';

    if (!projectId) {
      console.warn(`Vertex AI Project ID is missing for provider ${this.name}.`);
      // Depending on strictness, could throw an error here.
      // throw new Error(`Vertex AI Project ID is missing for provider ${this.name}.`);
    }
    if (!region) {
      console.warn(`Vertex AI Region is missing for provider ${this.name}.`);
      // throw new Error(`Vertex AI Region is missing for provider ${this.name}.`);
    }

    return { projectId, region };
  }

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    _serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { projectId, region } = this.getVertexConfig(settings);

    // For now, returning a hardcoded list.
    // Actual dynamic model fetching for Vertex might require API calls if desired later.
    // This call ensures that project ID and region are checked/logged if missing.
    if (!projectId || !region) {
        // If essential config is missing, might return empty or throw.
        // For now, still returning hardcoded list but warnings are shown.
    }

    return [
      { name: 'gemini-1.5-pro-preview-0409', label: 'Gemini 1.5 Pro (latest preview)', provider: this.name, maxTokenAllowed: 1048576 }, // Example token limit
      { name: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro', provider: this.name, maxTokenAllowed: 32768 },
      { name: 'gemini-1.0-pro-vision', label: 'Gemini 1.0 Pro Vision', provider: this.name, maxTokenAllowed: 16384 },
      { name: 'gemini-flash-preview-0514', label: 'Gemini 1.5 Flash (latest preview)', provider: this.name, maxTokenAllowed: 1048576 },
      // Add other relevant models here
    ].map(m => ({ ...m, id: m.name })); // Ensure 'id' field is present if BaseProvider or manager expects it
  }

  getModelInstance(options: {
    model: string; // This will be the Vertex AI model ID e.g., 'gemini-1.0-pro'
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const vertexSettings = options.providerSettings?.[this.name];
    if (!vertexSettings) {
      throw new Error(`Configuration settings for ${this.name} are missing.`);
    }

    const { projectId, region } = this.getVertexConfig(vertexSettings);

    if (!projectId || !region) {
      throw new Error(`Vertex AI Project ID or Region is not configured for provider ${this.name}. Cannot instantiate model.`);
    }

    const vertex = createVertex({
      project: projectId,
      location: region,
      // The SDK should handle ADC for authentication.
      // If a service account key JSON is used, it's typically set via GOOGLE_APPLICATION_CREDENTIALS env var.
    });

    // options.model is the specific model identifier like 'gemini-1.0-pro'
    return vertex(options.model);
  }
}
