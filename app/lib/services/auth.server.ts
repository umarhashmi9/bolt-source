import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { FormStrategy } from 'remix-auth-form';
import type { FormInputs } from '~/types/auth';
import { fetchGitHubProfile } from '~/utils/fetchGitHubProfile';
import { OAuth2Strategy, CodeChallengeMethod } from 'remix-auth-oauth2';

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

// authenticator.use(
//   new OAuth2Strategy(
//     {
//       cookie: "oauth2", // Optional, can also be an object with more options

//       clientId: CLIENT_ID,
//       clientSecret: CLIENT_SECRET,

//       authorizationEndpoint: "https://provider.com/oauth2/authorize",
//       tokenEndpoint: "https://provider.com/oauth2/token",
//       redirectURI: "https://example.app/auth/callback",

//       tokenRevocationEndpoint: "https://provider.com/oauth2/revoke", // optional

//       scopes: ["openid", "email", "profile"], // optional
//       codeChallengeMethod: CodeChallengeMethod.S256, // optional
//     },
//     async ({ tokens, request }) => {
//       // here you can use the params above to get the user and return it
//       // what you do inside this and how you find the user is up to you
//       return await getUser(tokens, request);
//     }
//   ),
//   // this is optional, but if you setup more than one OAuth2 instance you will
//   // need to set a custom name to each one
//   "provider-name"
// );
