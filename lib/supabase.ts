import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set — ' +
          'persistence and realtime disabled. Add them to .env.local to enable.'
      );
    }
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // No session persistence needed — anon key only, no user auth
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Singleton — null when env vars are absent so every caller must handle null.
export const supabase: SupabaseClient | null = makeClient();
