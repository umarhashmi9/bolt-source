import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';
import type { AuthError, FormInputs, userTypes } from '~/types/auth';
import { fetchGitHubProfile } from '~/utils/fetchGitHubProfile';

export let authenticator = new Authenticator<any>();

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const inputs: FormInputs = {
      email: { value: (form.get('email') as string) || '' },
      username: { value: (form.get('username') as string) || '' },
      password: { value: (form.get('password') as string) || '' },
      confirmPassword: { value: (form.get('confirmPassword') as string) || '' },
    };

    // Validate inputs
    if (!inputs.email.value) {
      inputs.email.error = 'Email is required';
    }
    if (!inputs.username.value) {
      inputs.username.error = 'Username is required';
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
      const { id, login, email, avatar_url, name } = githubProfile as {
        id: string;
        login: string;
        email: string;
        avatar_url: string;
        name: string;
      };
      return { id, login, email, avatar_url, name };
    },
  ),
  'github',
);
