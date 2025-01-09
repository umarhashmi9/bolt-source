import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { data, Form, Link, redirect, useActionData, type MetaFunction } from '@remix-run/react';
import { getSession } from '~/lib/services/session.server';
import { authenticator } from '~/lib/services/auth.server';
import Input from '~/components/ui/input';
import type { FormInputs } from '~/types/auth';
import { createUser } from '~/actions/user';
import { getRandomGradient } from '~/utils/getRandomGradient';
import AuthButton from '~/components/ui/AuthButton';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sign Up - Bolt' },
    { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const resp: any = await authenticator.authenticate('user-pass', request);

  if (resp.email.error || resp.username.error || resp.password?.error || resp.confirmPassword?.error) {
    return resp;
  } else {
    const user = await createUser({
      email: resp.email.value as string,
      name: resp.username.value as string,
      password: resp.password.value,
      avatar: getRandomGradient(),
      githubId: null,
      googleId: null,
      id: '',
      subscriptionId: null,
      customerIs: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return redirect(`/?userId=${user.id}`);
  }
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  const user = session.get('user');
  if (user) throw redirect('/');
  return data(null);
};

export default function SignUpPage() {
  const actionData = useActionData<FormInputs>();

  return (
    <div className="pt-24 pb-10 min-h-screen bg-bolt-elements-background-depth-2 flex justify-center items-center">
      <div className="flex justify-center items-center flex-col gap-10 w-[344px]">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-bolt-elements-textPrimary text-3xl font-semibold">Get Started</h1>
          <p className="text-bolt-elements-textSecondary">Create your Bolt.diy account.</p>
        </div>
        <div className="flex items-center flex-col gap-7 rounded-md flex items-center justify-center">
          <AuthButton provider="github" icon="Github" />
          <AuthButton provider="google" icon="Google-login" />
          <span className="text-bolt-elements-textSecondary">- or -</span>
          <Form method="post" className="w-full">
            <div className="flex flex-col gap-2">
              <Input placeholder="Email" id="email" name="email" type="email" error={actionData?.email.error} />
              <Input placeholder="Username" id="username" name="username" error={actionData?.username.error} />
              <Input
                placeholder="Password"
                id="password"
                name="password"
                type="password"
                error={actionData?.password.error}
              />
              <Input
                placeholder="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                error={actionData?.confirmPassword.error}
              />

              <button
                type="submit"
                className="flex items-center gap-2 p-[13px] text-sm text-bolt-elements-textPrimary rounded-md w-full hover:bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor dark:bg-[#292d32] bg-bolt-elements-prompt-background justify-center"
              >
                <span className="text-sm font-semibold">Sign Up</span>
              </button>
              <Link to="/auth/sign-in">
                <p className="text-bolt-elements-textSecondary text-sm text-center underline">
                  Have an account? Sign In.
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
