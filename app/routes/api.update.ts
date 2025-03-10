import { json, type ActionFunction, type LoaderFunction } from '@remix-run/cloudflare';

/*
 * This will be true when running in a Node.js environment (server-side)
 * and false when running in a browser environment (client-side)
 */
const isServer =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof process.versions.node !== 'undefined';

// Function to get git information - only works on server-side
async function getGitInfo() {
  // Skip if not running on server
  if (!isServer) {
    console.log('Not running on server, skipping git commands');

    return {
      currentCommit: 'unavailable-in-browser',
      currentBranch: 'unavailable-in-browser',
      latestCommitMessage: 'Git information is not available in browser environment',
      isCloudflare: false,
    };
  }

  try {
    // Dynamic import only on server side
    const childProcess = await import('child_process');
    const execSync = childProcess.execSync;

    // Check if git is installed
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      console.log('Git version:', gitVersion);

      // Check if we're in a git repository
      const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { encoding: 'utf8' }).trim();

      if (isGitRepo === 'true') {
        // Get git information
        const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        const latestCommitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();

        return {
          currentCommit: currentCommit.substring(0, 7),
          currentBranch,
          latestCommitMessage,
          isCloudflare: false,
        };
      }
    } catch (error) {
      console.error('Error executing git commands:', error);
    }
  } catch (error) {
    console.error('Failed to import child_process:', error);
  }

  // Fallback for when git commands fail or not in a git repository
  return {
    currentCommit: 'unavailable',
    currentBranch: 'unavailable',
    latestCommitMessage: 'Git information is not available',
    isCloudflare: false,
  };
}

// Add a loader function to handle GET requests
export const loader: LoaderFunction = async () => {
  // Get environment info
  const { currentCommit, currentBranch, latestCommitMessage, isCloudflare } = await getGitInfo();

  // Default update instructions
  let updateInstructions = [
    '1. Navigate to the project directory',
    '2. Run: git fetch upstream',
    '3. Run: git pull upstream main',
    '4. Run: pnpm install',
    '5. Run: pnpm run build',
  ];

  // Customize instructions based on current branch if available
  if (
    currentBranch &&
    currentBranch !== 'unknown' &&
    currentBranch !== 'unavailable' &&
    currentBranch !== 'unavailable-in-browser' &&
    currentBranch !== 'unavailable-in-cloudflare'
  ) {
    updateInstructions = [
      '1. Navigate to the project directory',
      '2. Run: git fetch upstream',
      `3. Run: git pull upstream ${currentBranch}`,
      '4. Run: pnpm install',
      '5. Run: pnpm run build',
    ];
  }

  // Customize message based on environment
  let environmentMessage;

  if (isCloudflare) {
    environmentMessage =
      'Updates must be performed manually in a Cloudflare environment.\n\n' +
      'This installation is running in a Cloudflare environment where automatic updates and git operations are not possible.';
  } else if (!isServer) {
    environmentMessage =
      'Updates must be performed manually.\n\n' + 'Git information is not available in the browser environment.';
  } else {
    environmentMessage =
      'Updates must be performed manually.\n\n' + 'This installation appears to be running in a local environment.';
  }

  return json(
    {
      stage: 'complete',
      message: 'Update check completed',
      details: {
        updateReady: false,
        currentCommit,
        currentBranch,
        latestCommitMessage,
        changelog:
          environmentMessage +
          ' Please follow the manual update instructions below to keep your installation up to date.',
      },
      instructions: updateInstructions,
    },
    { status: 200 },
  );
};

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Parse request body to get branch info
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const branch = (body.branch as string) ?? 'main';

  // Get environment info
  const { currentCommit, currentBranch, latestCommitMessage, isCloudflare } = await getGitInfo();

  // Default update instructions
  let updateInstructions = [
    '1. Navigate to the project directory',
    '2. Run: git fetch upstream',
    '3. Run: git pull upstream main',
    '4. Run: pnpm install',
    '5. Run: pnpm run build',
  ];

  // Customize instructions based on current branch if available
  if (
    currentBranch &&
    currentBranch !== 'unknown' &&
    currentBranch !== 'unavailable' &&
    currentBranch !== 'unavailable-in-browser' &&
    currentBranch !== 'unavailable-in-cloudflare'
  ) {
    updateInstructions = [
      '1. Navigate to the project directory',
      '2. Run: git fetch upstream',
      `3. Run: git pull upstream ${currentBranch}`,
      '4. Run: pnpm install',
      '5. Run: pnpm run build',
    ];
  }

  // Customize message based on environment
  let environmentMessage;

  if (isCloudflare) {
    environmentMessage =
      'Updates must be performed manually in a Cloudflare environment.\n\n' +
      'This installation is running in a Cloudflare environment where automatic updates and git operations are not possible.';
  } else if (!isServer) {
    environmentMessage =
      'Updates must be performed manually.\n\n' + 'Git information is not available in the browser environment.';
  } else {
    environmentMessage =
      'Updates must be performed manually.\n\n' + 'This installation appears to be running in a local environment.';
  }

  return json(
    {
      stage: 'complete',
      message: 'Update check completed',
      details: {
        updateReady: false,
        currentCommit,
        currentBranch,
        latestCommitMessage,
        changelog:
          environmentMessage +
          ' Please follow the manual update instructions below to keep your installation up to date.',
      },
      instructions: updateInstructions,
    },
    { status: 200 },
  );
};
