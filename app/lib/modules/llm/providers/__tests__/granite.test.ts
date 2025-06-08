// Unit tests for GraniteProvider

// Mock the base-provider's getOpenAILikeModel function
const mockGraniteGetOpenAILikeModel = jest.fn().mockReturnValue({ /* mock model instance */ });
jest.mock('../base-provider', () => ({
  BaseProvider: class {}, // Minimal mock for extension
  getOpenAILikeModel: mockGraniteGetOpenAILikeModel,
}));

import { GraniteProvider } from '../granite'; // Adjust path as necessary
import type { IProviderSetting } from '~/types/model';

describe('GraniteProvider', () => {
  let provider: GraniteProvider;

  beforeEach(() => {
    provider = new GraniteProvider();
    jest.clearAllMocks();
  });

  it('should have correct name and config', () => {
    expect(provider.name).toBe('IBM Granite');
    expect(provider.config.apiTokenKey).toBe('IBM_CLOUD_API_KEY');
    expect(provider.config.baseUrlKey).toBe('GRANITE_ENDPOINT');
  });

  it('should have static models defined', () => {
    expect(provider.staticModels.length).toBeGreaterThan(0);
    expect(provider.staticModels[0]).toHaveProperty('name');
    expect(provider.staticModels[0].provider).toBe('IBM Granite');
  });

  describe('getModelInstance', () => {
    const mockApiKeys = { 'IBM Granite': 'test-ibm-api-key' };
    const mockProviderSettings = {
      'IBM Granite': {
        enabled: true,
        graniteEndpoint: 'https://test-granite-endpoint.ibm.com',
      } as IProviderSetting,
    };
    const modelName = 'granite-13b-chat-v2';

    it('should throw an error if API key is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: { 'IBM Granite': undefined },
          providerSettings: mockProviderSettings,
        })
      ).toThrow(`API Key for ${provider.name} is not configured.`);
    });

    it('should throw an error if endpoint is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: mockApiKeys,
          providerSettings: { 'IBM Granite': { graniteEndpoint: undefined } as any },
        })
      ).toThrow(`Endpoint for ${provider.name} is not configured.`);
    });

    it('should call getOpenAILikeModel with correct parameters', () => {
      const instance = provider.getModelInstance({
        model: modelName,
        apiKeys: mockApiKeys,
        providerSettings: mockProviderSettings,
      });

      expect(mockGraniteGetOpenAILikeModel).toHaveBeenCalledWith(
        'https://test-granite-endpoint.ibm.com',
        'test-ibm-api-key',
        modelName
      );
      expect(instance).toBeDefined(); // Check if something is returned
    });
  });
});
