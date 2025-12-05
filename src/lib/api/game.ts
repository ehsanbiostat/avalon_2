/**
 * Game API client functions
 */

import { getPlayerId } from '@/lib/utils/player-id';
import type {
  ProposeTeamRequest,
  ProposeTeamResponse,
  VoteRequest,
  VoteResponse,
  QuestActionRequest,
  QuestActionResponse,
  ContinueGameResponse,
  VoteChoice,
  QuestActionType,
  UpdateDraftTeamRequest,
  UpdateDraftTeamResponse,
} from '@/types/game';

/**
 * Propose a team for the current quest (leader only)
 */
export async function proposeTeam(
  gameId: string,
  teamMemberIds: string[]
): Promise<ProposeTeamResponse> {
  const playerId = getPlayerId();
  const headers = {
    'X-Player-ID': playerId,
    'Content-Type': 'application/json',
  };

  const body: ProposeTeamRequest = {
    team_member_ids: teamMemberIds,
  };

  const response = await fetch(`/api/games/${gameId}/propose`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to propose team');
  }

  const { data } = await response.json();
  return data;
}

/**
 * Submit vote on current proposal
 */
export async function submitVote(
  gameId: string,
  vote: VoteChoice
): Promise<VoteResponse> {
  const playerId = getPlayerId();
  const headers = {
    'X-Player-ID': playerId,
    'Content-Type': 'application/json',
  };

  const body: VoteRequest = { vote };

  const response = await fetch(`/api/games/${gameId}/vote`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to submit vote');
  }

  const { data } = await response.json();
  return data;
}

/**
 * Submit quest action (team members only)
 */
export async function submitQuestAction(
  gameId: string,
  action: QuestActionType
): Promise<QuestActionResponse> {
  const playerId = getPlayerId();
  const headers = {
    'X-Player-ID': playerId,
    'Content-Type': 'application/json',
  };

  const body: QuestActionRequest = { action };

  const response = await fetch(`/api/games/${gameId}/quest/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to submit action');
  }

  const { data } = await response.json();
  return data;
}

/**
 * Continue to next quest (after viewing results)
 */
export async function continueGame(gameId: string): Promise<ContinueGameResponse> {
  const playerId = getPlayerId();
  const headers = {
    'X-Player-ID': playerId,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`/api/games/${gameId}/continue`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to continue game');
  }

  const { data } = await response.json();
  return data;
}

/**
 * Get game for room (convenience function)
 */
export async function getGameForRoom(
  roomCode: string
): Promise<{ has_game: boolean; game_id: string | null; phase: string | null }> {
  const playerId = getPlayerId();
  const headers = { 'X-Player-ID': playerId };

  const response = await fetch(`/api/rooms/${roomCode}/game`, { headers });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Failed to get game');
  }

  const { data } = await response.json();
  return data;
}

// ============================================
// FEATURE 007: DRAFT TEAM SELECTION
// ============================================

/**
 * Update the leader's draft team selection
 * Feature 007: Real-Time Team Selection Visibility
 * 
 * @param gameId - Game identifier
 * @param teamMemberIds - Array of player database IDs (0 to quest_size)
 * @returns Promise<UpdateDraftTeamResponse>
 * @throws Error if not leader, invalid phase, or validation fails
 */
export async function updateDraftTeam(
  gameId: string,
  teamMemberIds: string[]
): Promise<UpdateDraftTeamResponse> {
  const playerId = getPlayerId();
  const headers = {
    'X-Player-ID': playerId,
    'Content-Type': 'application/json',
  };

  const body: UpdateDraftTeamRequest = {
    team_member_ids: teamMemberIds,
  };

  const response = await fetch(`/api/games/${gameId}/draft-team`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    const errorCode = data.error?.code;
    const errorMessage = data.error?.message;

    // Feature 007: Handle new error codes
    if (errorCode === 'NOT_LEADER') {
      throw new Error('Only the current leader can update team selection');
    }
    if (errorCode === 'INVALID_PHASE') {
      throw new Error('Cannot update draft team in current phase');
    }
    if (errorCode === 'INVALID_TEAM_SIZE' || errorCode === 'INVALID_PLAYER_ID') {
      throw new Error(errorMessage || 'Invalid team selection');
    }

    throw new Error(errorMessage || 'Failed to update draft team');
  }

  return response.json();
}

