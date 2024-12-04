/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env, provider: string, userApiKeys?: Record<string, string>) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `import.meta.env`.
   */

  // First check user-provided API keys
  if (userApiKeys?.[provider]) {
    return userApiKeys[provider];
  }

  // Fall back to environment variables
  switch (provider) {
    case 'Anthropic':
      return import.meta.env.VITE_ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY;
    case 'OpenAI':
      return import.meta.env.VITE_OPENAI_API_KEY || cloudflareEnv.OPENAI_API_KEY;
    case 'Google':
      return import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY || cloudflareEnv.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'Groq':
      return import.meta.env.VITE_GROQ_API_KEY || cloudflareEnv.GROQ_API_KEY;
    case 'HuggingFace':
      return import.meta.env.VITE_HUGGINGFACE_API_KEY || cloudflareEnv.HUGGINGFACE_API_KEY;
    case 'OpenRouter':
      return import.meta.env.VITE_OPEN_ROUTER_API_KEY || cloudflareEnv.OPEN_ROUTER_API_KEY;
    case 'Deepseek':
      return import.meta.env.VITE_DEEPSEEK_API_KEY || cloudflareEnv.DEEPSEEK_API_KEY;
    case 'Mistral':
      return import.meta.env.VITE_MISTRAL_API_KEY || cloudflareEnv.MISTRAL_API_KEY;
    case 'OpenAILike':
      return import.meta.env.VITE_OPENAI_LIKE_API_KEY || cloudflareEnv.OPENAI_LIKE_API_KEY;
    case 'Together':
      return import.meta.env.VITE_TOGETHER_API_KEY || cloudflareEnv.TOGETHER_API_KEY;
    case 'xAI':
      return import.meta.env.VITE_XAI_API_KEY || cloudflareEnv.XAI_API_KEY;
    case 'Cohere':
      return import.meta.env.VITE_COHERE_API_KEY;
    case 'AzureOpenAI':
      return import.meta.env.VITE_AZURE_OPENAI_API_KEY;
    default:
      return '';
  }
}

export function getBaseURL(cloudflareEnv: Env, provider: string) {
  switch (provider) {
    case 'Together':
      return env.TOGETHER_API_BASE_URL || cloudflareEnv.TOGETHER_API_BASE_URL;
    case 'OpenAILike':
      return env.OPENAI_LIKE_API_BASE_URL || cloudflareEnv.OPENAI_LIKE_API_BASE_URL;
    case 'LMStudio':
      return env.LMSTUDIO_API_BASE_URL || cloudflareEnv.LMSTUDIO_API_BASE_URL || 'http://localhost:1234';
    case 'Ollama': {
      let baseUrl = env.OLLAMA_API_BASE_URL || cloudflareEnv.OLLAMA_API_BASE_URL || 'http://localhost:11434';

      if (env.RUNNING_IN_DOCKER === 'true') {
        baseUrl = baseUrl.replace('localhost', 'host.docker.internal');
      }

      return baseUrl;
    }
    default:
      return '';
  }
}
