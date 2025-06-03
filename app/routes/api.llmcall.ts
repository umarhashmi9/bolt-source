import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { streamText } from '~/lib/.server/llm/stream-text';
import type { IProviderSetting, ProviderInfo } from '~/types/model';
import { generateText } from 'ai';
import { PROVIDER_LIST } from '~/utils/constants'; // PROVIDER_LIST might be less relevant if using LLMManager fully
import { MAX_TOKENS } from '~/lib/.server/llm/constants';
import { LLMManager } from '~/lib/modules/llm/manager';
import GraniteAIProvider from '~/lib/modules/llm/providers/granite-ai'; // Import GraniteAIProvider
import type { ModelInfo } from '~/lib/modules/llm/types';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';
import { createScopedLogger } from '~/utils/logger';

export async function action(args: ActionFunctionArgs) {
  return llmCallAction(args);
}

async function getModelList(options: {
  apiKeys?: Record<string, string>;
  providerSettings?: Record<string, IProviderSetting>;
  serverEnv?: Record<string, string>;
}) {
  const llmManager = LLMManager.getInstance(import.meta.env);
  return llmManager.updateModelList(options);
}

const logger = createScopedLogger('api.llmcall');

async function llmCallAction({ context, request }: ActionFunctionArgs) {
  const { system, message, model, provider, streamOutput } = await request.json<{
    system: string;
    message: string;
    model: string;
    provider: ProviderInfo;
    streamOutput?: boolean;
  }>();

  const { name: providerName } = provider;

  // validate 'model' and 'provider' fields
  if (!model || typeof model !== 'string') {
    throw new Response('Invalid or missing model', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  if (!providerName || typeof providerName !== 'string') {
    throw new Response('Invalid or missing provider', {
      status: 400,
      statusText: 'Bad Request',
    });
  }

  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  if (streamOutput) {
    try {
      const result = await streamText({
        options: {
          system,
        },
        messages: [
          {
            role: 'user',
            content: `${message}`,
          },
        ],
        env: context.cloudflare?.env as any,
        apiKeys,
        providerSettings,
      });

      return new Response(result.textStream, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (error: unknown) {
      console.log(error);

      if (error instanceof Error && error.message?.includes('API key')) {
        throw new Response('Invalid or missing API key', {
          status: 401,
          statusText: 'Unauthorized',
        });
      }

      throw new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  } else {
    try {
      const models = await getModelList({ apiKeys, providerSettings, serverEnv: context.cloudflare?.env as any });
      const modelDetails = models.find((m: ModelInfo) => m.name === model);

      if (!modelDetails) {
        throw new Error('Model not found');
      }

      const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

      // Get LLMManager instance and the actual provider instance
      const llmManager = LLMManager.getInstance(context.cloudflare?.env as any);
      const actualProviderInstance = llmManager.getProvider(provider.name);

      if (!actualProviderInstance) {
        // This check replaces the old providerInfo check using PROVIDER_LIST
        throw new Error(`Provider ${provider.name} not found or not registered in LLMManager.`);
      }

      logger.info(`Generating response with Provider: ${provider.name}, Model: ${modelDetails.name}`);

      if (actualProviderInstance instanceof GraniteAIProvider) {
        logger.info(`Using GraniteAIProvider direct generate for Model: ${modelDetails.name}`);
        const graniteResultText = await actualProviderInstance.generate({
          model: modelDetails.name,
          prompt: message,
          providerSettings: providerSettings?.[provider.name],
          // signal: request.signal, // Pass signal if needed
        });

        const responsePayload = {
          text: graniteResultText,
          toolCalls: [],
          finishReason: 'stop', // Or derive from actual Granite response if available
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } // Placeholder
        };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } else if (typeof actualProviderInstance.getModelInstance === 'function') {
        logger.info(`Using AI SDK generateText for Provider: ${provider.name}, Model: ${modelDetails.name}`);
        const result = await generateText({
          system,
          messages: [ { role: 'user', content: `${message}` } ],
          model: actualProviderInstance.getModelInstance({ // Use actualProviderInstance here
            model: modelDetails.name,
            serverEnv: context.cloudflare?.env as any,
            apiKeys,
            providerSettings, // Pass the whole providerSettings object
          }),
          maxTokens: dynamicMaxTokens,
          toolChoice: 'none',
        });
        logger.info(`Generated response with AI SDK`);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        logger.error(`Provider ${provider.name} does not have a getModelInstance method and is not GraniteAIProvider.`);
        throw new Response(`Provider ${provider.name} is not configured correctly for generating text.`, {
          status: 500,
          statusText: 'Internal Server Error'
        });
      }
    } catch (error: unknown) {
      console.log(error);

      if (error instanceof Error && error.message?.includes('API key')) {
        throw new Response('Invalid or missing API key', {
          status: 401,
          statusText: 'Unauthorized',
        });
      }

      throw new Response(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }
  }
}
