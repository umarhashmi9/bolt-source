import type { ActionFunctionArgs, LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

// These are injected by Vite at build time
declare const __APP_VERSION: string;
declare const __PKG_NAME: string;
declare const __PKG_DESCRIPTION: string;
declare const __PKG_LICENSE: string;
declare const __PKG_DEPENDENCIES: Record<string, string>;
declare const __PKG_DEV_DEPENDENCIES: Record<string, string>;
declare const __PKG_PEER_DEPENDENCIES: Record<string, string>;
declare const __PKG_OPTIONAL_DEPENDENCIES: Record<string, string>;
declare const __COMMIT_HASH: string;
declare const __GIT_BRANCH: string;
declare const __GIT_COMMIT_TIME: string;
declare const __GIT_AUTHOR: string;
declare const __GIT_EMAIL: string;
declare const __GIT_REMOTE_URL: string;
declare const __GIT_REPO_NAME: string;

// Helper function to dynamically import child_process
async function getExecSync(): Promise<((command: string, options?: any) => string) | undefined> {
  try {
    // This will only work in Node.js environments
    const childProcess = await import('child_process');

    return childProcess.execSync;
  } catch {
    // In Cloudflare Workers, this will fail, but that's expected
    return undefined;
  }
}

// Helper function to safely execute git commands
async function safeExecSync(command: string): Promise<string> {
  try {
    // Check if we're in a Node.js environment where execSync is available
    const execSync = await getExecSync();

    if (typeof execSync === 'function') {
      return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

const getGitInfo = async () => {
  try {
    // Try to use Node.js execSync if available (local environment)
    const execSync = await getExecSync();

    if (typeof execSync === 'function') {
      try {
        return {
          commitHash: await safeExecSync('git rev-parse --short HEAD'),
          branch: await safeExecSync('git rev-parse --abbrev-ref HEAD'),
          commitTime: await safeExecSync('git log -1 --format=%cd'),
          author: await safeExecSync('git log -1 --format=%an'),
          email: await safeExecSync('git log -1 --format=%ae'),
          remoteUrl: await safeExecSync('git config --get remote.origin.url'),
          repoName: (await safeExecSync('git config --get remote.origin.url'))
            .toString()
            .trim()
            .replace(/^.*github.com[:/]/, '')
            .replace(/\.git$/, ''),
        };
      } catch (error) {
        console.error('Git command failed:', error);

        // Fall through to use Vite-injected variables
      }
    }

    // Fallback to Vite-injected variables (Cloudflare or when git commands fail)
    return {
      commitHash: __COMMIT_HASH || 'unknown',
      branch: __GIT_BRANCH || 'unknown',
      commitTime: __GIT_COMMIT_TIME || 'unknown',
      author: __GIT_AUTHOR || 'unknown',
      email: __GIT_EMAIL || 'unknown',
      remoteUrl: __GIT_REMOTE_URL || 'unknown',
      repoName: __GIT_REPO_NAME || 'unknown',
    };
  } catch (error) {
    console.error('Failed to get git info:', error);

    return {
      commitHash: 'unknown',
      branch: 'unknown',
      commitTime: 'unknown',
      author: 'unknown',
      email: 'unknown',
      remoteUrl: 'unknown',
      repoName: 'unknown',
    };
  }
};

// Helper to detect environment
function getEnvironment(): string {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV || 'development';
    }

    return 'production'; // Cloudflare is always production
  } catch {
    return 'production';
  }
}

// Helper to get runtime info
function getRuntimeInfo(): { nodeVersion: string } {
  try {
    if (typeof process !== 'undefined' && process.version) {
      return { nodeVersion: process.version };
    }

    return { nodeVersion: 'cloudflare-worker' };
  } catch {
    return { nodeVersion: 'cloudflare-worker' };
  }
}

const formatDependencies = (
  deps: Record<string, string>,
  type: 'production' | 'development' | 'peer' | 'optional',
): Array<{ name: string; version: string; type: string }> => {
  return Object.entries(deps || {}).map(([name, version]) => ({
    name,
    version: version.replace(/^\^|~/, ''),
    type,
  }));
};

const getAppResponse = async () => {
  const gitInfo = await getGitInfo();

  return {
    name: __PKG_NAME || 'bolt.diy',
    version: __APP_VERSION || '0.1.0',
    description: __PKG_DESCRIPTION || 'A DIY LLM interface',
    license: __PKG_LICENSE || 'MIT',
    environment: getEnvironment(),
    gitInfo,
    timestamp: new Date().toISOString(),
    runtimeInfo: getRuntimeInfo(),
    dependencies: {
      production: formatDependencies(__PKG_DEPENDENCIES, 'production'),
      development: formatDependencies(__PKG_DEV_DEPENDENCIES, 'development'),
      peer: formatDependencies(__PKG_PEER_DEPENDENCIES, 'peer'),
      optional: formatDependencies(__PKG_OPTIONAL_DEPENDENCIES, 'optional'),
    },
  };
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  try {
    return json(await getAppResponse());
  } catch (error) {
    console.error('Failed to get webapp info:', error);

    return json(
      {
        name: 'bolt.diy',
        version: '0.0.0',
        description: 'Error fetching app info',
        license: 'MIT',
        environment: 'error',
        gitInfo: {
          commitHash: 'error',
          branch: 'unknown',
          commitTime: 'unknown',
          author: 'unknown',
          email: 'unknown',
          remoteUrl: 'unknown',
          repoName: 'unknown',
        },
        timestamp: new Date().toISOString(),
        runtimeInfo: { nodeVersion: 'unknown' },
        dependencies: {
          production: [],
          development: [],
          peer: [],
          optional: [],
        },
      },
      { status: 500 },
    );
  }
};

export const action = async ({ request: _request }: ActionFunctionArgs) => {
  try {
    return json(await getAppResponse());
  } catch (error) {
    console.error('Failed to get webapp info:', error);

    return json(
      {
        name: 'bolt.diy',
        version: '0.0.0',
        description: 'Error fetching app info',
        license: 'MIT',
        environment: 'error',
        gitInfo: {
          commitHash: 'error',
          branch: 'unknown',
          commitTime: 'unknown',
          author: 'unknown',
          email: 'unknown',
          remoteUrl: 'unknown',
          repoName: 'unknown',
        },
        timestamp: new Date().toISOString(),
        runtimeInfo: { nodeVersion: 'unknown' },
        dependencies: {
          production: [],
          development: [],
          peer: [],
          optional: [],
        },
      },
      { status: 500 },
    );
  }
};
