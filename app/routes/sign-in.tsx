import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { data, Form, Link, redirect, useActionData, type MetaFunction } from '@remix-run/react';
import db from '~/actions/prisma';
import Input from '~/components/ui/input';
import { authenticator } from '~/lib/services/auth.server';
import type { LoginFormInputs } from '~/types/auth';
import * as bcrypt from 'bcrypt';
import { getSession } from '~/lib/services/session.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign In - Bolt' },
    { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const resp = await authenticator.authenticate('sign-in', request);

  if (resp.email_username.error || resp.password?.error) {
    return resp;
  } else {
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: resp.email_username.value }, { name: resp.email_username.value }],
      },
    });

    if (user && (await bcrypt.compare(resp.password.value, user.password || ''))) {
      return redirect(`/?userId=${user.id}`);
    } else {
      resp.password.error = "Password doesn't match";
      return resp;
    }
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const user = session.get('user');
  if (user) throw redirect('/');
  return data(null);
};

export default function SignInPage() {
  const actionData = useActionData<LoginFormInputs>();
  return (
    <div className="pt-24 pb-10 min-h-screen bg-bolt-elements-background-depth-2 flex justify-center items-center">
      <div className="flex justify-center items-center flex-col gap-10 w-[344px]">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-bolt-elements-textPrimary text-3xl font-semibold">Welcome back</h1>
          <p className="text-bolt-elements-textSecondary">
            Sign in to Bolt.diy with your GitHub, Google account or credentials.
          </p>
        </div>
        <div className="flex items-center flex-col gap-7 rounded-md flex items-center justify-center ">
          <Form action="/auth/github" method="post" className="w-full">
            <button className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full bg-accent-600 justify-center">
              <img src="/icons/Github.svg" alt="GitHub" className="w-6 h-6" />
              <span className="text-sm font-bold">Sign up with GitHub</span>
            </button>
          </Form>
          <Form action="/auth/google" method="post" className="w-full">
            <button className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full bg-accent-600 justify-center">
              <img src="/icons/Google-login.svg" alt="Google" className="w-6 h-6" />
              <span className="text-sm font-bold">Sign up with Google</span>
            </button>
          </Form>
          <span className="text-bolt-elements-textSecondary">- or -</span>
          <Form method="post" className="w-full">
            <div className="w-full flex flex-col gap-2">
              <Input
                placeholder="Email or Username"
                id="email_username"
                name="email_username"
                error={actionData?.email_username.error}
              />
              <Input placeholder="Password" id="password" name="password" error={actionData?.password.error} />
              <button
                type="submit"
                className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor dark:bg-[#292d32] bg-bolt-elements-prompt-background justify-center"
              >
                <span className="text-sm font-semibold">Sign In</span>
              </button>
              <Link to="/sign-up">
                <p className="text-bolt-elements-textSecondary text-sm text-center underline">
                  Don't have an account? Sign Up.
                </p>
              </Link>
            </div>
          </Form>

          <div className="text-bolt-elements-textSecondary text-xs">
            By signing in you accept the Bolt.diy Terms of Service and acknowledge our Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
