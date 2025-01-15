import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { logStore } from '~/lib/stores/logs';
import { GitHubClient } from '~/lib/github/GitHubClient';

interface GitHubApiResponse {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
  plan?: {
    name: string;
    collaborators: number;
  };
  [key: string]: any;
}

interface TokenTypeInfo {
  type: 'classic' | 'fine-grained';
  createdAt?: Date;
  expiresAt?: Date;
}

interface GitHubTokenInfo {
  token: string;
  scopes: string[];
  tokenInfo?: TokenTypeInfo;
  userDetails?: GitHubApiResponse;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  stargazers_count: number;
  updated_at: string;
  language?: string;
}

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  default?: boolean;
}

interface RepositoryState extends Repository {
  isExpanded?: boolean;
  isLoadingBranches?: boolean;
  branches?: Branch[];
}

interface GitHubAuthState {
  username: string;
  tokenInfo: GitHubTokenInfo | null;
  isConnected: boolean;
  isVerifying: boolean;
  rateLimits?: {
    remaining: number;
    limit: number;
    reset: Date;
  };
  repositories?: RepositoryState[];
  isLoadingRepos: boolean;
}

const REQUIRED_SCOPES = ['repo', 'user', 'read:org', 'workflow'];
const OPTIONAL_SCOPES = [
  'delete_repo',
  'write:packages',
  'read:packages',
  'admin:org',
  'write:org',
  'manage_runners:org',
  'admin:public_key',
  'admin:repo_hook',
  'admin:org_hook',
  'gist',
  'notifications',
  'user:email',
  'user:follow',
  'write:discussion',
  'read:discussion',
  'codespace',
  'project',
  'admin:gpg_key',
  'admin:ssh_signing_key',
  'repo:status',
  'repo:deployment',
  'public_repo',
  'repo:invite',
  'security_events',
];

export default function ConnectionsTab() {
  const [authState, setAuthState] = useState<GitHubAuthState>({
    username: Cookies.get('githubUsername') || '',
    tokenInfo: null,
    isConnected: false,
    isVerifying: false,
    isLoadingRepos: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load token info from secure storage
    const storedToken = Cookies.get('githubToken');

    if (storedToken) {
      verifyAndLoadTokenInfo(storedToken);
    }
  }, []);

  // Periodically check rate limits when connected
  useEffect(() => {
    if (authState.isConnected) {
      const checkRateLimits = async () => {
        try {
          const response = await fetch('https://api.github.com/rate_limit', {
            headers: {
              Authorization: `Bearer ${authState.tokenInfo?.token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          if (response.ok) {
            const data = (await response.json()) as {
              resources: {
                core: {
                  remaining: number;
                  limit: number;
                  reset: number;
                };
              };
            };

            setAuthState((prev) => ({
              ...prev,
              rateLimits: {
                remaining: data.resources.core.remaining,
                limit: data.resources.core.limit,
                reset: new Date(data.resources.core.reset * 1000),
              },
            }));
          }
        } catch (error) {
          console.error('Failed to fetch rate limits:', error);
        }
      };

      checkRateLimits();

      const interval = setInterval(checkRateLimits, 60000); // Check every minute

      return () => clearInterval(interval);
    }

    return undefined;
  }, [authState.isConnected, authState.tokenInfo?.token]);

  // Add new useEffect for loading repositories and their branches
  useEffect(() => {
    async function loadRepositoriesAndBranches() {
      if (!authState.isConnected || !authState.tokenInfo) {
        return;
      }

      setAuthState((prev) => ({ ...prev, isLoadingRepos: true }));

      try {
        const client = new GitHubClient({
          token: authState.tokenInfo.token,
          username: authState.username,
        });

        // First get repositories
        const repositories = await client.listRepositories();

        logStore.logSystem('Repositories loaded', { count: repositories.length });

        // Then fetch branches for each repository
        const reposWithBranches = await Promise.all(
          repositories.map(async (repo) => {
            try {
              const [owner, repoName] = repo.full_name.split('/');
              const branches = await client.listBranches(owner, repoName);

              logStore.logSystem('Branches loaded', {
                repoName: repo.full_name,
                branchCount: branches.length,
                defaultBranch: branches.find((b) => b.default)?.name,
              });

              return {
                ...repo,
                branches,
                isExpanded: false,
                isLoadingBranches: false,
              };
            } catch (error) {
              logStore.logError('Failed to load branches', {
                repoName: repo.full_name,
                error: error instanceof Error ? error.message : 'Unknown error',
              });

              return {
                ...repo,
                branches: [],
                isExpanded: false,
                isLoadingBranches: false,
              };
            }
          }),
        );

        setAuthState((prev) => ({
          ...prev,
          repositories: reposWithBranches,
          isLoadingRepos: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logStore.logError('Failed to load repositories', { error: errorMessage });
        toast.error('Failed to load repositories. Please try again.');
        setAuthState((prev) => ({ ...prev, isLoadingRepos: false }));
      }
    }

    loadRepositoriesAndBranches();
  }, [authState.isConnected, authState.tokenInfo]);

  const verifyAndLoadTokenInfo = async (token: string) => {
    setAuthState((prev) => ({ ...prev, isVerifying: true }));

    try {
      const client = new GitHubClient({ token, username: authState.username });

      // First validate basic authentication
      const isValid = await client.validateAuth();

      if (!isValid) {
        throw new Error('Invalid GitHub credentials');
      }

      // Get all scopes and user details
      const [scopes, userDetails] = await Promise.all([client.getScopes(), client.getUserDetails()]);

      // Validate required scopes
      const missingScopes = REQUIRED_SCOPES.filter((scope) => !scopes.includes(scope));
      const missingOptionalScopes = OPTIONAL_SCOPES.filter((scope) => !scopes.includes(scope));

      // Specifically check organization access
      if (scopes.includes('read:org')) {
        const orgAccess = await client.validateOrganizationAccess();

        if (!orgAccess.hasAccess) {
          toast.warning(
            <div>
              <p className="font-bold mb-1">Organization Access Issue</p>
              <p>{orgAccess.error}</p>
              <div className="mt-2 p-3 bg-bolt-elements-background-depth-5 rounded-lg text-xs">
                <p className="font-medium mb-1">How to fix:</p>
                <div className="whitespace-pre-line">{orgAccess.details}</div>
              </div>
              <div className="mt-3 flex items-center space-x-3">
                <a
                  href="https://github.com/settings/organizations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover bg-bolt-elements-background-depth-5 rounded-lg border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                >
                  <div className="i-ph:buildings" />
                  <span>Organization Settings</span>
                </a>
                <a
                  href="https://docs.github.com/organizations/restricting-access-to-your-organizations-data/enabling-oauth-app-access-restrictions-for-your-organization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover bg-bolt-elements-background-depth-5 rounded-lg border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                >
                  <div className="i-ph:book" />
                  <span>Learn More</span>
                </a>
              </div>
            </div>,
            {
              autoClose: false,
            },
          );
        }
      }

      if (missingScopes.length > 0) {
        toast.warning(
          <div>
            <p className="font-bold mb-1">Missing required GitHub scopes:</p>
            <ul className="list-disc pl-4">
              {missingScopes.map((scope) => (
                <li key={scope}>
                  {scope} - {getScopeDescription(scope)}
                </li>
              ))}
            </ul>
          </div>,
        );
      }

      if (missingOptionalScopes.length > 0) {
        toast.info(
          <div>
            <p className="font-bold mb-1">Some optional scopes are not granted:</p>
            <ul className="list-disc pl-4">
              {missingOptionalScopes.map((scope) => (
                <li key={scope}>
                  {scope} - {getScopeDescription(scope)}
                </li>
              ))}
            </ul>
          </div>,
        );
      }

      setAuthState((prev) => ({
        ...prev,
        username: userDetails.login,
        tokenInfo: {
          token,
          scopes,
          userDetails,
        },
        isConnected: true,
        isVerifying: false,
      }));

      // Store token securely
      Cookies.set('githubToken', token, {
        secure: true,
        sameSite: 'strict',
        expires: 30, // 30 days
      });

      Cookies.set('githubUsername', userDetails.login);
      Cookies.set(
        'git:github.com',
        JSON.stringify({
          username: token,
          password: 'x-oauth-basic',
        }),
      );

      logStore.logSystem('GitHub connection verified', {
        username: userDetails.login,
        scopes,
        hasToken: true,
      });
    } catch (error) {
      console.error('Failed to verify GitHub token:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to verify GitHub token';
      toast.error(errorMessage);
      setAuthState((prev) => ({ ...prev, isVerifying: false }));
    }
  };

  const handleSaveConnection = async () => {
    const { username, tokenInfo } = authState;

    if (!username || !tokenInfo?.token) {
      toast.error('Please provide both GitHub username and token');
      return;
    }

    await verifyAndLoadTokenInfo(tokenInfo.token);
  };

  const handleDisconnect = () => {
    if (!confirm('Are you sure you want to disconnect from GitHub?')) {
      return;
    }

    // Clear all GitHub-related data
    Cookies.remove('githubUsername');
    Cookies.remove('githubToken');
    Cookies.remove('git:github.com');

    setAuthState({
      username: '',
      tokenInfo: null,
      isConnected: false,
      isVerifying: false,
      isLoadingRepos: false,
    });

    logStore.logSystem('GitHub connection removed');
    toast.success('GitHub connection removed successfully!');
  };

  const getScopeDescription = (scope: string) => {
    const descriptions: Record<string, string> = {
      repo: 'Full repository access',
      user: 'Read user profile data',
      'read:org': 'Read organization data',
      workflow: 'Manage GitHub Actions',
      delete_repo: 'Delete repositories',
      'write:packages': 'Upload packages',
      'read:packages': 'Download packages',
      'admin:org': 'Manage organizations',
      'write:org': 'Write organization data',
      'manage_runners:org': 'Manage Actions runners',
      'admin:public_key': 'Manage SSH keys',
      'admin:repo_hook': 'Manage repository webhooks',
      'admin:org_hook': 'Manage organization webhooks',
      gist: 'Create and edit gists',
      notifications: 'Access notifications',
      'user:email': 'Access email addresses',
      'user:follow': 'Follow/unfollow users',
      'write:discussion': 'Manage discussions',
      'read:discussion': 'Read discussions',
      codespace: 'Manage codespaces',
      project: 'Manage projects',
      'admin:gpg_key': 'Manage GPG keys',
      'admin:ssh_signing_key': 'Manage SSH signing keys',
      'repo:status': 'Access commit status',
      'repo:deployment': 'Access deployment status',
      public_repo: 'Access public repositories',
      'repo:invite': 'Access repository invitations',
      security_events: 'Read and write security events',
    };
    return descriptions[scope] || scope;
  };

  const handleRepositoryClick = (repo: RepositoryState) => {
    if (!authState.tokenInfo) {
      toast.error('Not connected to GitHub');
      return;
    }

    setAuthState((prev) => ({
      ...prev,
      repositories: prev.repositories?.map((r) =>
        r.id === repo.id
          ? {
              ...r,
              isExpanded: !r.isExpanded,
            }
          : r,
      ),
    }));

    logStore.logSystem(repo.isExpanded ? 'Repository collapsed' : 'Repository expanded', {
      repoName: repo.full_name,
      branchCount: repo.branches?.length ?? 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/20">
            <div className="i-ph:git-branch-fill text-xl text-bolt-elements-textPrimary opacity-80" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-bolt-elements-textPrimary">GitHub Connection</h3>
            <p className="text-sm text-bolt-elements-textSecondary mt-1">
              Manage your GitHub integration and permissions
            </p>
          </div>
        </div>
        {authState.isConnected && (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/20">
            <div className="h-2 w-2 rounded-full bg-green-500/80 ring-4 ring-green-500/20" />
            <span className="text-sm text-bolt-elements-textSecondary">
              {authState.rateLimits?.remaining}/{authState.rateLimits?.limit} requests remaining
            </span>
          </div>
        )}
      </div>

      {/* User Profile */}
      {authState.tokenInfo?.userDetails && (
        <div className="rounded-xl bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/20 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start space-x-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-bolt-elements-borderColor/30 to-bolt-elements-borderColor/10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <img
                  src={authState.tokenInfo.userDetails.avatar_url}
                  alt={`${authState.tokenInfo.userDetails.login}'s avatar`}
                  className="relative w-20 h-20 rounded-xl object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-bolt-elements-textPrimary">
                      {authState.tokenInfo.userDetails.login}
                    </h4>
                    <p className="text-sm text-bolt-elements-textSecondary mt-1">
                      Member since {new Date(authState.tokenInfo.userDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20 transition-colors duration-200"
                  >
                    <span>{showAdvanced ? 'Hide Details' : 'Show Details'}</span>
                    <div
                      className={`i-ph:caret-down transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                      <div className="i-ph:book-bookmark-fill opacity-60" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-bolt-elements-textPrimary">
                        {authState.tokenInfo.userDetails.public_repos}
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">Repositories</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                      <div className="i-ph:users-fill opacity-60" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-bolt-elements-textPrimary">
                        {authState.tokenInfo.userDetails.followers}
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">Followers</div>
                    </div>
                  </div>
                  {authState.tokenInfo.userDetails.plan && (
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                        <div className="i-ph:star-fill opacity-60" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-bolt-elements-textPrimary capitalize">
                          {authState.tokenInfo.userDetails.plan.name}
                        </div>
                        <div className="text-xs text-bolt-elements-textSecondary">Plan</div>
                      </div>
                    </div>
                  )}
                  <a
                    href={authState.tokenInfo.userDetails.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                  >
                    <span>View Profile</span>
                    <div className="i-ph:arrow-square-out" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-bolt-elements-background-depth-5 border border-bolt-elements-borderColor/20">
                    <div className="i-ph:key-fill text-bolt-elements-textTertiary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary">Classic Access Token</h5>
                    <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                      Full repository and organization access
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-bolt-elements-textSecondary">Token Health</span>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          authState.tokenInfo?.scopes.length >= REQUIRED_SCOPES.length
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-bolt-elements-textTertiary mt-0.5">
                      {authState.tokenInfo?.scopes.length || 0} permissions enabled
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg bg-bolt-elements-background-depth-5 border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                  >
                    <span>{showAdvanced ? 'Hide Permissions' : 'Show Permissions'}</span>
                    <div
                      className={`i-ph:caret-down transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Token Scopes */}
            <div
              className={`mt-6 transition-all duration-300 ${showAdvanced ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                    <div className="i-ph:shield-check-fill text-bolt-elements-textTertiary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary">Access Permissions</h5>
                    <p className="text-xs text-bolt-elements-textSecondary mt-0.5">
                      {authState.tokenInfo?.scopes.length || 0} of {REQUIRED_SCOPES.length + OPTIONAL_SCOPES.length}{' '}
                      available permissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                    <span className="text-bolt-elements-textSecondary">Required:</span>
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {authState.tokenInfo?.scopes.filter((s) => REQUIRED_SCOPES.includes(s)).length || 0}/
                      {REQUIRED_SCOPES.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                    <span className="text-bolt-elements-textSecondary">Optional:</span>
                    <span className="font-medium text-bolt-elements-textPrimary">
                      {authState.tokenInfo?.scopes.filter((s) => OPTIONAL_SCOPES.includes(s)).length || 0}/
                      {OPTIONAL_SCOPES.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[...REQUIRED_SCOPES, ...OPTIONAL_SCOPES].map((scope) => {
                  const hasScope = authState.tokenInfo?.scopes.includes(scope);
                  const isRequired = REQUIRED_SCOPES.includes(scope);

                  return (
                    <div
                      key={scope}
                      className={`group flex flex-col p-3 rounded-lg border ${
                        hasScope
                          ? 'bg-green-500/5 border-green-500/20 text-green-700 dark:text-green-400'
                          : 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${hasScope ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="ml-3 text-sm font-medium">{scope}</span>
                        {isRequired && (
                          <span className="ml-auto text-[10px] font-medium uppercase tracking-wider opacity-60">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                        {getScopeDescription(scope)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-4 rounded-lg bg-bolt-elements-background-depth-4 border border-bolt-elements-borderColor/20">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-bolt-elements-background-depth-5 border border-bolt-elements-borderColor/20">
                    <div className="i-ph:info text-bolt-elements-textTertiary" />
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-bolt-elements-textPrimary">About Access Tokens</h5>
                    <p className="mt-1 text-sm text-bolt-elements-textSecondary">
                      You're using a Classic Personal Access Token which provides full repository and organization
                      access.
                      {!authState.tokenInfo?.scopes.includes('repo') && (
                        <span className="block mt-2 text-red-500">
                          ⚠️ The 'repo' scope is required for full repository access and management.
                        </span>
                      )}
                      {authState.tokenInfo?.scopes.length === 0 && (
                        <span className="block mt-2 text-red-500">
                          ⚠️ No permissions granted. Please generate a new token with the required permissions.
                        </span>
                      )}
                    </p>
                    <div className="mt-3 flex items-center space-x-3">
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover rounded-lg bg-bolt-elements-background-depth-5 border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                      >
                        <div className="i-ph:gear" />
                        <span>Manage Tokens</span>
                      </a>
                      <a
                        href="https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover rounded-lg bg-bolt-elements-background-depth-5 border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105"
                      >
                        <div className="i-ph:book" />
                        <span>Learn More</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repository List Section */}
      {authState.isConnected && (
        <div className="rounded-xl border border-bolt-elements-borderColor/20 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/20">
                  <div className="i-ph:books-fill text-bolt-elements-textTertiary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-bolt-elements-textPrimary">Recent Repositories</h3>
                  <p className="text-sm text-bolt-elements-textSecondary">Your most recently updated repositories</p>
                </div>
              </div>
              <a
                href={`https://github.com/${authState.username}?tab=repositories`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 rounded-lg border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <span>View All</span>
                <div className="i-ph:arrow-square-out" />
              </a>
            </div>

            {authState.isLoadingRepos ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="i-ph:spinner animate-spin text-3xl text-bolt-elements-textTertiary mb-3" />
                <p className="text-sm text-bolt-elements-textSecondary">Loading repositories...</p>
              </div>
            ) : authState.repositories && authState.repositories.length > 0 ? (
              <div className="space-y-3">
                {authState.repositories.map((repo) => (
                  <div key={repo.id}>
                    <div
                      onClick={() => handleRepositoryClick(repo)}
                      className="group p-4 rounded-lg bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/20 hover:from-bolt-elements-background-depth-2 hover:to-bolt-elements-background-depth-3 transition-all duration-200 cursor-pointer hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="i-ph:repo-fill text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary transition-colors duration-200" />
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-medium text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover truncate transition-colors duration-200"
                            >
                              {repo.full_name}
                            </a>
                            {repo.private && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-full bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor/20 text-bolt-elements-textTertiary">
                                Private
                              </span>
                            )}
                            <div
                              className={`i-ph:caret-down transition-transform duration-300 ease-in-out ${
                                repo.isExpanded ? 'rotate-180' : ''
                              } ${repo.isLoadingBranches ? 'opacity-0' : 'opacity-100'}`}
                            />
                            {repo.isLoadingBranches && (
                              <div className="i-ph:spinner animate-spin text-bolt-elements-textTertiary" />
                            )}
                          </div>
                          {repo.description && (
                            <p className="mt-1 text-sm text-bolt-elements-textSecondary line-clamp-2 group-hover:text-bolt-elements-textPrimary transition-colors duration-200">
                              {repo.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-xs text-bolt-elements-textTertiary">
                            {repo.language && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-bolt-elements-textTertiary" />
                                <span>{repo.language}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <div className="i-ph:star" />
                              <span>{repo.stargazers_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="i-ph:clock" />
                              <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Branches Section */}
                    {repo.isExpanded && (
                      <div className="mt-2 ml-6 pl-4 border-l-2 border-bolt-elements-borderColor/20">
                        {repo.isLoadingBranches ? (
                          <div className="flex items-center justify-center space-x-2 py-4 text-sm text-bolt-elements-textTertiary">
                            <div className="i-ph:spinner animate-spin" />
                            <span>Loading branches...</span>
                          </div>
                        ) : repo.branches && repo.branches.length > 0 ? (
                          <div className="py-2 space-y-2">
                            {/* Default branch first, then other branches */}
                            {repo.branches
                              .sort((a, b) => {
                                if (a.default) {
                                  return -1;
                                }

                                if (b.default) {
                                  return 1;
                                }

                                return a.name.localeCompare(b.name);
                              })
                              .map((branch) => (
                                <div
                                  key={branch.name}
                                  className={`group flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                                    branch.default
                                      ? 'bg-green-500/5 hover:bg-green-500/10 border border-green-500/20'
                                      : 'bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 hover:from-bolt-elements-background-depth-2 hover:to-bolt-elements-background-depth-3'
                                  }`}
                                >
                                  <div className="flex items-center min-w-0">
                                    <div
                                      className={`i-ph:git-branch ${
                                        branch.default ? 'text-green-500' : 'text-bolt-elements-textTertiary'
                                      } group-hover:text-bolt-elements-textSecondary transition-colors duration-200`}
                                    />
                                    <span className="ml-2 text-sm text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary transition-colors duration-200 truncate">
                                      {branch.name}
                                    </span>
                                    {branch.default && (
                                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                                        default
                                      </span>
                                    )}
                                    {branch.protected && (
                                      <div
                                        className="ml-2 i-ph:shield-check text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary transition-colors duration-200"
                                        title="Protected branch"
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <a
                                      href={`${repo.html_url}/tree/${branch.name}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 rounded-lg text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover hover:bg-bolt-elements-background-depth-3 transition-all duration-200"
                                      title="View branch on GitHub"
                                    >
                                      <div className="i-ph:arrow-square-out" />
                                    </a>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(branch.commit.sha);
                                        toast.success(`Copied ${branch.name} commit SHA`);
                                      }}
                                      className="p-1 rounded-lg text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 transition-all duration-200"
                                      title="Copy commit SHA"
                                    >
                                      <div className="i-ph:copy" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-sm text-bolt-elements-textTertiary">
                            <div className="i-ph:git-branch text-2xl mb-2" />
                            <p>No branches found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="i-ph:book-bookmark text-4xl text-bolt-elements-textTertiary mb-3" />
                <p className="text-sm text-bolt-elements-textSecondary mb-4">No repositories found</p>
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover bg-gradient-to-br from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-3 rounded-lg border border-bolt-elements-borderColor/20 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="i-ph:plus" />
                  <span>Create Repository</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Form */}
      <div className="rounded-xl border border-bolt-elements-borderColor/20 overflow-hidden">
        <form
          className="p-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveConnection();
          }}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* Username Field */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="github-username"
                  className="flex items-center space-x-2 text-sm font-medium text-bolt-elements-textSecondary"
                >
                  <div className="i-ph:user-circle-fill opacity-60" />
                  <span>GitHub Username</span>
                </label>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="i-ph:at text-bolt-elements-textTertiary" />
                </div>
                <input
                  id="github-username"
                  type="text"
                  value={authState.username}
                  onChange={(e) => setAuthState((prev) => ({ ...prev, username: e.target.value }))}
                  disabled={authState.isVerifying}
                  className="w-full h-10 pl-9 pr-3 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/30 rounded-lg text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColor/50 disabled:opacity-60 transition-all duration-200"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Token Field */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="github-token"
                  className="flex items-center space-x-2 text-sm font-medium text-bolt-elements-textSecondary"
                >
                  <div className="i-ph:key-fill opacity-60" />
                  <span>Personal Access Token</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,user,read:org,workflow,delete_repo,write:packages,read:packages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-bolt-elements-textLink hover:text-bolt-elements-textLinkHover transition-colors duration-200"
                >
                  <span>Generate new token</span>
                  <div className="i-ph:plus-circle" />
                </a>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="i-ph:lock-key text-bolt-elements-textTertiary" />
                </div>
                <input
                  id="github-token"
                  type="password"
                  value={authState.tokenInfo?.token || ''}
                  onChange={(e) =>
                    setAuthState((prev) => ({
                      ...prev,
                      tokenInfo: {
                        ...prev.tokenInfo,
                        token: e.target.value,
                      } as GitHubTokenInfo,
                    }))
                  }
                  disabled={authState.isVerifying}
                  className="w-full h-10 pl-9 pr-3 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/30 rounded-lg text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColor/50 disabled:opacity-60 transition-all duration-200"
                  placeholder="Enter access token"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4">
              {!authState.isConnected ? (
                <button
                  type="submit"
                  disabled={authState.isVerifying || !authState.username || !authState.tokenInfo?.token}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {authState.isVerifying ? (
                    <>
                      <div className="i-ph:spinner animate-spin opacity-80" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <div className="i-ph:plug-fill opacity-80" />
                      <span>Connect</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDisconnect}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-bolt-elements-button-danger-background text-bolt-elements-button-danger-text hover:bg-bolt-elements-button-danger-backgroundHover transition-all duration-200"
                  >
                    <div className="i-ph:plug-fill opacity-80" />
                    <span>Disconnect</span>
                  </button>
                  <span className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 bg-green-500/5 rounded-lg border border-green-500/20">
                    <div className="i-ph:check-circle-fill" />
                    <span>Connected</span>
                  </span>
                </>
              )}
            </div>
            {authState.rateLimits && (
              <div className="flex items-center space-x-2 text-sm text-bolt-elements-textTertiary">
                <div className="i-ph:clock-countdown opacity-60" />
                <span>Rate limit resets at {authState.rateLimits.reset.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
