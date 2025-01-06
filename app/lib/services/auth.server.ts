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
      id: 'some-unique-id',
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
      // const response = await fetch('https://api.github.com/user', {
      //   headers: {
      //     Authorization: `token ${tokens.accessToken}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to fetch user information from GitHub');
      // }

      // const profile: any = await response.json();

      // const user: userTypes = {
      //   id: profile.id.toString(), // GitHub user ID
      //   email: profile.email || 'user@example.com', // GitHub email, may need additional API call to get primary email
      //   username: profile.login, // GitHub username
      //   password: '', // GitHub OAuth doesn't provide a password, use a placeholder
      // };

      return { tokens, request };
    },
  ),
  'github',
);
