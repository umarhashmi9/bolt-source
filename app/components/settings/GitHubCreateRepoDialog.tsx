import { DialogRoot, Dialog, DialogTitle } from '~/components/ui/Dialog';
import { useState } from 'react';

interface GitHubCreateRepoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (repoName: string) => void;
}

export function GitHubCreateRepoDialog({ isOpen, onClose, onSubmit }: GitHubCreateRepoDialogProps) {
  const [repoName, setRepoName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (repoName.trim()) {
      onSubmit(repoName.trim());
      onClose();
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={onClose}>
      <Dialog onClose={onClose}>
        <DialogTitle>
          <div className="flex items-center gap-3">
            <div className="i-ph:github-logo-bold text-xl" />
            <span>Create GitHub Repository</span>
          </div>
        </DialogTitle>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label htmlFor="repoName" className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
              Repository Name
            </label>
            <input
              id="repoName"
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded-lg 
                text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary
                focus:outline-none focus:ring-2 focus:ring-bolt-elements-accent/50 focus:border-bolt-elements-accent
                transition-colors"
              placeholder="e.g., my-awesome-project"
              autoFocus
            />
            <p className="mt-2 text-xs text-bolt-elements-textTertiary">
              Choose a unique name for your repository. It can contain letters, numbers, hyphens, and underscores.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-bolt-elements-textSecondary 
                hover:text-bolt-elements-textPrimary transition-colors rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-bolt-elements-accent 
                hover:bg-bolt-elements-accent/90 transition-colors rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!repoName.trim()}
            >
              Create Repository
            </button>
          </div>
        </form>
      </Dialog>
    </DialogRoot>
  );
}
