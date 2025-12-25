/**
 * API Route: GET /api/rooms/[code]/watch-status
 * Check if a room's game is watchable
 *
 * Feature 015: Watcher Mode
 * - Returns whether the game can be watched
 * - Returns current watcher count and limit
 * - Does NOT write to any database tables
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { getWatcherCount, isWatcherLimitReached } from '@/lib/domain/watcher-session';
import { MAX_WATCHERS_PER_GAME } from '@/types/watcher';
import type { WatchStatusResponse } from '@/types/watcher';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/watch-status
 * Check if a room's game is watchable
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Validate player ID
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing player ID' } },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get room by code (READ ONLY)
    // Use maybeSingle() to avoid errors when room doesn't exist
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, status, current_game_id')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    // Only treat as "not found" if room is null (not if there's a query error)
    if (roomError) {
      console.error('[Watch Status] Room query error:', roomError);
      return NextResponse.json(
        { error: { code: 'QUERY_ERROR', message: 'Failed to check room' } },
        { status: 500 }
      );
    }

    if (!room) {
      const response: WatchStatusResponse = {
        watchable: false,
        reason: 'ROOM_NOT_FOUND',
      };
      return NextResponse.json({ data: response });
    }

    // Check if game has started
    if (!room.current_game_id) {
      // Room exists but no game yet (still in waiting room)
      const response: WatchStatusResponse = {
        watchable: false,
        reason: 'GAME_NOT_STARTED',
      };
      return NextResponse.json({ data: response });
    }

    // Check if room status indicates game ended
    if (room.status === 'completed') {
      const response: WatchStatusResponse = {
        watchable: false,
        reason: 'GAME_ENDED',
      };
      return NextResponse.json({ data: response });
    }

    // Get game to verify it's in progress
    const { data: game } = await supabase
      .from('games')
      .select('id, phase')
      .eq('id', room.current_game_id)
      .single();

    if (!game) {
      const response: WatchStatusResponse = {
        watchable: false,
        reason: 'GAME_NOT_FOUND',
      };
      return NextResponse.json({ data: response });
    }

    // Allow watching games that have ended (to see final state)
    // Only block if game hasn't started yet (which shouldn't happen if current_game_id exists)

    // Check watcher count
    const watcherCount = getWatcherCount(room.current_game_id);
    const limitReached = isWatcherLimitReached(room.current_game_id);

    const response: WatchStatusResponse = {
      watchable: !limitReached,
      gameId: room.current_game_id,
      watcherCount,
      watcherLimit: MAX_WATCHERS_PER_GAME,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('[Watch Status Error]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get watch status' } },
      { status: 500 }
    );
  }
}
