import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';

type userTypes = {
  id: string;
  email: string;
  username: string;
  password: string;
};

export let authenticator = new Authenticator<userTypes>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = (form.get('email') as string) || '';
    const username = (form.get('username') as string) || '';
    const password = (form.get('password') as string) || '';

    const user: userTypes = {
      id: 'some-unique-id', // Replace with actual logic to generate or retrieve a user ID
      email,
      username,
      password,
    };

    return user;
  }),
  'user-pass',
);

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
