/**
 * @server-only
 *
 * @file API route for setting up a remote for a repository
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { setupRemote } from '~/server/pr-testing.server';

interface SetupRemoteRequest {
  directory: string;
  remoteName: string;
  remoteUrl: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as SetupRemoteRequest;
    const { directory, remoteName, remoteUrl } = data;

    if (!directory || !remoteName || !remoteUrl) {
      return json(
        { success: false, message: 'Missing required fields: directory, remoteName, remoteUrl' },
        { status: 400 },
      );
    }

    const result = await setupRemote({ directory, remoteName, remoteUrl });

    return json(result);
  } catch (error) {
    console.error('Error setting up remote:', error);
    return json(
      {
        success: false,
        message: `Failed to set up remote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
