/**
 * Browser-side Supabase client
 * Uses anon key - safe for client-side code
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Create a browser-side Supabase client
 * Lazy initialization to avoid errors during build
 */
export function createBrowserClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During SSR/build without env vars, create a placeholder client
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Return a non-functional placeholder during build
      return createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { persistSession: false },
      });
    }
    // eslint-disable-next-line no-console
    console.error('Missing Supabase environment variables. Check .env.local');
  }

  supabaseInstance = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: false, // MVP: No auth session, using localStorage player ID
      },
    }
  );

  return supabaseInstance;
}

/**
 * Supabase client for browser use (lazy singleton)
 * Uses anon key with RLS policies
 */
export function getSupabaseClient(): SupabaseClient {
  return createBrowserClient();
}

/**
 * Create a client with player context for RLS policies
 * @param playerId - The player's localStorage UUID
 */
export function createClientWithPlayer(playerId: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient();
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        // Set app.player_id for RLS policies
        'x-player-id': playerId,
      },
    },
    db: {
      schema: 'public',
    },
  });
}
