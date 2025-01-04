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

const mockUsers: userTypes[] = [];

authenticator.use(
  new FormStrategy(async ({ form }) => {
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const username = form.get('username') as string;

    // Check if the user already exists
    const existingUser = mockUsers.find((user) => user.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create a new user
    const newUser: userTypes = {
      id: String(mockUsers.length + 1),
      email,
      password, // In a real scenario, passwords should be hashed
      username,
    };

    // Add the new user to the mock database
    mockUsers.push(newUser);

    // Log the authenticated user
    console.log('Authenticated user:', newUser);

    return newUser;
  }),
  'user-pass',
);

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

// authenticator.use(
//   new GitHubStrategy(
//     {
//       clientId: process.env.GITHUB_CLIENT_ID!,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET!,
//       redirectURI: 'http://localhost:3000/auth/callback',
//       scopes: ['user:email'], // optional
//     },
//     async ({ profile }) => {
//       const user = await prisma.user.upsert({
//         where: { githubId: profile.id },
//         update: {},
//         create: {
//           githubId: profile.id,
//           name: profile.name,
//           email: profile.email,
//         },
//       });

//       return user;
//     },
//   ),
//   'github',
// );
