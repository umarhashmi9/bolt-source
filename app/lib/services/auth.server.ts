import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';
import type { FormInputs, LoginFormInputs } from '~/types/auth';
import { fetchGitHubProfile } from '~/utils/fetchGitHubProfile';
import { OAuth2Strategy } from 'remix-auth-oauth2';
import db from '~/actions/prisma';
import { SignUpValidation } from '~/utils/sign-up-validation';
import { SignInValidation } from '~/utils/sign-in-validation';
import { fetchGoogleProfile } from '~/utils/fetchGoogleProfile';

export let authenticator = new Authenticator<any>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const inputs: FormInputs = {
      email: { value: (form.get('email') as string) || '' },
      username: { value: (form.get('username') as string) || '' },
      password: { value: (form.get('password') as string) || '' },
      confirmPassword: { value: (form.get('confirmPassword') as string) || '' },
    };

    const validatedInputs = SignUpValidation(inputs);

    return validatedInputs;
  }),
  'user-pass',
);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const inputs: LoginFormInputs = {
      email_username: { value: (form.get('email_username') as string) || '' },
      password: { value: (form.get('password') as string) || '' },
    };

    const validatedInputs = SignInValidation(inputs);

    return validatedInputs;
  }),
  'sign-in',
);

authenticator.use(
  new GitHubStrategy(
    {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: process.env.GITHUB_CALLBACK_URL!,
      scopes: ['user:email'],
    },
    async ({ tokens }) => {
      const { access_token } = tokens.data as { access_token: string };
      const githubProfile = await fetchGitHubProfile(access_token);
      const { id, login, email, name } = githubProfile as {
        id: string;
        login: string;
        email: string;
        name: string;
      };
      return { id, login, email, name };
    },
  ),
  'github',
);

authenticator.use(
  new OAuth2Strategy(
    {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: process.env.GOOGLE_CALLBACK_URL!,
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      scopes: ['openid', 'email', 'profile'],
    },
    async ({ tokens }) => {
      const { access_token } = tokens.data as { access_token: string };
      const googleProfile = await fetchGoogleProfile(access_token);
      const { sub, picture, email, name } = googleProfile as {
        sub: string;
        picture: string;
        email: string;
        name: string;
      };
      return { sub, picture, email, name };
    },
  ),
  'google',
);
