/**
 * API Route: POST /api/watch/[gameId]/join
 * Join a game as a watcher (spectator)
 *
 * Feature 015: Watcher Mode
 * - Validates game exists and has started
 * - Checks 10-watcher limit
 * - Adds watcher to in-memory session store
 * - Does NOT write to any game database tables (per NFR-004)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById } from '@/lib/supabase/games';
import {
  addWatcher,
  getWatcherCount,
  isWatcherLimitReached,
} from '@/lib/domain/watcher-session';
import { MAX_WATCHERS_PER_GAME } from '@/types/watcher';
import type { JoinWatchResponse, WatcherError } from '@/types/watcher';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/watch/[gameId]/join
 * Join as a watcher for a game
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Validate player ID
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      const error: WatcherError = {
        code: 'NICKNAME_REQUIRED',
        message: 'Please register a nickname before watching',
      };
      return NextResponse.json({ error }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get player record (watchers use same registration as players per clarification)
    const player = await findPlayerByPlayerId(supabase, playerId);
    if (!player || !player.nickname) {
      const error: WatcherError = {
        code: 'NICKNAME_REQUIRED',
        message: 'Please register a nickname before watching',
      };
      return NextResponse.json({ error }, { status: 401 });
    }

    // Get game (READ ONLY - no writes)
    const game = await getGameById(supabase, gameId);
    if (!game) {
      const error: WatcherError = {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      };
      return NextResponse.json({ error }, { status: 404 });
    }

    // Check if game has started (FR-003: only allow watching after game starts)
    if (game.phase === 'team_building' && game.current_quest === 1 && game.vote_track === 0) {
      // This is a fresh game that just started - allow watching
    }
    // Actually, if a game record exists, it has started (games are created when room starts)
    // The waiting room state is in rooms table, not games table
    // So if we have a game, it's in progress

    // Check if game has ended
    if (game.phase === 'game_over') {
      // Allow watching ended games to see the final state
      // Watchers can see the game over screen per FR-010
    }

    // Check watcher limit (FR-004: max 10 watchers)
    if (isWatcherLimitReached(gameId)) {
      const error: WatcherError = {
        code: 'WATCHER_LIMIT_REACHED',
        message: `This game has reached the maximum number of spectators (${MAX_WATCHERS_PER_GAME})`,
      };
      return NextResponse.json({ error }, { status: 403 });
    }

    // Add watcher to in-memory session (no database writes per SC-010)
    const added = addWatcher(gameId, playerId, player.nickname);

    if (!added) {
      // Race condition - limit reached between check and add
      const error: WatcherError = {
        code: 'WATCHER_LIMIT_REACHED',
        message: `This game has reached the maximum number of spectators (${MAX_WATCHERS_PER_GAME})`,
      };
      return NextResponse.json({ error }, { status: 403 });
    }

    const response: JoinWatchResponse = {
      success: true,
      gameId,
      watcherCount: getWatcherCount(gameId),
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('[Watch Join Error]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to join as watcher' } },
      { status: 500 }
    );
  }
}
