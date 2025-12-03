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

