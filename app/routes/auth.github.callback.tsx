import type { LoaderFunction } from '@remix-run/node';
import { authenticator } from '~/lib/services/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const resp = await authenticator.authenticate('github', request);
  console.log('resp', resp);
  return resp;
};
