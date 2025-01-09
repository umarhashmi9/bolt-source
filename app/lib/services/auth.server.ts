import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';
import type { FormInputs, LoginFormInputs } from '~/types/auth';
import { fetchGitHubProfile } from '~/utils/fetchGitHubProfile';
import { OAuth2Strategy, CodeChallengeMethod } from 'remix-auth-oauth2';
import db from '~/actions/prisma';

export let authenticator = new Authenticator<any>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const inputs: FormInputs = {
      email: { value: (form.get('email') as string) || '' },
      username: { value: (form.get('username') as string) || '' },
      password: { value: (form.get('password') as string) || '' },
      confirmPassword: { value: (form.get('confirmPassword') as string) || '' },
    };
    if (!inputs.email.value) {
      inputs.email.error = 'Email is required';
    } else {
      const existingEmail = await db.user.findUnique({
        where: { email: inputs.email.value },
      });

      if (existingEmail) {
        inputs.email.error = 'Email already exists';
      }
    }
    if (!inputs.username.value) {
      inputs.username.error = 'Username is required';
    } else {
      const existingUsername = await db.user.findUnique({
        where: { name: inputs.username.value },
      });

      if (existingUsername) {
        inputs.username.error = 'Username already exists';
      }
    }
    if (!inputs.password.value) {
      inputs.password.error = 'Password is required';
    } else {
      const password = inputs.password.value;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasDigitOrSymbol = /[\d\W]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasDigitOrSymbol) {
        inputs.password.error = 'Password must contain at least 1 uppercase, 1 lowercase, and 1 digit or symbol';
      }
    }
    if (inputs.password.value !== inputs.confirmPassword.value) {
      inputs.confirmPassword.error = 'Passwords do not match';
    }

    return inputs;
  }),
  'user-pass',
);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const inputs: LoginFormInputs = {
      email_username: { value: (form.get('email_username') as string) || '' },
      password: { value: (form.get('password') as string) || '' },
    };
    if (!inputs.email_username.value) {
      inputs.email_username.error = 'email_username is required';
    } else {
      const existingEmail = await db.user.findUnique({
        where: { email: inputs.email_username.value },
      });

      if (existingEmail) {
        inputs.email_username.error = 'Email already exists';
      }
    }
    if (!inputs.password.value) {
      inputs.password.error = 'Password is required';
    } else {
      const password = inputs.password.value;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasDigitOrSymbol = /[\d\W]/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasDigitOrSymbol) {
        inputs.password.error = 'Password must contain at least 1 uppercase, 1 lowercase, and 1 digit or symbol';
      }
    }

    return inputs;
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
      cookie: 'oauth2', // Optional, can also be an object with more options

      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: process.env.GOOGLE_CALLBACK_URL!,

      authorizationEndpoint: 'https://google.com/oauth2/authorize',
      tokenEndpoint: 'https://google.com/oauth2/token',

      tokenRevocationEndpoint: 'https://google.com/oauth2/revoke', // optional

      scopes: ['openid', 'email', 'profile'], // optional
      codeChallengeMethod: CodeChallengeMethod.S256, // optional
    },
    async ({ tokens, request }) => {
      return await { tokens };
    },
  ),
  'google',
);
