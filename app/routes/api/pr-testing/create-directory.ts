/**
 * @server-only
 *
 * @file API route for creating a directory
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createDirectory } from '~/server/pr-testing.server';

interface CreateDirectoryRequest {
  path: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as CreateDirectoryRequest;
    const { path } = data;

    if (!path) {
      return json({ success: false, message: 'Missing required field: path' }, { status: 400 });
    }

    const result = await createDirectory(path);

    return json(result);
  } catch (error) {
    console.error('Error creating directory:', error);
    return json(
      {
        success: false,
        message: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
