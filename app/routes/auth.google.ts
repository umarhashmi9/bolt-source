import type { ActionFunction } from '@remix-run/cloudflare';
import { authenticator } from '~/lib/services/auth.server';

export const action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate('google', request);
};
