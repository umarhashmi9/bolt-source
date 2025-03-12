/**
 * @server-only
 *
 * @file API route for fetching a branch from a remote
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { fetchBranch } from '~/server/pr-testing.server';

interface FetchBranchRequest {
  directory: string;
  remoteName: string;
  branchName: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as FetchBranchRequest;
    const { directory, remoteName, branchName } = data;

    if (!directory || !remoteName || !branchName) {
      return json(
        { success: false, message: 'Missing required fields: directory, remoteName, branchName' },
        { status: 400 },
      );
    }

    const result = await fetchBranch({ directory, remoteName, branchName });

    return json(result);
  } catch (error) {
    console.error('Error fetching branch:', error);
    return json(
      {
        success: false,
        message: `Failed to fetch branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
