import { createClient } from '@supabase/supabase-js/dist/module/index.js';
import type { Database } from '~/types/supabase';

// Safely extract and validate Supabase URL
function getSafeSupabaseUrl(): string {
  const rawUrl = process.env.SUPABASE_URL;
  
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
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
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
console.log('Supabase Server Configuration:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length || 0
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side authentication helper
export async function authenticateUser(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUpUser(email: string, password: string) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function signOutUser() {
  return await supabase.auth.signOut();
}
