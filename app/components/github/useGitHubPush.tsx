import { useState } from 'react';
import { toast } from 'react-toastify';
import { getGitHubUser } from '~/lib/github/github.client';

export function useGitHubPush() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPushingToGitHub, setIsPushingToGitHub] = useState(false);

  const handlePushToGitHub = async () => {
    try {
      // Check for existing GitHub token
      const existingToken = localStorage.getItem('github_token');

      if (existingToken) {
        // Get the GitHub user info directly to validate token
        await getGitHubUser(existingToken);
      }

      // Show auth modal, passing the existing token if we have one
      setIsAuthModalOpen(true);
    } catch (error) {
      console.error('Failed to use existing GitHub token:', error);

      // If token is invalid, remove it
      localStorage.removeItem('github_token');
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthComplete = async () => {
    setIsAuthModalOpen(false);
    setIsPushingToGitHub(true);
  };

  const handlePushComplete = (success: boolean, repoUrl?: string) => {
    setIsPushingToGitHub(false);

    if (success) {
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Successfully pushed to GitHub!</span>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              View Repository →
            </a>
          )}
        </div>,
        { autoClose: 5000 },
      );
    } else {
      toast.error('Failed to push to GitHub. Please try again.');
    }
  };

  return {
    isAuthModalOpen,
    isPushingToGitHub,
    setIsAuthModalOpen,
    handlePushToGitHub,
    handleAuthComplete,
    handlePushComplete,
  };
}
