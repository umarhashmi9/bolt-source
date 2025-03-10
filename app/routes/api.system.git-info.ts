import type { LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';

// These are injected by Vite at build time
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

interface GitHubRepoInfo {
  name: string;
  full_name: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  parent?: {
    full_name: string;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
  };
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

const getLocalGitInfo = async () => {
  try {
    // Try to use Node.js execSync if available (local environment)
    const execSync = await getExecSync();

    if (typeof execSync === 'function') {
      try {
        return {
          commitHash: await safeExecSync('git rev-parse HEAD'),
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
    console.error('Failed to get local git info:', error);

    return null;
  }
};

const getGitHubInfo = async (repoFullName: string) => {
  try {
    // Add GitHub token if available
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    // Try to get GitHub token from environment variables
    let githubToken: string | undefined;

    try {
      // This will work in Node.js environments
      if (typeof process !== 'undefined' && process.env) {
        githubToken = process.env.GITHUB_TOKEN;
      }
    } catch {
      // In Cloudflare, we can't access process.env
      githubToken = undefined;
    }

    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    console.log('Fetching GitHub info for:', repoFullName);

    const response = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers,
    });

    if (!response.ok) {
      console.error('GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        repoFullName,
      });

      // If we get a 404, try the main repo as fallback
      if (response.status === 404 && repoFullName !== 'stackblitz-labs/bolt.diy') {
        return getGitHubInfo('stackblitz-labs/bolt.diy');
      }

      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data as GitHubRepoInfo;
  } catch (error) {
    console.error('Failed to get GitHub info:', error);

    return null;
  }
};

export const loader: LoaderFunction = async ({ request: _request }) => {
  const localInfo = await getLocalGitInfo();
  console.log('Local git info:', localInfo); // Debug log

  // If we have local info, try to get GitHub info for both our fork and upstream
  let githubInfo = null;

  if (localInfo?.repoName) {
    githubInfo = await getGitHubInfo(localInfo.repoName);
  }

  // If no local info or GitHub info, try the main repo
  if (!githubInfo) {
    githubInfo = await getGitHubInfo('stackblitz-labs/bolt.diy');
  }

  const response = {
    local: localInfo || {
      commitHash: 'unknown',
      branch: 'unknown',
      commitTime: 'unknown',
      author: 'unknown',
      email: 'unknown',
      remoteUrl: 'unknown',
      repoName: 'unknown',
    },
    github: githubInfo
      ? {
          currentRepo: {
            fullName: githubInfo.full_name,
            defaultBranch: githubInfo.default_branch,
            stars: githubInfo.stargazers_count,
            forks: githubInfo.forks_count,
            openIssues: githubInfo.open_issues_count,
          },
          upstream: githubInfo.parent
            ? {
                fullName: githubInfo.parent.full_name,
                defaultBranch: githubInfo.parent.default_branch,
                stars: githubInfo.parent.stargazers_count,
                forks: githubInfo.parent.forks_count,
              }
            : null,
        }
      : null,
    isForked: Boolean(githubInfo?.parent),
    timestamp: new Date().toISOString(),
  };

  console.log('Final response:', response); // Debug log

  return json(response);
};
