/**
 * API Route: GET /api/watch/[gameId]
 * Get game state for a watcher (neutral observer view)
 *
 * Feature 015: Watcher Mode
 * - Returns WatcherGameState (subset of GameState)
 * - Excludes all player-specific and sensitive fields
 * - Updates watcher lastSeen timestamp for session keepalive
 * - Does NOT write to any game database tables (per NFR-004)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { getGameById } from '@/lib/supabase/games';
import { getCurrentProposal, getActiveProposalForQuest } from '@/lib/supabase/proposals';
import { getVotedPlayerIds, getVotesForProposal } from '@/lib/supabase/votes';
import { buildWatcherGameState } from '@/lib/domain/watcher-game-state';
import { isWatcher, updateWatcherLastSeen } from '@/lib/domain/watcher-session';
import type { WatcherError, WatcherGameState } from '@/types/watcher';
import type { LastVoteResult } from '@/types/game';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * GET /api/watch/[gameId]
 * Get game state for watcher (neutral observer view)
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    // Try to update lastSeen FIRST to prevent race condition with cleanup
    // This keeps the session alive before we check validity
    const sessionUpdated = updateWatcherLastSeen(gameId, playerId);

    // If session wasn't updated (watcher timed out or never joined),
    // check if they were a valid watcher that got cleaned up
    // In that case, we should be lenient - browser tabs can be throttled
    if (!sessionUpdated && !isWatcher(gameId, playerId)) {
      // Watcher session expired or never existed
      // Return a specific error that the client can handle for auto-rejoin
      const error: WatcherError = {
        code: 'SESSION_EXPIRED',
        message: 'Watcher session expired. Please rejoin.',
      };
      return NextResponse.json({ error }, { status: 401 });
    }

    const supabase = createServerClient();

    // Get game (READ ONLY)
    const game = await getGameById(supabase, gameId);
    if (!game) {
      const error: WatcherError = {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      };
      return NextResponse.json({ error }, { status: 404 });
    }

    // Get current proposal - same logic as player endpoint
    let currentProposal = null;
    if (game.phase === 'quest' || game.phase === 'quest_result') {
      currentProposal = await getActiveProposalForQuest(supabase, gameId, game.current_quest);
    } else {
      currentProposal = await getCurrentProposal(supabase, gameId);
    }

    // Get player data for nicknames and activity status
    const { data: playersData } = await supabase
      .from('players')
      .select('id, nickname, last_activity_at')
      .in('id', game.seating_order);

    // Get voted player IDs if in voting phase
    let votedPlayerIds: string[] = [];
    if (game.phase === 'voting' && currentProposal) {
      votedPlayerIds = await getVotedPlayerIds(supabase, currentProposal.id);
    }

    // Get last vote result (for reveal animation)
    // Watchers see same reveal timing as players (FR-007)
    let lastVoteResult: LastVoteResult | null = null;
    if (game.phase === 'quest' || game.phase === 'team_building') {
      const { data: recentProposal } = await supabase
        .from('team_proposals')
        .select('*')
        .eq('game_id', gameId)
        .neq('status', 'pending')
        .order('resolved_at', { ascending: false })
        .limit(1)
        .single();

      if (recentProposal) {
        const voteInfos = await getVotesForProposal(supabase, recentProposal.id);
        lastVoteResult = {
          proposal_id: recentProposal.id,
          is_approved: recentProposal.status === 'approved',
          approve_count: recentProposal.approve_count,
          reject_count: recentProposal.reject_count,
          votes: voteInfos,
        };
      }
    }

    // Build watcher game state (neutral observer view)
    const watcherState: WatcherGameState = await buildWatcherGameState(
      supabase,
      game,
      currentProposal,
      votedPlayerIds,
      lastVoteResult,
      playersData || []
    );

    return NextResponse.json({ data: watcherState });
  } catch (error) {
    console.error('[Watch State Error]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to get game state' } },
      { status: 500 }
    );
  }
}
