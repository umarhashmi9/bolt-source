import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/react';
import { createUser } from '~/actions/user';
import { authenticator } from '~/lib/services/auth.server';

type GoogleUser = {
  sub: number;
  picture: string;
  email: string;
  name: string;
};

export let loader: LoaderFunction = async ({ request }) => {
  const resp = authenticator.authenticate('google', request);

  const newUser: GoogleUser = {
    sub: resp.sub,
    email: resp.email as string,
    name: resp.login as string,
    picture: resp.picture as string,
  };

  console.log(newUser);
  console.log(resp);

  // const user = await createUser({
  //   email: newUser.email as string,
  //   name: newUser.name as string,
  //   avatar: newUser.picture as string,
  //   googleId: newUser.sub,
  //   id: '',
  //   githubId: null,
  //   password: null,
  //   subscriptionId: null,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });

  return resp;
};
