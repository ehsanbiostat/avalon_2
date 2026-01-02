/**
 * POST /api/games/[gameId]/assassin-guess
 * Submit assassin's guess for Merlin
 *
 * Feature 021: Supports both legacy 'assassin' phase and new 'parallel_quiz' phase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById, updateGame } from '@/lib/supabase/games';
import { updateRoomStatus } from '@/lib/supabase/rooms';
import { checkAssassinGuess } from '@/lib/domain/win-conditions';
import { logGameOver } from '@/lib/supabase/game-events';
import { isParallelQuizComplete, canCompleteParallelPhase } from '@/lib/domain/merlin-quiz';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await context.params;

    // Validate player ID from header
    const headerPlayerId = getPlayerIdFromRequest(request);
    if (!headerPlayerId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Player ID required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { guessed_player_id } = body;

    if (!guessed_player_id) {
      return NextResponse.json(
        { error: 'guessed_player_id is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get player record from localStorage player ID
    const player = await findPlayerByPlayerId(supabase, headerPlayerId);
    if (!player) {
      return NextResponse.json(
        { error: { code: 'PLAYER_NOT_FOUND', message: 'Player not registered' } },
        { status: 404 }
      );
    }

    const player_id = player.id; // Use database UUID for actual logic

    // Get game state
    const game = await getGameById(supabase, gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Feature 021: Support both legacy 'assassin' and new 'parallel_quiz' phases
    if (game.phase !== 'assassin' && game.phase !== 'parallel_quiz') {
      return NextResponse.json(
        { error: 'Game is not in assassin or parallel quiz phase' },
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

    // Feature 021: Handle parallel_quiz phase differently
    if (game.phase === 'parallel_quiz') {
      // First, save the assassin's guess
      await updateGame(supabase, gameId, {
        assassin_guess_id: guessed_player_id,
      });

      // Get quiz completion status
      const { count: quizVotesCount } = await supabase
        .from('merlin_quiz_votes')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      // Calculate eligible players count (all except assassin)
      const eligiblePlayersCount = game.seating_order.length - 1;
      const votesSubmitted = quizVotesCount ?? 0;

      // Get quiz start time
      const { data: firstVote } = await supabase
        .from('merlin_quiz_votes')
        .select('submitted_at')
        .eq('game_id', gameId)
        .order('submitted_at', { ascending: true })
        .limit(1)
        .single();

      const quizStartTime = firstVote?.submitted_at ?? new Date().toISOString();
      const quizComplete = isParallelQuizComplete(votesSubmitted, eligiblePlayersCount, quizStartTime);

      // Check if we can transition to game_over
      const canComplete = canCompleteParallelPhase('good_win', true, true, quizComplete);

      if (canComplete) {
        // Both conditions met - transition to game_over
        await updateGame(supabase, gameId, {
          phase: 'game_over',
          winner: result.winner,
          win_reason: result.reason,
        });

        // Feature 017: Close room when game ends
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
          merlin_id: merlin.player_id,
          phase_complete: true,
        });
      }

      // Assassin submitted but quiz not complete - return success but stay in parallel_quiz
      return NextResponse.json({
        success: true,
        assassin_submitted: true,
        quiz_complete: quizComplete,
        waiting_for_quiz: !quizComplete,
        phase_complete: false,
      });
    }

    // Legacy assassin phase: immediately transition to game_over
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
