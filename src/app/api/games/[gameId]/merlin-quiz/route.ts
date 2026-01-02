/**
 * API Routes: /api/games/[gameId]/merlin-quiz
 * Feature 010: Endgame Merlin Quiz
 * Feature 021: Support for parallel_quiz phase
 *
 * POST - Submit a quiz vote
 * GET - Get current quiz state
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById, updateGame } from '@/lib/supabase/games';
import { updateRoomStatus } from '@/lib/supabase/rooms';
import { logGameOver } from '@/lib/supabase/game-events';
import {
  submitQuizVote,
  getQuizVotes,
  getQuizVoteCount,
  getPlayerQuizVote,
  getQuizStartTime,
} from '@/lib/supabase/merlin-quiz';
import {
  QUIZ_TIMEOUT_SECONDS,
  canShowQuiz,
  validateQuizVote,
  isQuizComplete,
  getPlayerVoteStatus,
  isParallelQuizComplete,
  canCompleteParallelPhase,
} from '@/lib/domain/merlin-quiz';
import { getEligibleQuizPlayers } from '@/lib/domain/quiz-eligibility';
import { checkAssassinGuess } from '@/lib/domain/win-conditions';
import { broadcastQuizVoteSubmitted } from '@/lib/broadcast';
import { errors, handleError } from '@/lib/utils/errors';
import type { MerlinQuizState, MerlinQuizVoteResponse } from '@/types/game';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * POST /api/games/[gameId]/merlin-quiz
 * Submit a quiz vote for who the player thinks is Merlin
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Validate player ID from header
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Player ID required' } },
        { status: 401 }
      );
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

    // Feature 021: Support both game_over and parallel_quiz phases
    if (game.phase !== 'game_over' && game.phase !== 'parallel_quiz') {
      return NextResponse.json(
        { error: { code: 'INVALID_PHASE', message: 'Quiz is only available at game over or during parallel quiz phase' } },
        { status: 400 }
      );
    }

    // Verify player is in this game
    if (!game.seating_order.includes(player.id)) {
      return NextResponse.json(
        { error: { code: 'NOT_IN_GAME', message: 'You are not in this game' } },
        { status: 403 }
      );
    }

    // Check if Merlin exists in this game
    const { data: merlinRole } = await supabase
      .from('player_roles')
      .select('player_id')
      .eq('room_id', game.room_id)
      .eq('special_role', 'merlin')
      .single();

    if (!merlinRole) {
      return NextResponse.json(
        { error: { code: 'NO_MERLIN', message: 'This game does not have a Merlin role' } },
        { status: 404 }
      );
    }

    // Check if player already voted
    const existingVote = await getPlayerQuizVote(supabase, gameId, player.id);
    if (existingVote) {
      return NextResponse.json(
        { error: { code: 'ALREADY_VOTED', message: 'You have already submitted your guess' } },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const suspectedPlayerId = body.suspected_player_id ?? null;

    // Validate vote
    const validation = validateQuizVote(player.id, suspectedPlayerId, game.seating_order);
    if (!validation.valid) {
      const errorMessages: Record<string, string> = {
        CANNOT_VOTE_SELF: 'You cannot vote for yourself',
        INVALID_PLAYER: 'Selected player is not in this game',
        VOTER_NOT_IN_GAME: 'You are not in this game',
      };
      return NextResponse.json(
        { error: { code: validation.error, message: errorMessages[validation.error!] || 'Invalid vote' } },
        { status: 400 }
      );
    }

    // Submit vote
    await submitQuizVote(supabase, {
      game_id: gameId,
      voter_player_id: player.id,
      suspected_player_id: suspectedPlayerId,
    });

    // Get updated vote count and check completion
    const [voteCount, quizStartTime] = await Promise.all([
      getQuizVoteCount(supabase, gameId),
      getQuizStartTime(supabase, gameId),
    ]);

    // Get connected players count
    const { data: roomPlayers } = await supabase
      .from('room_players')
      .select('player_id, players!inner(last_activity_at)')
      .eq('room_id', game.room_id);

    const connectedCount = (roomPlayers || []).filter(rp => {
      const lastActivity = (rp.players as { last_activity_at?: string })?.last_activity_at;
      if (!lastActivity) return true;
      const timeSince = Date.now() - new Date(lastActivity).getTime();
      return timeSince < 60000; // 60 seconds threshold
    }).length;

    const quizComplete = isQuizComplete(voteCount, connectedCount, quizStartTime);

    // Feature 021: Broadcast quiz vote submission during parallel phase
    if (game.phase === 'parallel_quiz') {
      await broadcastQuizVoteSubmitted(gameId, voteCount, connectedCount);
    }

    // Feature 021: Handle parallel phase completion
    if (game.phase === 'parallel_quiz' && quizComplete) {
      // Get roles to determine outcome and check for Assassin
      const { data: playerRoles } = await supabase
        .from('player_roles')
        .select('player_id, role, special_role')
        .eq('room_id', game.room_id);

      const hasAssassin = playerRoles?.some(r => r.special_role === 'assassin') ?? false;
      const assassinSubmitted = game.assassin_guess_id !== null;

      // Determine outcome based on quest results
      const goodWins = game.quest_results.filter(r => r.result === 'success').length;
      const outcome: 'good_win' | 'evil_win' = goodWins >= 3 ? 'good_win' : 'evil_win';

      // Check if we can complete the parallel phase
      const canComplete = canCompleteParallelPhase(outcome, hasAssassin, assassinSubmitted, true);

      if (canComplete) {
        // Determine final winner
        let winner = game.winner;
        let winReason = game.win_reason;

        // For Good wins, check if Assassin found Merlin
        if (outcome === 'good_win' && hasAssassin && game.assassin_guess_id) {
          const merlin = playerRoles?.find(r => r.special_role === 'merlin');
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
        });

        // Close room
        await updateRoomStatus(supabase, game.room_id, 'closed');

        // Log game over
        if (winner && winReason) {
          const assassinFoundMerlin = outcome === 'good_win' && winner === 'evil';
          await logGameOver(supabase, gameId, winner, winReason, assassinFoundMerlin);
        }
      }
    }

    const response: MerlinQuizVoteResponse = {
      success: true,
      votes_submitted: voteCount,
      total_players: game.player_count,
      quiz_complete: quizComplete,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/games/[gameId]/merlin-quiz
 * Get current quiz state
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { gameId } = await params;

    // Validate player ID from header
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Player ID required' } },
        { status: 401 }
      );
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

    // Check if Merlin exists in this game
    const { data: merlinRole } = await supabase
      .from('player_roles')
      .select('player_id')
      .eq('room_id', game.room_id)
      .eq('special_role', 'merlin')
      .single();

    const hasMerlin = !!merlinRole;
    // Feature 021: Support both game_over and parallel_quiz phases
    const quizEnabled = canShowQuiz(hasMerlin) && (game.phase === 'game_over' || game.phase === 'parallel_quiz');

    if (!quizEnabled) {
      const state: MerlinQuizState = {
        quiz_enabled: false,
        quiz_active: false,
        quiz_complete: false,
        my_vote: null,
        has_voted: false,
        has_skipped: false,
        votes_submitted: 0,
        total_players: game.player_count,
        connected_players: game.player_count,
        quiz_started_at: null,
        timeout_seconds: QUIZ_TIMEOUT_SECONDS,
      };
      return NextResponse.json({ data: state });
    }

    // Get votes and check state
    const [votes, quizStartTime] = await Promise.all([
      getQuizVotes(supabase, gameId),
      getQuizStartTime(supabase, gameId),
    ]);

    // Get connected players count
    const { data: roomPlayers } = await supabase
      .from('room_players')
      .select('player_id, players!inner(last_activity_at)')
      .eq('room_id', game.room_id);

    const connectedCount = (roomPlayers || []).filter(rp => {
      const lastActivity = (rp.players as { last_activity_at?: string })?.last_activity_at;
      if (!lastActivity) return true;
      const timeSince = Date.now() - new Date(lastActivity).getTime();
      return timeSince < 60000; // 60 seconds threshold
    }).length;

    // Check player's vote status
    const voteStatus = getPlayerVoteStatus(votes, player.id);

    // Determine quiz completion
    const quizComplete = isQuizComplete(votes.length, connectedCount, quizStartTime);
    const quizActive = quizEnabled && !quizComplete;

    const state: MerlinQuizState = {
      quiz_enabled: true,
      quiz_active: quizActive,
      quiz_complete: quizComplete,
      my_vote: voteStatus.hasSkipped ? 'skipped' : voteStatus.votedFor,
      has_voted: voteStatus.hasVoted,
      has_skipped: voteStatus.hasSkipped,
      votes_submitted: votes.length,
      total_players: game.player_count,
      connected_players: connectedCount,
      quiz_started_at: quizStartTime,
      timeout_seconds: QUIZ_TIMEOUT_SECONDS,
    };

    return NextResponse.json({ data: state });
  } catch (error) {
    return handleError(error);
  }
}
