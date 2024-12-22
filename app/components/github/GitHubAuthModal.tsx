import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { Octokit } from '@octokit/rest';
import { toast } from 'react-toastify';
import { GitHubAuth } from '~/lib/github/GitHubAuth';
import { getGitHubUser } from '~/lib/github/github.client';

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPushComplete?: (success: boolean, repoUrl?: string) => void;
  onAuthComplete?: (token: string) => void;
  initialToken?: string | null;
}

export function GitHubAuthModal({
  isOpen,
  onClose,
  onPushComplete,
  onAuthComplete,
  initialToken,
}: GitHubAuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repoName, setRepoName] = useState('bolt-generated-project');
  const [repoVisibility, setRepoVisibility] = useState(false);
  const [user, setUser] = useState<{ login: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const hasShownToast = useRef(false);

  // If we have an initial token, validate and use it
  useEffect(() => {
    if (initialToken && !isAuthenticated) {
      getGitHubUser(initialToken)
        .then((githubUser) => {
          setUser(githubUser);
          setToken(initialToken);
          setIsAuthenticated(true);
        })
        .catch((error) => {
          console.error('Failed to validate token:', error);
          setError('Failed to validate GitHub token. Please authenticate again.');
        });
    }
  }, [initialToken, isAuthenticated]);

  const checkRepoVisibility = useCallback(
    async (name: string) => {
      if (!isAuthenticated || !user || !token) {
        return;
      }

      try {
        const octokit = new Octokit({ auth: token });

        try {
          const { data: repo } = await octokit.repos.get({
            owner: user.login,
            repo: name,
          });
          setRepoVisibility(repo.private);
        } catch (error) {
          if (error instanceof Error && 'status' in error && error.status === 404) {
            // Repository doesn't exist yet, set to public
            setRepoVisibility(false);
          } else {
            console.error('Error checking repo visibility:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing Octokit:', error);
      }
    },
    [isAuthenticated, user, token],
  );

  // Check repository visibility when the modal opens or repo name changes
  useEffect(() => {
    if (isOpen && repoName) {
      checkRepoVisibility(repoName);
    }
  }, [isOpen, repoName, checkRepoVisibility]);

  const handleRepoNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setRepoName(newName);
      checkRepoVisibility(newName);
    },
    [checkRepoVisibility],
  );

  const handleAuthComplete = useCallback(async (authToken: string) => {
    setIsAuthenticating(true);

    try {
      const githubUser = await getGitHubUser(authToken);
      setUser(githubUser);
      setToken(authToken);
      setIsAuthenticated(true);

      if (!hasShownToast.current) {
        toast.success('Successfully authenticated with GitHub!');
        hasShownToast.current = true;
      }
    } catch (error: any) {
      console.error('Failed to get GitHub user:', error);
      setError('Failed to get GitHub user info. Please try again.');
      toast.error('Failed to authenticate with GitHub: ' + (error.message || 'Unknown error'));
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleCreateRepo = useCallback(async () => {
    if (!repoName.trim()) {
      setError('Repository name is required');
      return;
    }

    if (!token || !user) {
      setError('Not authenticated with GitHub');
      return;
    }

    onAuthComplete?.(token);

    try {
      // Always use force push
      const result = await workbenchStore.pushToGitHub(repoName, user.login, token, true);
      onPushComplete?.(true, result.html_url);
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
      setError(error instanceof Error ? error.message : 'Failed to push to GitHub');
      onPushComplete?.(false);
    }
  }, [repoName, user, token, onAuthComplete, onPushComplete]);

  // Monitor localStorage for GitHub token
  useEffect(() => {
    if (isAuthenticating) {
      const checkToken = () => {
        const token = localStorage.getItem('github_token');

        if (token) {
          setIsAuthenticating(false);
          handleAuthComplete(token);
        }

        return undefined;
      };

      // Check immediately and then set up interval
      checkToken();

      const interval = setInterval(checkToken, 500);

      // Cleanup interval
      return () => clearInterval(interval);
    }

    return undefined;
  }, [isAuthenticating, handleAuthComplete]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsAuthenticated(false);
      setRepoName('bolt-generated-project');
      setRepoVisibility(false);
      setUser(null);
      setToken(null);
      hasShownToast.current = false;
    }
  }, [isOpen]);

  return (
    <DialogRoot open={isOpen}>
      {isAuthenticating ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0F0F0F] rounded-xl p-6 flex flex-col items-center gap-4 border border-purple-500/30">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-200/20 rounded-full animate-spin" />
            <p className="text-bolt-elements-textPrimary">Authenticating with GitHub...</p>
          </div>
        </div>
      ) : (
        <Dialog
          onClose={onClose}
          className="w-full max-w-md p-6 bg-[#0F0F0F] rounded-xl p-6 flex flex-col items-center gap-4 border border-purple-500/30 shadow-[0_4px_20px_-4px_rgba(124,58,237,0.3)]"
        >
          <h3 className="text-lg font-medium leading-6 text-bolt-elements-textPrimary mb-4">
            {isAuthenticated ? 'Push GitHub Repository' : 'GitHub Authentication'}
          </h3>
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-bolt-elements-textSecondary mb-6">
                Authenticate with GitHub to push your project
              </p>
              <GitHubAuth onAuthComplete={handleAuthComplete} onError={(error) => setError(error.message)}>
                <button className="w-full h-[32px] flex gap-2 items-center justify-center bg-[#2D2D2D] text-white hover:bg-[#383838] rounded border border-[#383838] transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>Connect GitHub</span>
                </button>
              </GitHubAuth>
            </>
          ) : (
            <>
              <p className="text-sm text-bolt-elements-textSecondary mb-6">Enter a name for your GitHub repository</p>
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={repoName}
                  onChange={handleRepoNameChange}
                  placeholder="Enter repository name"
                  className="w-full px-2 h-[32px] rounded bg-[#2D2D2D] border border-[#383838] text-white placeholder-[#8B8B8B] focus:outline-none focus:border-[#525252]"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#8B8B8B]">Make Private</span>
                  <button
                    onClick={async () => {
                      if (isUpdatingVisibility) {
                        return;
                      }

                      const newVisibility = !repoVisibility;
                      setRepoVisibility(newVisibility);
                      setIsUpdatingVisibility(true);

                      if (token && user) {
                        try {
                          await workbenchStore.updateRepoVisibility(repoName, newVisibility, user.login, token);
                          toast.success(`Repository visibility set to ${newVisibility ? 'private' : 'public'}`);
                          await new Promise((resolve) => setTimeout(resolve, 2000));
                        } catch (error) {
                          console.error('Error updating visibility:', error);
                          setRepoVisibility(!newVisibility); // Revert on failure
                          toast.error('Failed to update repository visibility');
                        } finally {
                          setIsUpdatingVisibility(false);
                        }
                      }
                    }}
                    disabled={isUpdatingVisibility}
                    className={`h-[32px] w-[32px] flex items-center justify-center transition-colors bg-transparent ${
                      isUpdatingVisibility
                        ? 'opacity-50 cursor-not-allowed'
                        : repoVisibility
                          ? 'text-[#6F3FB6] hover:text-[#8B4FE3]'
                          : 'text-[#8B8B8B] hover:text-[#A3A3A3]'
                    }`}
                    title={repoVisibility ? 'Private Repository' : 'Public Repository'}
                  >
                    {isUpdatingVisibility ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {repoVisibility ? (
                          <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                          </>
                        )}
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleCreateRepo}
                  disabled={isUpdatingVisibility}
                  className={`w-full h-[32px] flex gap-2 items-center justify-center rounded ${
                    isUpdatingVisibility
                      ? 'bg-[#2D2D2D] text-[#8B8B8B] cursor-not-allowed'
                      : 'bg-[#6F3FB6] text-white hover:bg-[#8B4FE3]'
                  } transition-colors`}
                >
                  <span>Push Repository</span>
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </DialogRoot>
  );
}
