/**
 * POST /api/games/[gameId]/complete-parallel-phase
 * Feature 021: Trigger completion check for parallel quiz phase
 *
 * Called when quiz timer expires or when checking if phase should complete.
 * Checks both conditions (assassin submitted + quiz timeout/complete) and
 * transitions to game_over if both are met.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById, updateGame } from '@/lib/supabase/games';
import { updateRoomStatus } from '@/lib/supabase/rooms';
import { checkAssassinGuess } from '@/lib/domain/win-conditions';
import { logGameOver } from '@/lib/supabase/game-events';
import { isParallelQuizComplete, canCompleteParallelPhase } from '@/lib/domain/merlin-quiz';
import { getEligibleQuizPlayers } from '@/lib/domain/quiz-eligibility';
import { broadcastGameOver } from '@/lib/broadcast';
import type { WinReason } from '@/types/game';

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

    const supabase = createServerClient();

    // Get player record
    const player = await findPlayerByPlayerId(supabase, headerPlayerId);
    if (!player) {
      return NextResponse.json(
        { error: { code: 'PLAYER_NOT_FOUND', message: 'Player not registered' } },
        { status: 404 }
      );
    }

    // Get game state
    const game = await getGameById(supabase, gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Verify player is in this game
    if (!game.seating_order.includes(player.id)) {
      return NextResponse.json(
        { error: { code: 'NOT_IN_GAME', message: 'You are not in this game' } },
        { status: 403 }
      );
    }

    // Only works in parallel_quiz phase
    if (game.phase !== 'parallel_quiz') {
      return NextResponse.json({
        success: false,
        message: 'Game is not in parallel quiz phase',
        current_phase: game.phase,
      });
    }

    // Get player roles
    const { data: playerRoles } = await supabase
      .from('player_roles')
      .select('player_id, role, special_role')
      .eq('room_id', game.room_id);

    if (!playerRoles) {
      return NextResponse.json(
        { error: 'Failed to fetch player roles' },
        { status: 500 }
      );
    }

    // Determine outcome based on quest results
    const goodWins = game.quest_results.filter(r => r.result === 'success').length;
    const outcome: 'good_win' | 'evil_win' = goodWins >= 3 ? 'good_win' : 'evil_win';

    // Check if Assassin exists and has submitted
    const hasAssassin = playerRoles.some(r => r.special_role === 'assassin');
    const assassinSubmitted = outcome === 'evil_win' || game.assassin_guess_id !== null;

    // Get quiz completion status
    const { count: quizVotesCount } = await supabase
      .from('merlin_quiz_votes')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);

    // Get eligible players for quiz
    const hasMorgana = playerRoles.some(r => r.special_role === 'morgana');
    const allPlayersWithRoles = game.seating_order.map(pid => ({
      id: pid,
      special_role: playerRoles.find(r => r.player_id === pid)?.special_role ?? null,
    }));
    const eligiblePlayerIds = getEligibleQuizPlayers(outcome, allPlayersWithRoles, hasMorgana);

    // Get quiz start time
    const { data: firstVote } = await supabase
      .from('merlin_quiz_votes')
      .select('submitted_at')
      .eq('game_id', gameId)
      .order('submitted_at', { ascending: true })
      .limit(1)
      .single();

    const votesSubmitted = quizVotesCount ?? 0;

    // If no votes at all, quiz hasn't started - can't complete
    if (!firstVote) {
      return NextResponse.json({
        success: false,
        message: 'Quiz has not started yet',
        assassin_submitted: assassinSubmitted,
        quiz_complete: false,
      });
    }

    const quizStartTime = firstVote.submitted_at;
    const quizComplete = isParallelQuizComplete(votesSubmitted, eligiblePlayerIds.length, quizStartTime);

    // Check if we can complete the parallel phase
    const canComplete = canCompleteParallelPhase(outcome, hasAssassin, assassinSubmitted, quizComplete);

    if (!canComplete) {
      return NextResponse.json({
        success: false,
        message: 'Conditions not met for phase completion',
        assassin_submitted: assassinSubmitted,
        quiz_complete: quizComplete,
        votes_submitted: votesSubmitted,
        eligible_count: eligiblePlayerIds.length,
      });
    }

    // Determine final winner
    let winner = game.winner;
    let winReason = game.win_reason;

    // For Good wins, check if Assassin found Merlin
    if (outcome === 'good_win' && hasAssassin && game.assassin_guess_id) {
      const merlin = playerRoles.find(r => r.special_role === 'merlin');
      if (merlin) {
        const assassinResult = checkAssassinGuess(game.assassin_guess_id, merlin.player_id);
        winner = assassinResult.winner;
        winReason = assassinResult.reason;
      }
    }

    // Transition to game_over
    await updateGame(supabase, gameId, {
      phase: 'game_over',
      winner,
      win_reason: winReason,
      ended_at: new Date().toISOString(),
    });

    // Close room
    await updateRoomStatus(supabase, game.room_id, 'closed');

    // Log game over
    if (winner && winReason) {
      const assassinFoundMerlin = outcome === 'good_win' && winner === 'evil';
      await logGameOver(supabase, gameId, winner, winReason, assassinFoundMerlin);
    }

    // Broadcast game over
    if (winner && winReason) {
      await broadcastGameOver(gameId, winner, winReason as WinReason);
    }

    return NextResponse.json({
      success: true,
      phase_completed: true,
      winner,
      win_reason: winReason,
    });
  } catch (error) {
    console.error('Complete parallel phase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
