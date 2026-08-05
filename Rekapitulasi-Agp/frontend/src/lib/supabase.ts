import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Browser Supabase Client using @supabase/ssr createBrowserClient
 * Automatically synchronizes auth tokens to document cookies for Next.js Middleware!
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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
