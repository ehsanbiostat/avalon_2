/**
 * Server-side Supabase client
 * Uses service role key - ONLY for API routes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Create a server-side Supabase client with service role
 * This bypasses RLS - use with caution and only in API routes
 */
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a server client with player context set in Postgres session
 * This allows RLS policies to work with the player_id
 * @param playerId - The player's localStorage UUID
 */
export async function createServerClientWithPlayer(playerId: string) {
  const client = createServerClient();

  // Set the player_id in the Postgres session for RLS
  await client.rpc('set_config', {
    setting_name: 'app.player_id',
    new_value: playerId,
    is_local: true,
  });

  return client;
}

/**
 * Get the player ID from request headers
 * @param request - The incoming request
 * @returns The player ID or null if not provided
 */
export function getPlayerIdFromRequest(request: Request): string | null {
  return request.headers.get('X-Player-ID');
}

/**
 * Validate that a player ID is provided
 * @param playerId - The player ID to validate
 * @throws Error if player ID is missing
 */
export function requirePlayerId(playerId: string | null): asserts playerId is string {
  if (!playerId) {
    throw new Error('UNAUTHORIZED: Player ID required');
  }
}
