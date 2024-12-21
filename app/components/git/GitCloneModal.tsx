import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogRoot } from '~/components/ui/Dialog';
import { GitHubAuth } from '~/lib/github/GitHubAuth';
import { getGitHubUser, getUserRepos } from '~/lib/github/github.client';
import { toast } from 'react-toastify';
import { GitCloneSpinner } from './GitCloneSpinner';

interface GitCloneModalProps {
  open: boolean;
  onClose: () => void;
  onClone: (url: string) => Promise<void>;
}

export function GitCloneModal({ open, onClose, onClone }: GitCloneModalProps) {
  const [publicUrl, setPublicUrl] = useState('');
  const [userRepos, setUserRepos] = useState<Array<{ name: string; url: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  const loadUserRepos = useCallback(async () => {
    const token = localStorage.getItem('github_token');

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      setIsLoading(true);

      const user = await getGitHubUser(token);
      setUsername(user.login);

      const repos = await getUserRepos(token);
      setUserRepos(
        repos.map((repo) => ({
          name: repo.full_name,
          url: repo.clone_url,
        })),
      );
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error loading repos:', error);
      toast.error('Failed to load repositories');

      if (error instanceof Error && 'status' in error && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem('github_token');
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadUserRepos();
    }
  }, [open, loadUserRepos]);

  const handleAuthComplete = useCallback(
    async (token: string) => {
      try {
        const user = await getGitHubUser(token);
        setUsername(user.login);
        setIsAuthenticated(true);
        loadUserRepos();
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        localStorage.removeItem('github_token');
        setIsAuthenticated(false);
      }
    },
    [loadUserRepos],
  );

  const handleClone = useCallback(async () => {
    try {
      const cloneUrl = selectedRepo || publicUrl;
      
      if (cloneUrl) {
        setIsCloning(true);
        onClose(); // Close the modal immediately when starting clone
        await onClone(cloneUrl);
        setIsCloning(false);
      }
    } catch (error) {
      console.error('Clone error:', error);
      toast.error('Failed to clone repository');
      setIsCloning(false);
    }
  }, [selectedRepo, publicUrl, onClone, onClose]);

  return (
    <>
      <DialogRoot open={open} onOpenChange={onClose}>
        <Dialog className="w-[500px] bg-[#1E1E1E] rounded-lg border border-[#6F3FB6] shadow-2xl">
          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="text-[17px] font-medium text-white">Clone Repository</h2>
            <button onClick={onClose} className="text-[#8B8B8B] hover:text-white">
              <span className="i-ph:x-bold text-xl" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {(!selectedRepo || !isAuthenticated) && (
              <div>
                <div className="text-[13px] font-medium text-[#8B8B8B] mb-2">Public Repository</div>
                <input
                  type="text"
                  placeholder="Enter Git URL"
                  value={publicUrl}
                  onChange={(e) => {
                    setPublicUrl(e.target.value);

                    if (e.target.value && selectedRepo) {
                      setSelectedRepo('');
                    }
                  }}
                  className="w-full p-2 h-[32px] rounded bg-[#2D2D2D] border border-[#383838] text-white placeholder-[#8B8B8B] focus:outline-none focus:border-[#525252]"
                />
              </div>
            )}

            <div>
              <div className="text-[13px] font-medium text-[#8B8B8B] mb-2">
                {isAuthenticated ? `${username}'s Repositories` : 'Private Repository'}
              </div>
              {isAuthenticated ? (
                <select
                  value={selectedRepo}
                  onChange={(e) => {
                    setSelectedRepo(e.target.value);

                    if (e.target.value) {
                      setPublicUrl('');
                    }
                  }}
                  className="w-full px-2 h-9 rounded bg-[#2D2D2D] border border-[#383838] text-white focus:outline-none focus:border-[#525252] text-ellipsis appearance-none"
                  style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '2rem',
                    paddingTop: '0',
                    paddingBottom: '0',
                  }}
                >
                  <option value="" className="py-1">
                    Select a repository
                  </option>
                  {userRepos.map((repo) => (
                    <option key={repo.url} value={repo.url} className="py-1">
                      {repo.name}
                    </option>
                  ))}
                </select>
              ) : (
                <GitHubAuth onAuthComplete={handleAuthComplete} onError={(error) => toast.error(error.message)}>
                  <button className="w-full h-[32px] flex gap-2 items-center justify-center bg-[#2D2D2D] text-white hover:bg-[#383838] rounded border border-[#383838] transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>Connect GitHub</span>
                  </button>
                </GitHubAuth>
              )}
              {isLoading && (
                <div className="flex items-center justify-center mt-2">
                  <div className="i-svg-spinners:90-ring-with-bg text-[#0969DA] text-xl animate-spin" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 h-[32px] rounded bg-[#2D2D2D] text-white hover:bg-[#383838] transition-colors border border-[#383838]"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!publicUrl && !selectedRepo}
                className="px-4 h-[32px] rounded bg-[#6F3FB6]/80 text-white hover:bg-[#8B4FE3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clone Repository
              </button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>
      <GitCloneSpinner isOpen={isCloning} />
    </>
  );
}
