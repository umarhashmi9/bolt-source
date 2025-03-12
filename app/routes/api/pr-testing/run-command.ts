/**
 * @server-only
 *
 * @file API route for running a command
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { runCommand } from '~/server/pr-testing.server';

interface RunCommandRequest {
  command: string;
  directory?: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as RunCommandRequest;
    const { command, directory } = data;

    if (!command) {
      return json({ success: false, message: 'Missing required field: command' }, { status: 400 });
    }

    const result = await runCommand({ command, directory });

    return json(result);
  } catch (error) {
    console.error('Error running command:', error);
    return json(
      {
        success: false,
        message: `Failed to run command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
