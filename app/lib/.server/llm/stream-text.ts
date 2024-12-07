// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck – TODO: Provider proper types

import { convertToCoreMessages, streamText as _streamText } from 'ai';
import { getModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import { DEFAULT_MODEL } from '~/utils/constants';
import type { ModelConfig } from '~/utils/types';

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

export function streamText(messages: Messages, env: Env, config: ModelConfig, options?: StreamingOptions) {
  const currentModel = config.model?.name || DEFAULT_MODEL; //WARNING: DEFAULT_MODEL may be invalid.
  const currentProvider = config.provider;

  const dynamicMaxTokens = config.model?.maxTokenAllowed ?? env.MAX_TOKENS ?? process.env.MAX_TOKENS ?? MAX_TOKENS;

  return _streamText({
    ...options,
    model: getModel(currentProvider, currentModel, env, config.apiKey),
    system: getSystemPrompt(),
    maxTokens: dynamicMaxTokens,
    messages: convertToCoreMessages(messages),
  });
}
