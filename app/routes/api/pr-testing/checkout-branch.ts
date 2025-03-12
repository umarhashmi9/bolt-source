/**
 * @server-only
 *
 * @file API route for checking out a branch in a repository
 */

import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { checkoutBranch } from '~/server/pr-testing.server';

interface CheckoutBranchRequest {
  directory: string;
  branchName: string;
  startPoint?: string;
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const data = (await request.json()) as CheckoutBranchRequest;
    const { directory, branchName, startPoint } = data;

    if (!directory || !branchName) {
      return json({ success: false, message: 'Missing required fields: directory, branchName' }, { status: 400 });
    }

    const result = await checkoutBranch({ directory, branchName, startPoint });

    return json(result);
  } catch (error) {
    console.error('Error checking out branch:', error);
    return json(
      {
        success: false,
        message: `Failed to checkout branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
};
