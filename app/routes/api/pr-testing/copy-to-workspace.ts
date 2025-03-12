/**
 * @server-only
 *
 * @file API route for copying PR files to a workspace directory
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { copyPRToWorkspace } from '~/server/pr-testing.server';

interface CopyToWorkspaceRequest {
  tempDir: string;
  destination: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as CopyToWorkspaceRequest;
    const { tempDir, destination } = data;

    if (!tempDir || !destination) {
      return json({ success: false, message: 'Missing required fields: tempDir, destination' }, { status: 400 });
    }

    const result = await copyPRToWorkspace({ tempDir, destination });

    return json(result);
  } catch (error) {
    console.error('Error copying PR to workspace:', error);
    return json(
      {
        success: false,
        message: `Failed to copy PR to workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
