// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables - Vercel expects these to be set in project settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY;

// Create client only if configured
let supabase;

if (isConfigured) {
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: (url, options) => fetch(url, {
        ...options,
        // Timeout after 10 seconds
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 10000);
          return controller.signal;
        })(),
      }),
    },
  });
} else {
  // Fatal: Supabase not configured — show error instead of silent mock
  console.error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  
  // Throw so the app fails loudly instead of silently showing empty data
  throw new Error(
    'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.'
  );
}

export { supabase };