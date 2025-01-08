import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { data, Form, Link, redirect, useActionData, useLoaderData, type MetaFunction } from '@remix-run/react';
import Input from '~/components/ui/input';
import { authenticator } from '~/lib/services/auth.server';
import { getSession } from '~/lib/services/session.server';
import type { FormInputs } from '~/types/auth';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign In - Bolt' },
    { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' },
  ];
};

/**
 * called when the user hits button to login
 *
 * @param param0
 * @returns
 */
export const action: ActionFunction = async ({ request, context }) => {
  const resp = await authenticator.authenticate('user-pass', request);
  console.log('resp', resp);
  return resp;
};

/**
 * get the cookie and see if there are any errors that were
 * generated when attempting to login
 *
 * @param param0
 * @returns
 */
export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const user = session.get('user');
  if (user) throw redirect('/');
  return data(null);
};

/**
 *
 * @returns
 */
export default function SignInPage() {
  const actionData = useActionData<FormInputs>();
  return (
    <div className="pt-24 pb-10 bg-bolt-elements-background-depth-2 flex justify-center items-center">
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
              <Input placeholder="Email or Username" id="email" name="email" error={actionData?.email.error} />
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
