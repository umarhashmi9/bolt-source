import { useCallback, useEffect, useState } from 'react';
import { getGitHubUser, type GitHubUser } from './github.client';

export function useGitHubAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('github_token');

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);

      return;
    }

    try {
      const userInfo = await getGitHubUser(token);
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      // Only remove token if it's an auth error (401 or 403)
      if (error instanceof Error && 'status' in error && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem('github_token');
      }

      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Re-run auth check when window regains focus
  useEffect(() => {
    window.addEventListener('focus', checkAuth);

    return () => {
      window.removeEventListener('focus', checkAuth);
    };
  }, [checkAuth]);

  const handleAuthComplete = useCallback(async (token: string) => {
    try {
      const userInfo = await getGitHubUser(token);
      setUser(userInfo);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('github_token');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('github_token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    handleAuthComplete,
    handleLogout,
  };
}
