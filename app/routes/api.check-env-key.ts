import type { LoaderFunction } from '@remix-run/node';

const ENV_API_KEY_MAP: Record<string, string> = {
  Anthropic: 'ANTHROPIC_API_KEY',
  OpenAI: 'OPENAI_API_KEY',
  xAI: 'XAI_API_KEY',
  Cohere: 'COHERE_API_KEY',
  Google: 'GOOGLE_API_KEY',
  Groq: 'GROQ_API_KEY',
  HuggingFace: 'HUGGINGFACE_API_KEY',
  Deepseek: 'DEEPSEEK_API_KEY',
  Mistral: 'MISTRAL_API_KEY',
  Together: 'TOGETHER_API_KEY',
  OpenRouter: 'OPENROUTER_API_KEY',
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  if (!provider || !ENV_API_KEY_MAP[provider]) {
    return Response.json({ isSet: false });
  }

  const envVarName = ENV_API_KEY_MAP[provider];
  const isSet = !!process.env[envVarName];

  return Response.json({ isSet });
};
