import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
// import { prisma } from './db.server';
import { FormStrategy } from 'remix-auth-form';
import { sessionStorage } from './session.server';

type userTypes = {
  id: string;
  email: string;
  username: string;
  password: string;
};

export let authenticator = new Authenticator<userTypes>();

// authenticator.use(
//   new FormStrategy(async ({ form }) => {
//     const email = form.get('email');
//     const password = form.get('password');

//     const user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (!user || user.password !== password) {
//       throw new Error('Invalid email or password');
//     }

//     return user;
//   }),
//   'form',
// );

authenticator.use(
  new GitHubStrategy(
    {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: process.env.GITHUB_CALLBACK_URL!,
      scopes: ['user:email'], // optional
    },
    async ({ tokens, request }) => {
      // const user = await prisma.user.upsert({
      //   where: { githubId: profile.id },
      //   update: {},
      //   create: {
      //     githubId: profile.id,
      //     name: profile.name,
      //     email: profile.email,
      //   },
      // });

      return await getUser(tokens, request);
    },
  ),
  'github',
);
