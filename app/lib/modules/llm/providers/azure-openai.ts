import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createAzureOpenAI } from '@ai-sdk/openai';

export default class AzureOpenAIProvider extends BaseProvider {
  name = 'AzureOpenAI';
  getApiKeyLink = 'https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/';

  // Configuration keys for .env overrides or direct settings.
  config = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY',
    baseUrlKey: 'AZURE_OPENAI_ENDPOINT',
    deploymentNameKey: 'AZURE_OPENAI_DEPLOYMENT_NAME',
    apiVersionKey: 'AZURE_OPENAI_API_VERSION', // Not a standard BaseProvider key, custom for Azure
  };

  staticModels: ModelInfo[] = []; // Models are dynamic based on deployment

  constructor() {
    super();
    // Constructor is light, config is applied in methods using providerSettings
  }

  private getAzureConfig(settings?: IProviderSetting): {
    apiKey: string;
    endpoint: string;
    deploymentName: string;
    apiVersion: string;
  } {
    const apiKey = settings?.apiKey || this.getEnv(this.config.apiTokenKey) || '';
    const endpoint = settings?.baseUrl || this.getEnv(this.config.baseUrlKey) || '';
    const deploymentName = settings?.deploymentName || this.getEnv(this.config.deploymentNameKey) || '';
    // Ensure apiVersion has a default if not provided in settings or .env
    const apiVersion = settings?.apiVersion || this.getEnv(this.config.apiVersionKey) || '2023-05-15';

    if (!apiKey) throw new Error(`Azure OpenAI API key is missing for provider ${this.name}.`);
    if (!endpoint) throw new Error(`Azure OpenAI endpoint (baseUrl) is missing for provider ${this.name}.`);
    if (!deploymentName) throw new Error(`Azure OpenAI deployment name is missing for provider ${this.name}.`);

    return { apiKey, endpoint, deploymentName, apiVersion };
  }

  async getDynamicModels( // Renamed from getModels to align with LLMManager
    _apiKeys?: Record<string, string>, // apiKeys can be sourced via settings if needed
    settings?: IProviderSetting,
    _serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    // serverEnv can be accessed via this.getEnv() if BaseProvider initializes it.
    // For Azure, the "model" is the deployment.
    try {
      const config = this.getAzureConfig(settings);
      if (config.deploymentName) {
        return [
          {
            name: config.deploymentName, // Use deployment name as the model identifier
            label: `${config.deploymentName} (Azure Deployment)`,
            provider: this.name,
            maxTokenAllowed: 8000, // This is a default; ideally, it might come from Azure or be configurable.
          },
        ];
      }
    } catch (error) {
      // If config is incomplete, provider is not usable, return no models.
      // console.error("Azure OpenAI getModels config error:", error.message);
      return [];
    }
    return [];
  }

  // BaseProvider has a getDynamicModels. If we override getModels,
  // we might not need getDynamicModels here unless BaseProvider strictly calls it.
  // For now, assuming getModels will be called by the manager logic for this provider.

  getModelInstance(options: {
    model: string; // This will be the deploymentName for Azure
    serverEnv?: Env; // Access via this.getEnv() if needed
    apiKeys?: Record<string, string>; // Access via settings if needed
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const azureSettings = options.providerSettings?.[this.name];
    if (!azureSettings) {
      throw new Error(`Configuration settings for ${this.name} are missing.`);
    }

    const { apiKey, endpoint, deploymentName, apiVersion } = this.getAzureConfig(azureSettings);

    // The 'model' parameter in options.model is the one selected in UI, which should be our deploymentName.
    // The 'deployment' parameter for createAzureOpenAI should be this deploymentName.
    // The model passed to the returned azure() instance is also this deploymentName,
    // as Azure uses the deployment to determine the underlying model.
    if (options.model !== deploymentName) {
      // This might indicate a mismatch if multiple "deployments" were somehow listed for Azure.
      // For our current getModels, this shouldn't happen as we only list the single configured deployment.
      console.warn(`AzureOpenAI: Model selected (${options.model}) differs from configured deployment (${deploymentName}). Using selected model for SDK call.`);
    }

    const azure = createAzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment: options.model, // Use the model string passed, which is the deployment name
    });

    // The SDK instance is called with the model name (which is the deployment name here)
    return azure(options.model);
  }
}
