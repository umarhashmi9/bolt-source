import { useCallback, useEffect, useState, useRef } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { GitHubAuth } from '~/lib/github/GitHubAuth';
import { getGitHubUser } from '~/lib/github/github.client';
import { workbenchStore } from '~/lib/stores/workbench';
import { toast } from 'react-toastify';

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthComplete?: (token: string) => void;
  onPushComplete?: (success: boolean, repoUrl?: string) => void;
  initialToken?: string | null;
}

export function GitHubAuthModal({
  isOpen,
  onClose,
  onAuthComplete,
  onPushComplete,
  initialToken,
}: GitHubAuthModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repoName, setRepoName] = useState('bolt-generated-project');
  const [user, setUser] = useState<{ login: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
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

  const handleError = useCallback((error: Error) => {
    setError(error.message);
    toast.error('Failed to authenticate with GitHub: ' + error.message);
  }, []);

  const handleCreateRepo = useCallback(async () => {
    if (!repoName.trim()) {
      setError('Repository name is required');
      return;
    }

    if (!user || !token) {
      return;
    }

    onAuthComplete?.(token);

    try {
      const result = await workbenchStore.pushToGitHub(repoName, user.login, token);
      onPushComplete?.(true, result.html_url);
    } catch (error) {
      console.error('Failed to push to GitHub:', error);
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

  const startAuth = useCallback(() => {
    setIsAuthenticating(true);
  }, []);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsAuthenticated(false);
      setRepoName('bolt-generated-project');
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
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <GitHubAuth onAuthStart={startAuth} onAuthComplete={handleAuthComplete} onError={handleError} />
            </>
          ) : (
            <>
              <p className="text-sm text-bolt-elements-textSecondary mb-6">Enter a name for your GitHub repository</p>
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="Repository name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-[#1A1A1A] text-bolt-elements-textPrimary focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent"
                />
                <button
                  onClick={handleCreateRepo}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
                >
                  Create Repository
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </DialogRoot>
  );
}
