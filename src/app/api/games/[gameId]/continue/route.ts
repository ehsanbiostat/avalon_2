/**
 * API Route: POST /api/games/[gameId]/continue
 * Advance from quest_result to lady_of_lake or team_building for next quest
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById } from '@/lib/supabase/games';
import { getInvestigatedPlayerIds, getPreviousLadyHolderIds } from '@/lib/supabase/lady-investigations';
import { isShowingResults, isTerminalPhase } from '@/lib/domain/game-state-machine';
import { shouldTriggerLadyPhase } from '@/lib/domain/lady-of-lake';
import { errors, handleError } from '@/lib/utils/errors';
import type { ContinueGameResponse } from '@/types/game';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/continue
 * Move to next quest after viewing results
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Validate player ID
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return errors.unauthorized();
    }

    const supabase = createServerClient();

    // Get player record
    const player = await findPlayerByPlayerId(supabase, playerId);
    if (!player) {
      return errors.playerNotFound();
    }

    // Get game
    const game = await getGameById(supabase, gameId);
    if (!game) {
      return NextResponse.json(
        { error: { code: 'GAME_NOT_FOUND', message: 'Game not found' } },
        { status: 404 }
      );
    }

    // Verify player is in this game
    if (!game.seating_order.includes(player.id)) {
      return NextResponse.json(
        { error: { code: 'NOT_IN_GAME', message: 'You are not in this game' } },
        { status: 403 }
      );
    }

    // Check if game is already over
    if (isTerminalPhase(game.phase)) {
      const response: ContinueGameResponse = {
        phase: game.phase,
        current_quest: game.current_quest,
        current_leader_id: game.current_leader_id,
        winner: game.winner || undefined,
        win_reason: game.win_reason || undefined,
      };
      return NextResponse.json({ data: response });
    }

    // Check if in quest_result phase
    if (!isShowingResults(game.phase)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PHASE', message: 'Can only continue from quest_result phase' } },
        { status: 400 }
      );
    }

    // CRITICAL FIX: Use optimistic locking to prevent race condition
    // If multiple players press "Continue" simultaneously, only the first one should succeed
    // We do this by atomically updating the phase only if it's still 'quest_result'
    
    // Check if Lady phase should trigger (after Quest 2, 3, 4)
    // Only if migration 009 applied (lady_enabled exists and is true)
    let shouldGoToLadyPhase = false;
    if (game.lady_enabled === true) {
      try {
        const [investigatedIds, previousHolderIds] = await Promise.all([
          getInvestigatedPlayerIds(supabase, gameId),
          getPreviousLadyHolderIds(supabase, gameId),
        ]);
        shouldGoToLadyPhase = shouldTriggerLadyPhase(
          game.current_quest,
          game.lady_enabled,
          investigatedIds,
          previousHolderIds,
          game.seating_order,
          game.lady_holder_id
        );
      } catch {
        // Migration 009 not applied - skip Lady phase
        shouldGoToLadyPhase = false;
      }
    }

    if (shouldGoToLadyPhase) {
      // ATOMIC UPDATE: Only update if phase is still 'quest_result'
      const { data: updateResult, error: updateError } = await supabase
        .from('games')
        .update({ phase: 'lady_of_lake' })
        .eq('id', gameId)
        .eq('phase', 'quest_result') // Optimistic lock - only update if phase unchanged
        .select()
        .single();
      
      if (updateError || !updateResult) {
        // Another request already processed this - return current state
        const currentGame = await getGameById(supabase, gameId);
        const response: ContinueGameResponse = {
          phase: currentGame?.phase || 'team_building',
          current_quest: currentGame?.current_quest || game.current_quest,
          current_leader_id: currentGame?.current_leader_id || game.current_leader_id,
        };
        return NextResponse.json({ data: response });
      }

      const response: ContinueGameResponse = {
        phase: 'lady_of_lake',
        current_quest: game.current_quest,
        current_leader_id: game.current_leader_id,
      };

      return NextResponse.json({ data: response });
    }

    // ATOMIC UPDATE: Only update if phase is still 'quest_result' (prevents double rotation)
    // Calculate new leader index first (before any state changes)
    const nextLeaderIndex = (game.leader_index + 1) % game.seating_order.length;
    const nextLeaderId = game.seating_order[nextLeaderIndex];
    const nextQuest = game.current_quest + 1;

    // Single atomic update with optimistic lock
    const { data: updateResult, error: updateError } = await supabase
      .from('games')
      .update({
        phase: 'team_building',
        current_quest: nextQuest,
        leader_index: nextLeaderIndex,
        current_leader_id: nextLeaderId,
      })
      .eq('id', gameId)
      .eq('phase', 'quest_result') // Optimistic lock - only update if phase unchanged
      .select()
      .single();
    
    if (updateError || !updateResult) {
      // Another request already processed this - return current state
      const currentGame = await getGameById(supabase, gameId);
      const response: ContinueGameResponse = {
        phase: currentGame?.phase || 'team_building',
        current_quest: currentGame?.current_quest || game.current_quest + 1,
        current_leader_id: currentGame?.current_leader_id || nextLeaderId,
      };
      return NextResponse.json({ data: response });
    }

    // Successfully updated - return new state
    const response: ContinueGameResponse = {
      phase: 'team_building',
      current_quest: nextQuest,
      current_leader_id: nextLeaderId,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

