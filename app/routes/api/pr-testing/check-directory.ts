/**
 * @server-only
 *
 * @file API route for checking if a directory exists
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { checkDirectory } from '~/server/pr-testing.server';

interface CheckDirectoryRequest {
  path: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as CheckDirectoryRequest;
    const { path } = data;

    if (!path) {
      return json({ success: false, message: 'Missing required field: path' }, { status: 400 });
    }

    const result = await checkDirectory(path);

    return json(result);
  } catch (error) {
    console.error('Error checking directory:', error);
    return json(
      {
        success: false,
        message: `Failed to check directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
