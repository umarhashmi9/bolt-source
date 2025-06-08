// Unit tests for AzureOpenAIProvider

// Mock the base-provider's getOpenAILikeModel function
const mockGetOpenAILikeModel = jest.fn().mockReturnValue({ /* mock model instance */ });
jest.mock('../base-provider', () => ({
  // Mock BaseProvider class if needed for instantiation, or parts of it
  BaseProvider: class {}, // Minimal mock for extension
  getOpenAILikeModel: mockGetOpenAILikeModel,
}));


import { AzureOpenAIProvider } from '../azure_openai';
import type { IProviderSetting } from '~/types/model';

describe('AzureOpenAIProvider', () => {
  let provider: AzureOpenAIProvider;

  beforeEach(() => {
    provider = new AzureOpenAIProvider();
    // Reset mocks if they are stateful
    jest.clearAllMocks();
  });

  it('should have correct name and config', () => {
    expect(provider.name).toBe('Azure OpenAI');
    expect(provider.config.apiTokenKey).toBe('AZURE_OPENAI_API_KEY');
    expect(provider.config.baseUrlKey).toBe('AZURE_OPENAI_ENDPOINT');
  });

  it('should have static models defined', () => {
    expect(provider.staticModels.length).toBeGreaterThan(0);
    expect(provider.staticModels[0]).toHaveProperty('name');
    expect(provider.staticModels[0]).toHaveProperty('label');
    expect(provider.staticModels[0].provider).toBe('Azure OpenAI');
  });

  describe('getModelInstance', () => {
    const mockApiKeys = { 'Azure OpenAI': 'test-api-key' };
    const mockProviderSettings = {
      'Azure OpenAI': {
        enabled: true,
        azureEndpoint: 'https://test-resource.openai.azure.com',
      } as IProviderSetting,
    };
    const modelName = 'gpt-35-turbo'; // This should match a deployment name

    it('should throw an error if endpoint is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: mockApiKeys,
          providerSettings: { 'Azure OpenAI': { azureEndpoint: undefined } as any },
        })
      ).toThrow('Azure OpenAI endpoint is not configured');
    });

    it('should throw an error if API key is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: { 'Azure OpenAI': undefined },
          providerSettings: mockProviderSettings,
        })
      ).toThrow('Azure OpenAI API key is not configured');
    });

    it('should call getOpenAILikeModel with correct parameters', () => {
      provider.getModelInstance({
        model: modelName,
        apiKeys: mockApiKeys,
        providerSettings: mockProviderSettings,
      });

      expect(mockGetOpenAILikeModel).toHaveBeenCalledWith(
        'https://test-resource.openai.azure.com', // Endpoint without trailing slash
        'test-api-key',
        modelName
      );
    });

    it('should handle endpoint with trailing slash', () => {
      provider.getModelInstance({
        model: modelName,
        apiKeys: mockApiKeys,
        providerSettings: {
          'Azure OpenAI': {
            azureEndpoint: 'https://test-resource.openai.azure.com/', // With slash
          } as IProviderSetting,
        },
      });
      expect(mockGetOpenAILikeModel).toHaveBeenCalledWith(
        'https://test-resource.openai.azure.com', // Slash removed by the provider's getModelInstance
        'test-api-key',
        modelName
      );
    });
  });

  // Add more tests for getDynamicModels if implemented, etc.
});
