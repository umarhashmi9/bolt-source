// Unit tests for VertexAIProvider

// Mock @ai-sdk/google's createVertex function
const mockVertexModelInstance = { /* mock model instance */ };
const mockCreateVertexFn = jest.fn().mockReturnValue(mockVertexModelInstance);
jest.mock('@ai-sdk/google', () => ({
  createVertex: jest.fn().mockImplementation(() => mockCreateVertexFn),
}));

import { VertexAIProvider } from '../vertex_ai'; // Adjust path as necessary
import type { IProviderSetting } from '~/types/model';

describe('VertexAIProvider', () => {
  let provider: VertexAIProvider;
  const serviceAccountKeyJson = '{ "type": "service_account", "project_id": "test-project", "private_key_id": "key_id", "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n", "client_email": "test@test-project.iam.gserviceaccount.com", "client_id": "123", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com"}';

  beforeEach(() => {
    provider = new VertexAIProvider();
    jest.clearAllMocks();
  });

  it('should have correct name and config', () => {
    expect(provider.name).toBe('Vertex AI');
    expect(provider.config.apiTokenKey).toBe('VERTEX_AI_SERVICE_ACCOUNT_JSON');
    expect(provider.config.projectIdKey).toBe('VERTEX_AI_PROJECT_ID');
    expect(provider.config.locationIdKey).toBe('VERTEX_AI_LOCATION_ID');
  });

  it('should have static models defined', () => {
    expect(provider.staticModels.length).toBeGreaterThan(0);
    expect(provider.staticModels[0]).toHaveProperty('name');
    expect(provider.staticModels[0].provider).toBe('Vertex AI');
  });

  describe('getModelInstance', () => {
    const mockApiKeys = { 'Vertex AI': serviceAccountKeyJson };
    const mockProviderSettings = {
      'Vertex AI': {
        enabled: true,
        vertexProjectId: 'test-project-id',
        vertexLocationId: 'us-central1',
      } as IProviderSetting,
    };
    const modelName = 'gemini-1.0-pro';

    it('should throw an error if service account JSON is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: { 'Vertex AI': undefined },
          providerSettings: mockProviderSettings,
        })
      ).toThrow('Vertex AI Service Account JSON is not configured');
    });

    it('should throw an error if project ID is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: mockApiKeys,
          providerSettings: { 'Vertex AI': { ...mockProviderSettings['Vertex AI'], vertexProjectId: undefined } as any },
        })
      ).toThrow('Vertex AI Project ID is not configured');
    });

    it('should throw an error if location ID is not configured', () => {
      expect(() =>
        provider.getModelInstance({
          model: modelName,
          apiKeys: mockApiKeys,
          providerSettings: { 'Vertex AI': { ...mockProviderSettings['Vertex AI'], vertexLocationId: undefined } as any },
        })
      ).toThrow('Vertex AI Location ID is not configured');
    });

    it('should throw an error for invalid Service Account JSON', () => {
      expect(() => provider.getModelInstance({
        model: modelName,
        apiKeys: { 'Vertex AI': 'invalid json' },
        providerSettings: mockProviderSettings,
      })).toThrow('Invalid Vertex AI Service Account JSON provided.');
    });

    it('should call createVertex and the model function with correct parameters', () => {
      const { createVertex } = require('@ai-sdk/google');
      // const returnedModelFn = createVertex(); // This is mockCreateVertexFn

      const instance = provider.getModelInstance({
        model: modelName,
        apiKeys: mockApiKeys,
        providerSettings: mockProviderSettings,
      });

      expect(createVertex).toHaveBeenCalledWith({
        credentials: JSON.parse(serviceAccountKeyJson),
        project: 'test-project-id',
        location: 'us-central1',
      });
      // mockCreateVertexFn is the function returned by createVertex()
      expect(mockCreateVertexFn).toHaveBeenCalledWith(modelName);
      expect(instance).toBe(mockVertexModelInstance); // Ensure the mocked model instance is returned
    });
  });
});
