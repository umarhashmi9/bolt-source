import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { data, Link, redirect } from '@remix-run/react';
import Input from '~/components/ui/input';
import { authenticator } from '~/lib/services/auth.server';
import { commitSession, getSession } from '~/lib/services/session.server';

export const action: ActionFunction = async ({ request }) => {
  return authenticator.authenticate('github', request);
};
