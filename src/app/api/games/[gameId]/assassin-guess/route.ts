/**
 * POST /api/games/[gameId]/assassin-guess
 * Submit assassin's guess for Merlin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGameById, updateGame } from '@/lib/supabase/games';
import { updateRoomStatus } from '@/lib/supabase/rooms';
import { checkAssassinGuess } from '@/lib/domain/win-conditions';
import { logGameOver } from '@/lib/supabase/game-events';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;
    const body = await request.json();
    const { player_id, guessed_player_id } = body;

    if (!player_id || !guessed_player_id) {
      return NextResponse.json(
        { error: 'player_id and guessed_player_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get game state
    const game = await getGameById(supabase, gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify game is in assassin phase
    if (game.phase !== 'assassin') {
      return NextResponse.json(
        { error: 'Game is not in assassin phase' },
        { status: 400 }
      );
    }

    // Get all player roles to find Assassin and Merlin
    const { data: playerRoles, error: rolesError } = await supabase
      .from('player_roles')
      .select('player_id, role, special_role')
      .eq('room_id', game.room_id);

    if (rolesError || !playerRoles) {
      return NextResponse.json(
        { error: 'Failed to fetch player roles' },
        { status: 500 }
      );
    }

    // Find Assassin
    const assassin = playerRoles.find((pr) => pr.special_role === 'assassin');
    if (!assassin) {
      return NextResponse.json(
        { error: 'No Assassin found in this game' },
        { status: 400 }
      );
    }

    // Verify submitter is the Assassin
    if (player_id !== assassin.player_id) {
      return NextResponse.json(
        { error: 'Only the Assassin can submit a guess' },
        { status: 403 }
      );
    }

    // Find Merlin
    const merlin = playerRoles.find((pr) => pr.special_role === 'merlin');
    if (!merlin) {
      return NextResponse.json(
        { error: 'No Merlin found in this game' },
        { status: 400 }
      );
    }

    // Determine outcome
    const result = checkAssassinGuess(guessed_player_id, merlin.player_id);

    // Update game with result
    await updateGame(supabase, gameId, {
      phase: 'game_over',
      winner: result.winner,
      win_reason: result.reason,
      assassin_guess_id: guessed_player_id,
    });

    // Feature 017: Close room when game ends (FR-001)
    // Remove room from active rooms list
    await updateRoomStatus(supabase, game.room_id, 'closed');

    // Log game over event
    await logGameOver(
      supabase,
      gameId,
      result.winner!,
      result.reason!,
      guessed_player_id === merlin.player_id
    );

    return NextResponse.json({
      success: true,
      winner: result.winner,
      win_reason: result.reason,
      assassin_found_merlin: guessed_player_id === merlin.player_id,
      merlin_id: merlin.player_id, // Reveal Merlin after game ends
    });
  } catch (error) {
    console.error('Assassin guess error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
