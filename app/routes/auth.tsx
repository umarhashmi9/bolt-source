import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { type MetaFunction } from '@remix-run/cloudflare';
import { supabaseClient } from '~/utils/supabase.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { toast } from 'react-toastify';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt - Authentication' }, { name: 'description', content: 'Sign up or Sign in to Bolt AI' }];
};

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Debug Supabase configuration on component mount
  useEffect(() => {
    console.log('Supabase Client Configuration:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKeyProvided: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });

    // Check current authentication state
    const checkUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        console.log('Current User Check:', { 
          user, 
          userError,
          supabaseClient: !!supabaseClient 
        });

        if (user) {
          navigate('/');
        }
      } catch (err) {
        console.error('Error checking current user:', err);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email and password
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up logic
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          toast.error('Passwords do not match');
          return;
        }

        // Log the signup attempt with additional debug info
        console.log('Attempting Supabase Sign Up', { 
          email, 
          supabaseClient: !!supabaseClient,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL
        });

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        // Log the full response for debugging
        console.log('Supabase Sign Up Response:', { 
          data, 
          error,
          user: data?.user,
          session: data?.session
        });

        if (error) {
          setError(error.message);
          toast.error(`Sign Up Error: ${error.message}`);
          return;
        }

        if (data.user) {
          toast.success('Account created successfully');
          navigate('/');
        } else {
          toast.info('Please check your email to confirm your account');
        }
      } else {
        // Sign In logic
        // Log the signin attempt with additional debug info
        console.log('Attempting Supabase Sign In', { 
          email, 
          supabaseClient: !!supabaseClient,
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL
        });

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        // Log the full response for debugging
        console.log('Supabase Sign In Response:', { 
          data, 
          error,
          user: data?.user,
          session: data?.session
        });

        if (error) {
          setError(error.message);
          toast.error(`Sign In Error: ${error.message}`);
          return;
        }

        if (data.user) {
          toast.success('Signed in successfully');
          navigate('/');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('Authentication Error:', err);
      setError(errorMessage);
      toast.error(`Unexpected Error: ${errorMessage}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center items-center h-full">
        <div className="w-full max-w-md bg-bolt-elements-background-depth-2 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h2>
          
          {error && (
            <div className="bg-red-600/20 border border-red-600 text-red-300 p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6E3BFF]"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6E3BFF]"
                placeholder="Enter your password"
              />
            </div>
            
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-bolt-elements-background-depth-1 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6E3BFF]"
                  placeholder="Confirm your password"
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full bg-[#6E3BFF] text-white py-2 rounded-lg hover:bg-[#5A30CC] transition-colors"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            
            <div className="text-center mt-4">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-gray-300 hover:text-white underline"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : 'Need an account? Create Account'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
