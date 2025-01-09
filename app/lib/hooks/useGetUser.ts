import { useEffect, useState } from 'react';

export function useGetUser() {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(`/api/getUser/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data: User = await response.json();
        setUser(data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  console.log(user);

  return { user, error, loading };
}
