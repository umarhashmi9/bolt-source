import type { LanguageModelV1 } from 'ai';
import { BaseProvider, getOpenAILikeModel } from '../base-provider';
import type { ModelInfo, ProviderConfig } from '../types';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GraniteProvider');

export class GraniteProvider extends BaseProvider {
  name = 'IBM Granite'; // Or just 'Granite'

  config: ProviderConfig = {
    // This assumes the API key is a direct bearer token.
    // For IBM Watsonx.ai, this usually isn't the case; an IAM token is needed.
    apiTokenKey: 'IBM_CLOUD_API_KEY', // For storing the IBM Cloud API Key
    // The baseUrlKey is a fallback; primary endpoint comes from IProviderSetting.graniteEndpoint
    baseUrlKey: 'GRANITE_ENDPOINT',
  };

  // Example Granite models available via Watsonx.ai or similar IBM Cloud service
  // Model IDs are specific to the platform and region.
  staticModels: ModelInfo[] = [
    { name: 'granite-13b-chat-v2', label: 'Granite 13B Chat V2', provider: this.name, isDefault: true },
    { name: 'granite-13b-instruct-v2', label: 'Granite 13B Instruct V2', provider: this.name },
    { name: 'granite-20b-code-instruct-v1', label: 'Granite 20B Code Instruct V1', provider: this.name },
    // Add other relevant Granite models if known
  ];

  getApiKeyLink = 'https://cloud.ibm.com/docs/watsonx-ai?topic=watsonx-ai-gs-models';
  labelForGetApiKey = 'Get IBM Granite Access (Watsonx.ai)';
  icon = 'i-custom:ibm'; // Placeholder for IBM or Granite icon

  constructor() {
    super();
  }

  getModelInstance(options: {
    model: string; // Model ID for Granite (e.g., the deployment ID on Watsonx.ai)
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, apiKeys, providerSettings } = options;

    const currentProviderSettings = providerSettings?.[this.name];
    // This assumes the apiKey IS the bearer token.
    // In reality, for IBM Watsonx, this apiKey would be an IBM Cloud API Key
    // used to fetch an IAM token. That token would then be the bearer token.
    const apiKey = apiKeys?.[this.name];
    const graniteEndpoint = currentProviderSettings?.graniteEndpoint;

    if (!apiKey) {
      throw new Error(
        `API Key for ${this.name} is not configured. Please set it in the settings.`,
      );
    }
    if (!graniteEndpoint) {
      throw new Error(
        `Endpoint for ${this.name} is not configured. Please set it in the settings.`,
      );
    }

    logger.info(
      `Creating Granite model instance for model: ${model} at endpoint: ${graniteEndpoint}. IMPORTANT: Assumes API key is a direct Bearer token.`,
    );

    // This is a significant simplification.
    // IBM Watsonx.ai typically requires IAM authentication:
    // 1. Use IBM Cloud API Key to get an IAM token from IBM's IAM service.
    // 2. Use that IAM token as the Bearer token in API requests to Watsonx.ai.
    // The getOpenAILikeModel function assumes the 'apiKey' is the Bearer token.
    // If the Granite API on Watsonx.ai is OpenAI-compatible, this might work *if* apiKey is the IAM token.
    // If apiKey is the IBM Cloud API key, this will fail.
    // A proper implementation would need an intermediate step for IAM token generation,
    // or a dedicated @ai-sdk/ibm or @ai-sdk/watsonx adapter.

    return getOpenAILikeModel(graniteEndpoint, apiKey, model);
  }

  // TODO: Consider implementing getDynamicModels if the platform API supports listing
  // available Granite models or deployments.
}

export default GraniteProvider;
