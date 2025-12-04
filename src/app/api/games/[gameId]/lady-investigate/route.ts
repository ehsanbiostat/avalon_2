/**
 * POST /api/games/[gameId]/lady-investigate
 * Submit Lady of the Lake investigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGameById, updateGame, updateLadyHolder } from '@/lib/supabase/games';
import { getPlayerRole } from '@/lib/supabase/roles';
import { 
  createInvestigation, 
  getInvestigatedPlayerIds 
} from '@/lib/supabase/lady-investigations';
import { 
  validateInvestigationTarget, 
  getInvestigationResult 
} from '@/lib/domain/lady-of-lake';
import { isLadyPhase } from '@/lib/domain/game-state-machine';
import type { LadyInvestigateResponse } from '@/types/game';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;
    const body = await request.json();
    const { target_player_id } = body;

    // Get player ID from header (this is the database ID passed from frontend)
    const playerDbId = request.headers.get('x-player-id');
    if (!playerDbId) {
      return NextResponse.json(
        { error: 'Player ID required' },
        { status: 401 }
      );
    }

    if (!target_player_id) {
      return NextResponse.json(
        { error: 'target_player_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get game state
    const game = await getGameById(supabase, gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify game is in Lady phase
    if (!isLadyPhase(game.phase)) {
      return NextResponse.json(
        { error: 'Game is not in Lady of the Lake phase', code: 'NOT_LADY_PHASE' },
        { status: 400 }
      );
    }

    // Verify the player exists in the game
    if (!game.seating_order.includes(playerDbId)) {
      return NextResponse.json(
        { error: 'Player not in this game' },
        { status: 403 }
      );
    }

    // Verify player is the Lady holder
    if (game.lady_holder_id !== playerDbId) {
      return NextResponse.json(
        { error: 'You are not the Lady of the Lake holder', code: 'NOT_LADY_HOLDER' },
        { status: 403 }
      );
    }

    // Get investigated player IDs
    const investigatedIds = await getInvestigatedPlayerIds(supabase, gameId);

    // Validate target
    const validationError = validateInvestigationTarget(
      target_player_id,
      playerDbId,
      investigatedIds,
      game.seating_order
    );

    if (validationError) {
      const code = validationError.includes('yourself') 
        ? 'CANNOT_INVESTIGATE_SELF' 
        : validationError.includes('already') 
          ? 'ALREADY_INVESTIGATED' 
          : 'INVALID_TARGET';
      return NextResponse.json(
        { error: validationError, code },
        { status: 400 }
      );
    }

    // Get target player's role
    const targetRole = await getPlayerRole(supabase, game.room_id, target_player_id);
    if (!targetRole) {
      return NextResponse.json(
        { error: 'Target player role not found' },
        { status: 500 }
      );
    }

    // Get investigation result (Good or Evil)
    const result = getInvestigationResult(targetRole.role);

    // Create investigation record
    await createInvestigation(supabase, {
      game_id: gameId,
      quest_number: game.current_quest,
      investigator_id: playerDbId,
      target_id: target_player_id,
      result,
    });

    // Transfer Lady to target player
    await updateLadyHolder(supabase, gameId, target_player_id);

    // Transition to team_building phase for next quest
    await updateGame(supabase, gameId, {
      phase: 'team_building',
    });

    // Get target player's nickname for response
    const { data: targetData } = await supabase
      .from('players')
      .select('nickname')
      .eq('id', target_player_id)
      .single();

    const response: LadyInvestigateResponse = {
      success: true,
      result,
      new_holder_id: target_player_id,
      new_holder_nickname: targetData?.nickname || 'Unknown',
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Lady investigation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

