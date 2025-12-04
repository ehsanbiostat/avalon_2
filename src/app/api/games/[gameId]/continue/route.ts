/**
 * API Route: POST /api/games/[gameId]/continue
 * Advance from quest_result to lady_of_lake or team_building for next quest
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById, updateGame, rotateLeader } from '@/lib/supabase/games';
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
      // Move to Lady of the Lake phase
      await updateGame(supabase, gameId, {
        phase: 'lady_of_lake',
      });

      const response: ContinueGameResponse = {
        phase: 'lady_of_lake',
        current_quest: game.current_quest,
        current_leader_id: game.current_leader_id,
      };

      return NextResponse.json({ data: response });
    }

    // Rotate leader for next quest
    await rotateLeader(supabase, gameId);

    // Get updated game
    const updatedGame = await getGameById(supabase, gameId);
    if (!updatedGame) {
      throw new Error('Game disappeared after update');
    }

    // Move to team_building for next quest
    await updateGame(supabase, gameId, {
      phase: 'team_building',
      current_quest: game.current_quest + 1,
    });

    const response: ContinueGameResponse = {
      phase: 'team_building',
      current_quest: game.current_quest + 1,
      current_leader_id: updatedGame.current_leader_id,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

