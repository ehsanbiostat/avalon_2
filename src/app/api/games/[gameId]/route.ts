/**
 * API Route: GET /api/games/[gameId]
 * Get full game state
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { getGameById } from '@/lib/supabase/games';
import { getCurrentProposal } from '@/lib/supabase/proposals';
import { getPlayerVote, getVotedPlayerIds } from '@/lib/supabase/votes';
import { getActionCount, hasPlayerSubmittedAction, getSubmittedPlayerIds } from '@/lib/supabase/quest-actions';
import { getQuestRequirementsMap } from '@/lib/domain/quest-config';
import { errors, handleError } from '@/lib/utils/errors';
import type { GameState, GamePlayer } from '@/types/game';

interface RouteParams {
  params: Promise<{ gameId: string }>;
}

/**
 * GET /api/games/[gameId]
 * Get full game state for client
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    // Get current proposal if any
    const currentProposal = await getCurrentProposal(supabase, gameId);

    // Get player nicknames for seating display
    const { data: playersData } = await supabase
      .from('players')
      .select('id, nickname')
      .in('id', game.seating_order);

    const nicknameMap = new Map(
      (playersData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
    );

    // Get voted player IDs if in voting phase
    let votedPlayerIds: string[] = [];
    if (game.phase === 'voting' && currentProposal) {
      votedPlayerIds = await getVotedPlayerIds(supabase, currentProposal.id);
    }

    // Get player's vote on current proposal
    let myVote = null;
    if (currentProposal) {
      const vote = await getPlayerVote(supabase, currentProposal.id, player.id);
      myVote = vote?.vote || null;
    }

    // Check if player is on quest team
    const amTeamMember = currentProposal?.team_member_ids.includes(player.id) || false;

    // Get action submission state if in quest phase
    let canSubmitAction = false;
    let hasSubmittedAction = false;
    let actionsSubmitted = 0;
    let totalTeamMembers = 0;

    if (game.phase === 'quest' && currentProposal) {
      totalTeamMembers = currentProposal.team_member_ids.length;
      actionsSubmitted = await getActionCount(supabase, gameId, game.current_quest);
      
      if (amTeamMember) {
        hasSubmittedAction = await hasPlayerSubmittedAction(
          supabase,
          gameId,
          game.current_quest,
          player.id
        );
        canSubmitAction = !hasSubmittedAction;
      }
    }

    // Build game players list
    const players: GamePlayer[] = game.seating_order.map((pid, index) => ({
      id: pid,
      nickname: nicknameMap.get(pid) || 'Unknown',
      seat_position: index,
      is_leader: pid === game.current_leader_id,
      is_on_team: currentProposal?.team_member_ids.includes(pid) || false,
      has_voted: votedPlayerIds.includes(pid),
      is_connected: true, // TODO: Track connection status
    }));

    // Get quest requirement for current quest
    const questRequirements = getQuestRequirementsMap(game.player_count);
    const questRequirement = questRequirements[game.current_quest];

    const gameState: GameState = {
      game,
      players,
      current_proposal: currentProposal,
      quest_requirement: questRequirement,
      my_vote: myVote,
      am_team_member: amTeamMember,
      can_submit_action: canSubmitAction,
      has_submitted_action: hasSubmittedAction,
      votes_submitted: votedPlayerIds.length,
      total_players: game.player_count,
      actions_submitted: actionsSubmitted,
      total_team_members: totalTeamMembers,
    };

    // Include current player's database ID for proper identification
    return NextResponse.json({ 
      data: gameState,
      current_player_id: player.id,
    });
  } catch (error) {
    return handleError(error);
  }
}

