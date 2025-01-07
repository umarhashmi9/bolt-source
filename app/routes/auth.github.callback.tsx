import { redirect } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/node';
import { createUser } from '~/actions/user';
import { authenticator } from '~/lib/services/auth.server';

type GithubUser = {
  login: string;
  id: number;
  email: string;
  avatar_url: string;
};
export const loader: LoaderFunction = async ({ request }) => {
  const resp = await authenticator.authenticate('github', request);
  console.log(resp);
  const newUser: GithubUser = {
    email: resp.email as string,
    login: resp.login as string,
    id: resp.id,
    avatar_url: resp.avatar_url as string,
  };

  const user = await createUser({
    email: newUser.email as string,
    name: newUser.login as string,
    githubId: newUser.id,
    id: '',
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return redirect(`/?userId=${user.id}`);
};
