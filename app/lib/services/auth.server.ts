import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';
import type { AuthError, FormInputs, userTypes } from '~/types/auth';

export let authenticator = new Authenticator<FormInputs>();

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
