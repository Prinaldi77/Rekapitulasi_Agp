import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yicrnndbulqahzwzdofw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';

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

