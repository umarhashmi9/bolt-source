import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1, LanguageModelV1CallOptions } from 'ai';
import { VertexAI } from '@google-cloud/vertexai';

export default class VertexAIProvider extends BaseProvider {
  name = 'VertexAI';
  getApiKeyLink = 'https://console.cloud.google.com/';

  config = {
    apiTokenKey: 'GOOGLE_APPLICATION_CREDENTIALS',
    projectIdKey: 'GOOGLE_PROJECT_ID',
    locationKey: 'GOOGLE_LOCATION',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'gemini-pro',
      label: 'Gemini Pro',
      provider: 'VertexAI',
      maxTokenAllowed: 30720,
    },
    {
      name: 'gemini-pro-vision',
      label: 'Gemini Pro Vision',
      provider: 'VertexAI',
      maxTokenAllowed: 30720,
    },
    {
      name: 'code-bison',
      label: 'Code Bison',
      provider: 'VertexAI',
      maxTokenAllowed: 6144,
    },
  ];

  async getDynamicModels(
    _apiKeys?: Record<string, string>,
    _settings?: IProviderSetting,
    _serverEnv: Record<string, string> = {},
  ): Promise<ModelInfo[]> {
    // Vertex AI doesn't have a public API to fetch models dynamically
    // Return static models instead
    return this.staticModels;
  }


getModelInstance(options: {
    model: string;
    serverEnv?: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv = {}, apiKeys, providerSettings } = options;

    const { projectId, location } = this.getVertexAIConfig({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv,
    });

    if (!projectId || !location) {
      throw new Error(`Missing configuration for ${this.name} provider`);
    }

    const vertexai = new VertexAI({
      project: projectId,
      location: location,
    });

    const generativeModel = vertexai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.9,
        topP: 1,
      },
    });

    // Wrap the Vertex AI model to conform to LanguageModelV1 interface
    const instance: LanguageModelV1 = {
      specificationVersion: 'v1',
      provider: this.name,
      modelId: model,
      defaultObjectGenerationMode: undefined,

      async doGenerate(options: LanguageModelV1CallOptions) {
        const messages = options.prompt.map(msg => {
          switch (msg.role) {
            case 'system':
              return {
                role: 'system',
                parts: [{ text: msg.content }]
              };
            
            case 'user':
            case 'assistant':
            case 'tool':
              return {
                role: msg.role,
                parts: Array.isArray(msg.content) ? msg.content.map(part => {
                  if ('text' in part) {
                    return { text: part.text };
                  }
                  throw new Error(`Unsupported content type for Vertex AI`);
                }) : [{ text: msg.content }]
              };
            
            
          }
        });
      
        const response = await generativeModel.generateContent({
          contents: messages,
        });
      
        if (!response.response?.candidates?.[0]?.content) {
          throw new Error('No response generated from Vertex AI');
        }
      
        return {
          text: response.response.candidates[0].content.parts[0].text,
          finishReason: 'stop',
          usage: {
            promptTokens: 0,  // Add actual token counts if available from Vertex AI
            completionTokens: 0,
          },
          rawCall: {
            rawPrompt: messages,
            rawSettings: {},
          },
        };
      },

      async doStream(options: LanguageModelV1CallOptions) {
        throw new Error('Streaming not implemented for Vertex AI');
      },
    };

    return instance;
  }
  
  private getVertexAIConfig({
    apiKeys,
    providerSettings,
    serverEnv,
  }: {
    apiKeys?: Record<string, string>;
    providerSettings?: IProviderSetting;
    serverEnv: Record<string, string>;
  }) {
    const projectId =
      apiKeys?.GOOGLE_PROJECT_ID ||
      providerSettings?.projectId ||
      serverEnv[this.config.projectIdKey];

    const location =
      apiKeys?.GOOGLE_LOCATION ||
      providerSettings?.location ||
      serverEnv[this.config.locationKey] ||
      'us-central1';

    return { projectId, location };
  }
} 