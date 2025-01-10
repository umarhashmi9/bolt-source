import { redirect, type LoaderFunction } from '@remix-run/cloudflare';
import { createUser } from '~/actions/user';
import { authenticator } from '~/lib/services/auth.server';

type GithubUser = {
  name: string;
  id: number;
  email: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const resp = await authenticator.authenticate('github', request);

  const newUser: GithubUser = {
    email: resp.email as string,
    name: resp.login as string,
    id: resp.id,
  };

  const user = await createUser({
    email: newUser.email as string,
    name: newUser.name as string,
    githubId: newUser.id,
    googleId: null,
    id: '',
    password: null,
    avatar: null,
    customerIs: '',
    subscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return redirect(`/?userId=${user.id}`);
};
