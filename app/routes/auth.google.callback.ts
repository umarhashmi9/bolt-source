import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticator } from '~/lib/services/auth.server';

export let loader = ({ request }: LoaderFunctionArgs) => {
  const resp = authenticator.authenticate('google', request);
  console.log(resp);
  return resp;
};
