import type { ActionFunction } from '@remix-run/node';
import { authenticator } from '~/lib/services/auth.server';

export const action: ActionFunction = async ({ request }) => {
  return await authenticator.authenticate('github', request);
};
