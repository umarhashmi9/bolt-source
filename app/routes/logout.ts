import { redirect } from '@remix-run/node';
import type { ActionFunction } from '@remix-run/node';
import { getSession, sessionStorage } from '~/lib/services/session.server';

export const action: ActionFunction = async ({ request }) => {
  let session = await getSession(request);
  await sessionStorage.destroySession(session);

  // Return a response that includes a script to clear local storage
  return new Response(
    `
    <script>
      localStorage.clear(); // Clear local storage
      window.location.href = '/'; // Redirect to home
    </script>
  `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    },
  );
};
