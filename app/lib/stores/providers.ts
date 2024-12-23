import { map, atom } from 'nanostores';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { createScopedLogger } from '~/utils/logger';

// Extend ModelInfo type locally to include additional fields
interface ExtendedModelInfo extends ModelInfo {
  id?: string; // Optional id field for Azure models
}

interface Provider {
  name: string;
  staticModels: ExtendedModelInfo[];
  getApiKeyLink: string;
}

const logger = createScopedLogger('ProvidersStore');

export class ProvidersStore {
  readonly providers = map<Record<string, Provider>>({});
  readonly isInitialized = atom(false);
  readonly isLoading = atom(false);
  readonly providerLoadingStates = map<Record<string, boolean>>({});

  get value() {
    return {
      providers: this.providers.get(),
      isInitialized: this.isInitialized.get(),
      isLoading: this.isLoading.get(),
    };
  }

  constructor() {
    this.#initializeProviders().catch(logger.error);
  }

  async #initializeProviders() {
    try {
      this.isLoading.set(true);

      // Start with static providers
      const initialProviders: Record<string, Provider> = {
        'azure-openai': {
          name: 'AzureOpenAI',
          staticModels: [
            {
              id: 'gpt-4',
              name: 'GPT-4',
              label: 'GPT-4',
              provider: 'azure-openai',
              maxTokenAllowed: 8192,
            },
            {
              id: 'gpt-4-32k',
              name: 'GPT-4 32K',
              label: 'GPT-4 32K',
              provider: 'azure-openai',
              maxTokenAllowed: 32768,
            },
            {
              id: 'gpt-35-turbo',
              name: 'GPT-3.5 Turbo',
              label: 'GPT-3.5 Turbo',
              provider: 'azure-openai',
              maxTokenAllowed: 4096,
            },
            {
              id: 'gpt-35-turbo-16k',
              name: 'GPT-3.5 Turbo 16K',
              label: 'GPT-3.5 Turbo 16K',
              provider: 'azure-openai',
              maxTokenAllowed: 16384,
            },
          ],
          getApiKeyLink: 'https://oai.azure.com',
        },
      };

      // Set initial providers
      this.providers.set(initialProviders);

      // Try to fetch dynamic models if available
      await this.#updateDynamicModels();

      logger.debug('Providers initialized:', {
        count: Object.keys(initialProviders).length,
        providers: Object.keys(initialProviders),
      });
    } catch (error) {
      logger.error('Failed to initialize providers:', error);
    } finally {
      this.isInitialized.set(true);
      this.isLoading.set(false);
    }
  }

  async #updateDynamicModels() {
    const currentProviders = this.providers.get();
    const loadingStates = this.providerLoadingStates.get();

    try {
      // Update Azure OpenAI models if available
      if (currentProviders['azure-openai']) {
        loadingStates['azure-openai'] = true;
        this.providerLoadingStates.set(loadingStates);

        const models = await this.#fetchAzureModels();

        if (models.length) {
          currentProviders['azure-openai'].staticModels = models;
          this.providers.set(currentProviders);
        }

        loadingStates['azure-openai'] = false;
        this.providerLoadingStates.set(loadingStates);
      }
    } catch (error) {
      logger.error('Failed to fetch dynamic models:', error);

      // Ensure loading state is cleared even on error
      loadingStates['azure-openai'] = false;
      this.providerLoadingStates.set(loadingStates);
    }
  }

  async #fetchAzureModels(): Promise<ExtendedModelInfo[]> {
    try {
      const response = await fetch('/api/models/azure');

      if (!response.ok) {
        throw new Error('Failed to fetch Azure models');
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch Azure models:', error);
      return [];
    }
  }

  // Add a method to check if a provider is ready
  isProviderReady(providerId: string): boolean {
    const provider = this.providers.get()[providerId];
    return !!provider?.staticModels?.length;
  }

  // Add a method to get available models for a provider
  getProviderModels(providerId: string): ExtendedModelInfo[] {
    const provider = this.providers.get()[providerId];
    return provider?.staticModels || [];
  }

  // Add method to check if specific provider is loading
  isProviderLoading(providerId: string): boolean {
    return this.providerLoadingStates.get()[providerId] || false;
  }

  // Add method to check if all required models are ready
  areModelsReady(providerId: string): boolean {
    return !this.isLoading.get() && !this.isProviderLoading(providerId) && this.isProviderReady(providerId);
  }
}

export const providersStore = map({
  providers: {},
  isInitialized: false,
  isLoading: false,
});
