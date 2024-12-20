import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { GitHubAuth } from '~/lib/github/GitHubAuth';
import { getGitHubUser } from '~/lib/github/github.client';
import { workbenchStore } from '~/lib/stores/workbench';

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
    try {
      const githubUser = await getGitHubUser(authToken);
      setUser(githubUser);
      setToken(authToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to get GitHub user:', error);
      setError('Failed to get GitHub user info. Please try again.');
    }
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

  const handleError = useCallback((error: Error) => {
    setError(error.message);
  }, []);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsAuthenticated(false);
      setRepoName('bolt-generated-project');
      setUser(null);
      setToken(null);
    }
  }, [isOpen]);

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose} className="!bg-transparent !shadow-none">
        <div className="w-full max-w-md p-6 bg-[#0F0F0F] rounded-xl border border-purple-500/30 shadow-[0_4px_20px_-4px_rgba(124,58,237,0.3),_0_0_30px_-4px_rgba(124,58,237,0.2)]">
          <h3 className="text-lg font-medium leading-6 text-bolt-elements-textPrimary mb-4">
            {isAuthenticated ? 'Push GitHub Repository' : 'GitHub Authentication'}
          </h3>
          {!isAuthenticated ? (
            <>
              <p className="text-sm text-bolt-elements-textSecondary mb-6">
                Authenticate with GitHub to push your project
              </p>
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <GitHubAuth onAuthComplete={handleAuthComplete} onError={handleError} />
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
        </div>
      </Dialog>
    </DialogRoot>
  );
}
