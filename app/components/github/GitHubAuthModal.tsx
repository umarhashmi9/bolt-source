import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { GitHubAuth } from '~/lib/github/GitHubAuth';
import { getGitHubUser } from '~/lib/github/github.client';
import { workbenchStore } from '~/lib/stores/workbench';

interface GitHubAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GitHubAuthModal({ isOpen, onClose }: GitHubAuthModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleAuthComplete = useCallback(async (token: string) => {
    try {
      // Get the GitHub user info
      const user = await getGitHubUser(token);

      // Prompt for repository name
      const repoName = prompt(
        'Enter a name for your GitHub repository:',
        'bolt-generated-project',
      );

      if (!repoName) {
        alert('Repository name is required. Push to GitHub cancelled.');
        return;
      }

      workbenchStore.pushToGitHub(repoName, user.login, token);
      onClose();
    } catch (error) {
      console.error('Failed to get GitHub user:', error);
      setError('Failed to get GitHub user info. Please try again.');
    }
  }, [onClose]);

  const handleError = useCallback((error: Error) => {
    setError(error.message);
  }, []);

  // Clear error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  return (
    <DialogRoot open={isOpen}>
      <Dialog onClose={onClose}>
        <div className="w-full max-w-md p-6">
          <h3 className="text-lg font-medium leading-6 text-bolt-elements-textPrimary mb-4">
            GitHub Authentication
          </h3>
          <p className="text-sm text-bolt-elements-textSecondary mb-6">
            Authenticate with GitHub to push your project
          </p>
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          <GitHubAuth
            onAuthComplete={handleAuthComplete}
            onError={handleError}
          />
        </div>
      </Dialog>
    </DialogRoot>
  );
}
