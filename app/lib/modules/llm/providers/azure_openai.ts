import type { LanguageModelV1 } from 'ai';
import { BaseProvider, getOpenAILikeModel } from '../base-provider';
import type { ModelInfo, ProviderConfig } from '../types';
import type { IProviderSetting } from '~/types/model';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AzureOpenAIProvider');

export class AzureOpenAIProvider extends BaseProvider {
  name = 'Azure OpenAI'; // Display name for the provider

  // Configuration for API keys and base URLs
  // These might be environment variable names or keys in a settings object
  config: ProviderConfig = {
    apiTokenKey: 'AZURE_OPENAI_API_KEY', // Environment variable for API key
    baseUrlKey: 'AZURE_OPENAI_ENDPOINT', // Environment variable for the endpoint
    // Azure OpenAI uses an endpoint that includes the deployment name,
    // so a single 'baseUrl' might not be enough if users have multiple deployments.
    // However, the IProviderSetting has 'azureEndpoint' which we will use.
  };

  // Static list of models. These are examples.
  // Users will typically specify their deployment names as models.
  staticModels: ModelInfo[] = [
    { name: 'gpt-35-turbo', label: 'GPT-3.5 Turbo (Azure)', provider: this.name, isDefault: true },
    { name: 'gpt-4', label: 'GPT-4 (Azure)', provider: this.name },
    { name: 'gpt-4-32k', label: 'GPT-4-32k (Azure)', provider: this.name },
    { name: 'text-embedding-ada-002', label: 'Ada Embedding (Azure)', provider: this.name },
    // It's often better to let users define their "deployment names" as models
    // or fetch them dynamically if Azure OpenAI API supports that.
    // For now, these are placeholders. The actual 'name' should match the deployment name.
  ];

  // Optional: Link to get API key
  getApiKeyLink = 'https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/';
  labelForGetApiKey = 'Get Azure OpenAI API Key & Endpoint';
  icon = 'i-custom:azure'; // Placeholder for a potential custom icon

  constructor() {
    super();
  }

  // This method will be called to get an instance of the language model for API calls.
  getModelInstance(options: {
    model: string; // This will be the deployment name for Azure OpenAI
    serverEnv?: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, apiKeys, providerSettings } = options;

    const currentProviderSettings = providerSettings?.[this.name];
    const azureEndpoint = currentProviderSettings?.azureEndpoint;
    const apiKey = apiKeys?.[this.name];

    if (!azureEndpoint) {
      throw new Error(
        `Azure OpenAI endpoint is not configured for provider ${this.name}. Please set it in the settings.`,
      );
    }
    if (!apiKey) {
      throw new Error(
        `Azure OpenAI API key is not configured for provider ${this.name}. Please set it in the settings.`,
      );
    }

    // The Azure OpenAI endpoint already contains the full path to the deployment.
    // The `getOpenAILikeModel` expects a baseURL (like https://api.openai.com/v1)
    // and a model name (like gpt-3.5-turbo).
    // For Azure, the 'model' parameter to this function is the DEPLOYMENT NAME.
    // The SDK needs the endpoint and the deployment name separately.
    // We need to ensure the `azureEndpoint` is the base (e.g. https://my-resource.openai.azure.com)
    // and `model` is the deployment ID.
    // However, typical Azure SDKs for OpenAI often take the full endpoint URL
    // that includes the deployment, and then the API key.

    // Let's adjust to use getOpenAILikeModel, assuming azureEndpoint is the resource base
    // and 'model' is the deployment name.
    // Example: azureEndpoint = "https://YOUR_RESOURCE_NAME.openai.azure.com"
    // model (deployment_id) = "your-gpt-35-turbo-deployment"
    // The final URL for the SDK would be something like:
    // https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/your-gpt-35-turbo-deployment

    // The @ai-sdk/openai createOpenAI function constructs the URL like: `${options.baseURL}/chat/completions`
    // For Azure, it needs to be: `{endpoint}/openai/deployments/{deployment-id}/chat/completions`
    // The `model` prop passed to openai(model) is not used in URL path for Azure if `baseURL` is already deployment-specific.
    // If `azureEndpoint` is "https://myresource.openai.azure.com/openai/deployments/mydeployment"
    // then we might not need to pass `model` to `openai()` call or pass empty string.

    // The standard way for @ai-sdk/openai with Azure:
    // Pass the resource endpoint (e.g., "https://MY_AOAI_ENDPOINT.openai.azure.com") as `baseURL`.
    // Pass the deployment name (e.g., "gpt-4-deployment") as the `model` argument to `openai(modelName)`.
    // The SDK then appends "/openai/deployments/{modelName}/chat/completions".

    logger.info(`Creating Azure OpenAI model instance for deployment: ${model} at endpoint: ${azureEndpoint}`);

    // Ensure azureEndpoint does not end with a slash for compatibility with SDK URL construction
    const cleanedAzureEndpoint = azureEndpoint.endsWith('/') ? azureEndpoint.slice(0, -1) : azureEndpoint;

    return getOpenAILikeModel(cleanedAzureEndpoint, apiKey, model);
  }

  // Optional: Implement getDynamicModels if Azure API allows listing deployments/models
  // async getDynamicModels(
  //   apiKeys?: Record<string, string>,
  //   settings?: IProviderSetting,
  //   serverEnv?: Record<string, string>,
  // ): Promise<ModelInfo[]> {
  //   const apiKey = apiKeys?.[this.name] || serverEnv?.[this.config.apiTokenKey!];
  //   const azureEndpoint = settings?.azureEndpoint || serverEnv?.[this.config.baseUrlKey!];
  //
  //   if (!apiKey || !azureEndpoint) {
  //     logger.warn('Azure OpenAI API key or endpoint not configured for dynamic model fetching.');
  //     return this.staticModels; // or return empty array: []
  //   }
  //
  //   // TODO: Implement API call to Azure to list available deployment names
  //   // This usually requires specific permissions and Azure SDK usage.
  //   // For now, returning static models or user-defined deployment names is more practical.
  //   logger.info(`Fetching dynamic models for Azure OpenAI (not yet implemented, returning static)`);
  //   return this.staticModels;
  // }
}

// Ensure the class is exported for the registry
export default AzureOpenAIProvider;
