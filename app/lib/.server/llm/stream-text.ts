// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck – TODO: Provider proper types

import { convertToCoreMessages, streamText as _streamText } from 'ai';
import { getModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt, SystemPromptType } from './prompts';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, MODEL_LIST, MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
  model?: string;
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;

function extractPropertiesFromMessage(message: Message): { model: string; provider: string; content: string } {
  const textContent = Array.isArray(message.content)
    ? message.content.find((item) => item.type === 'text')?.text || ''
    : message.content;

  const modelMatch = textContent.match(MODEL_REGEX);
  const providerMatch = textContent.match(PROVIDER_REGEX);

  /*
   * Extract model
   * const modelMatch = message.content.match(MODEL_REGEX);
   */
  const model = modelMatch ? modelMatch[1] : DEFAULT_MODEL;

  /*
   * Extract provider
   * const providerMatch = message.content.match(PROVIDER_REGEX);
   */
  const provider = providerMatch ? providerMatch[1] : DEFAULT_PROVIDER;

  const cleanedContent = Array.isArray(message.content)
    ? message.content.map((item) => {
        if (item.type === 'text') {
          return {
            type: 'text',
            text: item.text?.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, ''),
          };
        }

        return item; // Preserve image_url and other types as is
      })
    : textContent.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '');

  return { model, provider, content: cleanedContent };
}

export function streamText(messages: Messages, env: Env, options?: StreamingOptions, apiKeys?: Record<string, string>) {
  let currentModel = DEFAULT_MODEL;
  let currentProvider = DEFAULT_PROVIDER;
  let systemPromptType: SystemPromptType = 'default';

  // Try to get system prompt type from cookie
  if (typeof document !== 'undefined') {
    const savedPromptType = document.cookie.split('; ').find(row => row.startsWith('systemPrompt='));
    if (savedPromptType) {
      const promptType = savedPromptType.split('=')[1] as SystemPromptType;
      if (['default', 'small-model', 'qa'].includes(promptType)) {
        systemPromptType = promptType;
      }
    }
  }

  const processedMessages = messages.map((message) => {
    if (message.role === 'user') {
      const { model, provider, content } = extractPropertiesFromMessage(message);

      if (MODEL_LIST.find((m) => m.name === model)) {
        currentModel = model;
      }

      currentProvider = provider;

      return { ...message, content };
    }

    return message;
  });

  const modelDetails = MODEL_LIST.find((m) => m.name === currentModel);
  const dynamicMaxTokens = modelDetails && modelDetails.maxTokenAllowed ? modelDetails.maxTokenAllowed : MAX_TOKENS;

  // Get the API key for the current provider
  const apiKey = apiKeys?.[currentProvider];
  if (!apiKey) {
    throw new Error(`API key not found for provider: ${currentProvider}`);
  }

  return _streamText({
    ...options,
    model: getModel(currentProvider, currentModel, env, { [currentProvider]: apiKey }),
    system: getSystemPrompt(systemPromptType),
    maxTokens: dynamicMaxTokens,
    messages: convertToCoreMessages(processedMessages),
  });
}
