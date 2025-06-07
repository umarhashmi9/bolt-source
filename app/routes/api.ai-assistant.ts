// app/routes/api.ai-assistant.ts
import { json, ActionFunctionArgs } from '@remix-run/node'; // or cloudflare/workers
import { getAISuggestions } from '~/lib/ai-assistant/aiAssistantService.server';
import type { AISuggestionParams } from '~/lib/ai-assistant/types';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ success: false, error: 'Invalid request method' }, { status: 405 });
  }

  try {
    const params = (await request.json()) as AISuggestionParams;
    if (!params.code || !params.language || !params.task) {
      return json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await getAISuggestions(params);
    return json(result);
  } catch (error: any) {
    console.error('AI Assistant API Error:', error);
    return json({ success: false, error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
