import { createClient } from '@supabase/supabase-js/dist/module/index.js';
import type { Database } from '~/types/supabase';

// Safely extract and validate Supabase URL
function getSafeSupabaseUrl(): string {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!rawUrl) {
    console.error('Supabase URL is not defined');
    throw new Error('Supabase URL is not defined');
  }

  // Remove any trailing slashes and potential '/auth/v1' suffix
  const cleanUrl = rawUrl.replace(/\/+$/, '').replace(/\/auth\/v1$/, '');
  
  try {
    // Validate the URL
    new URL(cleanUrl);
    return cleanUrl;
  } catch (error) {
    console.error('Invalid Supabase URL:', rawUrl, error);
    throw new Error(`Invalid Supabase URL: ${rawUrl}`);
  }
}

// Safely extract Supabase Anon Key
function getSafeSupabaseAnonKey(): string {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!anonKey) {
    console.error('Supabase Anon Key is not defined');
    throw new Error('Supabase Anon Key is not defined');
  }
  
  return anonKey.trim();
}

// Get safe Supabase configuration
const supabaseUrl = getSafeSupabaseUrl();
const supabaseAnonKey = getSafeSupabaseAnonKey();

// Log configuration for debugging
console.log('Supabase Client Configuration:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length || 0
});

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client-side authentication helpers
export async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

export async function subscribeToAuthChanges(callback: (event: string, session: any) => void) {
  return supabaseClient.auth.onAuthStateChange(callback);
}
