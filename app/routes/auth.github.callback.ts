import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/node';
import { createUser } from '~/actions/user';
import { authenticator } from '~/lib/services/auth.server';
import { commitSession, getSession } from '~/lib/services/session.server';

type GithubUser = {
  name: string;
  id: number;
  email: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const resp = await authenticator.authenticate('github', request);

  const newUser: GithubUser = {
    email: resp.email as string,
    name: resp.name as string,
    id: resp.id,
  };

  const user = await createUser({
    email: newUser.email as string,
    name: newUser.name as string,
    githubId: newUser.id,
    id: '',
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return redirect(`/?userId=${user.id}`);
};
