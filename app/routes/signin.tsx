import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { data, Link, redirect } from '@remix-run/react';
import Input from '~/components/ui/input';
import { authenticator } from '~/lib/services/auth.server';
import { commitSession, getSession } from '~/lib/services/session.server';

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get('email');
  const username = form.get('username');
  const password = form.get('password');

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password,
    },
  });
  try {
    await authenticator.authenticate('user-pass', request);
    let session = await getSession(request);
    session.set('user', user);

    throw redirect('/', {
      headers: { 'Set-Cookie': await commitSession(session) },
    });
  } catch (error) {
    console.error(error);
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const user = session.get('user');
  if (user) throw redirect('/');
  return data(null);
};

export default function SignInPage() {
  return (
    <div className="h-screen bg-bolt-elements-background-depth-2 flex justify-center items-center">
      <div className="flex justify-center items-center flex-col gap-10 w-[344px]">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-bolt-elements-textPrimary text-3xl font-semibold">Welcome back</h1>
          <p className="text-bolt-elements-textSecondary">
            Sign in to Bolt.diy with your GitHub account or credentials.
          </p>
        </div>
        <div className="flex items-center flex-col gap-7 rounded-md flex items-center justify-center ">
          <button className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full bg-accent-600 justify-center">
            <img src="/icons/Github.svg" alt="GitHub" className="w-6 h-6" />
            <span className="text-sm font-bold">Sign up with GitHub</span>
          </button>
          <span className="text-bolt-elements-textSecondary">- or -</span>
          <div className="w-full flex flex-col gap-2">
            <Input placeholder="Email or Username" />
            <Input placeholder="Password" />
            <button className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor dark:bg-[#292d32] bg-bolt-elements-prompt-background justify-center">
              <span className="text-sm font-semibold">Sign In</span>
            </button>
            <Link to="/sign-up">
              <p className="text-bolt-elements-textSecondary text-sm text-center underline">
                Don't have an account? Sign Up.
              </p>
            </Link>
          </div>
          <div className="text-bolt-elements-textSecondary text-xs">
            By signing in you accept the Bolt.diy Terms of Service and acknowledge our Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
