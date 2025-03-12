/**
 * @server-only
 *
 * @file API route for cloning a repository
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { cloneRepository } from '~/server/pr-testing.server';

interface CloneRepositoryRequest {
  repoUrl: string;
  destination: string;
  branch?: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as CloneRepositoryRequest;
    const { repoUrl, destination, branch } = data;

    if (!repoUrl || !destination) {
      return json({ success: false, message: 'Missing required fields: repoUrl, destination' }, { status: 400 });
    }

    const result = await cloneRepository({ repoUrl, destination, branch });

    return json(result);
  } catch (error) {
    console.error('Error cloning repository:', error);
    return json(
      {
        success: false,
        message: `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
