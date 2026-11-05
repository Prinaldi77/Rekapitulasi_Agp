import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Browser Supabase Client using @supabase/ssr createBrowserClient
 * Automatically synchronizes auth tokens to document cookies for Next.js Middleware!
 * Wrapped with error resilience against network drops & stale refresh tokens.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      return fetch(url, options).catch((err) => {
        console.warn('Supabase fetch network alert:', err?.message || err);
        throw err;
      });
    },
  },
});

/**
 * Server Action / Helper Supabase Client
 */
export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

