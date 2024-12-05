/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env, provider: string, userApiKeys?: Record<string, string>) {
  /**
   * API keys are checked in the following order:
   * 1. User-provided API keys (from cookies)
   * 2. VITE environment variables (for development)
   * 3. Cloudflare environment variables (for production)
   * 4. Process environment variables (for local development)
   */

  // First check user-provided API keys
  if (userApiKeys?.[provider]) {
    return userApiKeys[provider];
  }

  // Fall back to environment variables
  switch (provider) {
    case 'Anthropic':
      return import.meta.env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    case 'OpenAI':
      return import.meta.env.OPENAI_API_KEY || cloudflareEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    case 'Google':
      return (
        import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        cloudflareEnv.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
      );
    case 'Groq':
      return import.meta.env.GROQ_API_KEY || cloudflareEnv.GROQ_API_KEY || process.env.GROQ_API_KEY;
    case 'HuggingFace':
      return (
        import.meta.env.HUGGINGFACE_API_KEY || cloudflareEnv.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY
      );
    case 'OpenRouter':
      return (
        import.meta.env.OPEN_ROUTER_API_KEY || cloudflareEnv.OPEN_ROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY
      );
    case 'Deepseek':
      return import.meta.env.DEEPSEEK_API_KEY || cloudflareEnv.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    case 'Mistral':
      return import.meta.env.MISTRAL_API_KEY || cloudflareEnv.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY;
    case 'OpenAILike':
      return (
        import.meta.env.OPENAI_LIKE_API_KEY || cloudflareEnv.OPENAI_LIKE_API_KEY || process.env.OPENAI_LIKE_API_KEY
      );
    case 'Together':
      return import.meta.env.TOGETHER_API_KEY || cloudflareEnv.TOGETHER_API_KEY || process.env.TOGETHER_API_KEY;
    case 'xAI':
      return import.meta.env.XAI_API_KEY || cloudflareEnv.XAI_API_KEY || process.env.XAI_API_KEY;
    case 'Cohere':
      return import.meta.env.COHERE_API_KEY || process.env.COHERE_API_KEY;
    case 'AzureOpenAI':
      return import.meta.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
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
