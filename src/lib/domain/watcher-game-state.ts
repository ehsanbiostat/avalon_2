/**
 * Watcher Game State Builder
 * Feature 015: Build neutral observer view of game state
 *
 * CRITICAL: This module builds a SUBSET of GameState
 * - NO player roles (until game_over)
 * - NO individual vote choices (until reveal)
 * - NO individual quest actions (until reveal)
 * - NO Lady of the Lake investigation results
 * - NO player-specific fields (my_vote, am_team_member, etc.)
 *
 * Per FR-006/FR-007, watchers see only publicly visible information.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Game, TeamProposal, QuestRequirement } from '@/types/game';
import type {
  WatcherGameState,
  WatcherPlayerInfo,
  WatcherLadyState,
} from '@/types/watcher';
import { getQuestRequirementsMap } from './quest-config';
import { getConnectionStatus } from './connection-status';

/**
 * Build game state for a watcher (neutral observer view)
 * This is called from GET /api/watch/[gameId]
 *
 * @param supabase - Supabase client for database reads
 * @param game - The game record
 * @param currentProposal - Current team proposal (if any)
 * @param votedPlayerIds - IDs of players who have voted (for has_voted indicator)
 * @param lastVoteResult - Last vote result (for reveal animation)
 * @param playersData - Player records with nicknames and activity
 */
export async function buildWatcherGameState(
  supabase: SupabaseClient,
  game: Game,
  currentProposal: TeamProposal | null,
  votedPlayerIds: string[],
  lastVoteResult: WatcherGameState['last_vote_result'],
  playersData: Array<{ id: string; nickname: string; last_activity_at?: string }>
): Promise<WatcherGameState> {
  // Build nickname and activity maps
  const nicknameMap = new Map(
    playersData.map((p) => [p.id, p.nickname])
  );
  const activityMap = new Map(
    playersData.map((p) => [p.id, p.last_activity_at])
  );

  // Get quest requirement for current quest
  const questRequirements = getQuestRequirementsMap(game.player_count);
  const questRequirement: QuestRequirement = questRequirements[game.current_quest];

  // Build watcher-safe player list
  const players: WatcherPlayerInfo[] = await buildWatcherPlayerList(
    supabase,
    game,
    currentProposal,
    votedPlayerIds,
    nicknameMap,
    activityMap
  );

  // Build Lady of the Lake state (public info only)
  const ladyOfLake = await buildWatcherLadyState(supabase, game, nicknameMap);

  // Calculate aggregate vote/action counts
  const votesSubmitted = votedPlayerIds.length;
  const totalPlayers = game.player_count;

  // Get action counts if in quest phase
  let actionsSubmitted = 0;
  let totalTeamMembers = 0;

  if (game.phase === 'quest' && currentProposal) {
    totalTeamMembers = currentProposal.team_member_ids.length;

    const { count } = await supabase
      .from('quest_actions')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.id)
      .eq('quest_number', game.current_quest);

    actionsSubmitted = count ?? 0;
  }

  return {
    game,
    players,
    current_proposal: currentProposal,
    quest_requirement: questRequirement,
    votes_submitted: votesSubmitted,
    total_players: totalPlayers,
    actions_submitted: actionsSubmitted,
    total_team_members: totalTeamMembers,
    last_vote_result: lastVoteResult,
    lady_of_lake: ladyOfLake,
    draft_team: game.draft_team ?? null,
  };
}

/**
 * Build watcher-safe player list
 * Excludes role information except at game_over
 */
async function buildWatcherPlayerList(
  supabase: SupabaseClient,
  game: Game,
  currentProposal: TeamProposal | null,
  votedPlayerIds: string[],
  nicknameMap: Map<string, string>,
  activityMap: Map<string, string | undefined>
): Promise<WatcherPlayerInfo[]> {
  // Only get roles at game_over (FR-010: show same game over screen as players)
  let playerRolesMap = new Map<string, { role: string; special_role: string | null }>();

  if (game.phase === 'game_over') {
    const { data: allRoles } = await supabase
      .from('player_roles')
      .select('player_id, role, special_role')
      .eq('room_id', game.room_id);

    if (allRoles) {
      playerRolesMap = new Map(
        allRoles.map((pr: { player_id: string; role: string; special_role: string | null }) => [
          pr.player_id,
          { role: pr.role, special_role: pr.special_role },
        ])
      );
    }
  }

  return game.seating_order.map((pid, index) => {
    const lastActivity = activityMap.get(pid);
    const connectionStatus = lastActivity
      ? getConnectionStatus(lastActivity)
      : { is_connected: true, seconds_since_activity: 0 };

    const roleInfo = playerRolesMap.get(pid);

    return {
      id: pid,
      nickname: nicknameMap.get(pid) || 'Unknown',
      seat_position: index,
      is_leader: pid === game.current_leader_id,
      is_on_team: currentProposal?.team_member_ids.includes(pid) || false,
      has_voted: votedPlayerIds.includes(pid),
      is_connected: connectionStatus.is_connected,
      // Roles only at game_over (FR-010)
      revealed_role:
        game.phase === 'game_over'
          ? (roleInfo?.role as 'good' | 'evil')
          : undefined,
      revealed_special_role:
        game.phase === 'game_over' ? roleInfo?.special_role ?? undefined : undefined,
      // NOTE: was_decoy and was_mixed_group are NOT included for watchers
      // These are player-specific reveal details that watchers don't need
    };
  });
}

/**
 * Build Lady of the Lake state for watchers
 * Shows WHO was investigated but NOT the result (FR-007)
 */
async function buildWatcherLadyState(
  supabase: SupabaseClient,
  game: Game,
  nicknameMap: Map<string, string>
): Promise<WatcherLadyState | null> {
  if (!game.lady_enabled) {
    return null;
  }

  // Get last investigation (public info only - no result)
  const { data: lastInvestigation } = await supabase
    .from('lady_investigations')
    .select('investigator_id, target_id')
    .eq('game_id', game.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let lastInvestigationInfo = null;
  if (lastInvestigation) {
    lastInvestigationInfo = {
      investigator_nickname:
        nicknameMap.get(lastInvestigation.investigator_id) || 'Unknown',
      target_nickname:
        nicknameMap.get(lastInvestigation.target_id) || 'Unknown',
      // NO result field - watchers don't see this (FR-007)
    };
  }

  const holderNickname = game.lady_holder_id
    ? nicknameMap.get(game.lady_holder_id) || 'Unknown'
    : null;

  return {
    enabled: true,
    holder_nickname: holderNickname,
    last_investigation: lastInvestigationInfo,
  };
}
