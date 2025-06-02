import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ModelInfo, GetModelInstanceParams } from '../types';
import { BaseProvider } from '../base-provider';
import type { IProviderSetting } from '~/types/model';

// Define a config interface if it's helpful for clarity
interface AzureOpenAIConfig {
  apiTokenKey: string;
  baseUrlKey: string;
  defaultAzureApiVersion: string;
}

export class AzureOpenAIProvider extends BaseProvider {
  name = 'Azure OpenAI';
  id = 'azure_openai'; // Ensure this is unique

  config: AzureOpenAIConfig = {
    apiTokenKey: 'azureOpenAIApiKey', // Corresponds to IProviderSetting.apiKey
    baseUrlKey: 'azureOpenAIEndpoint', // Corresponds to IProviderSetting.baseUrl
    defaultAzureApiVersion: '2023-07-01-preview',
  };

  staticModels: ModelInfo[] = [
    // Azure OpenAI models are typically user-defined deployments.
    // We can list common base model types here if desired, but the actual 'model' string
    // passed to getModelInstance will be the deployment ID.
    // For now, keeping it empty as deployments are dynamic.
    // Example: { name: "gpt-35-turbo-deployment", provider: "Azure OpenAI", type: "chat" }
  ];

  getApiKeyLink = 'https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/';
  labelForGetApiKey = 'Azure OpenAI API Key';
  icon = 'i-logos:azure-icon'; // Using a placeholder icon from icones.js.org

  getModelInstance({ model, serverEnv, apiKeys, providerSettings }: GetModelInstanceParams): LanguageModel {
    const settings = providerSettings?.['Azure OpenAI'] as IProviderSetting | undefined; // Cast to ensure type safety
    
    // Prioritize API key from direct apiKeys input (e.g. from user cookie), then from persisted settings
    const apiKey = apiKeys?.['Azure OpenAI'] || settings?.apiKey;
    // Base URL (Azure Endpoint) must come from persisted settings
    const baseUrl = settings?.baseUrl;
    
    // The 'model' parameter from the request IS the Azure Deployment ID
    const deploymentName = model; 
    
    // API version from persisted settings or default from this provider's config
    const apiVersion = settings?.azureApiVersion || this.config.defaultAzureApiVersion;

    if (!apiKey) {
      throw new Error('Azure OpenAI API key is missing. Please check your provider settings or API key input.');
    }
    if (!baseUrl) {
      throw new Error('Azure OpenAI Endpoint (baseUrl) is missing. Please check your provider settings.');
    }
    if (!deploymentName) {
      // This should ideally not happen if a model (deployment ID) is selected in UI
      throw new Error('Azure OpenAI Deployment ID (model) is missing.');
    }

    return createOpenAI({
      azureEndpoint: baseUrl,
      azureApiKey: apiKey,
      azureDeploymentId: deploymentName,
      azureApiVersion: apiVersion,
      // You might need to add defaultHeaders or other configurations here if necessary
      // defaultHeaders: {
      //   'api-key': apiKey, // Some older SDKs might require manual header setting
      // },
    });
  }
}

// To ensure it's picked up by the dynamic import in LLMManager,
// we need to make sure it's correctly exported.
// If registry.ts pattern is used, this class needs to be exported from there.
// For now, assuming LLMManager directly imports from a 'providers' folder.
export default AzureOpenAIProvider;
