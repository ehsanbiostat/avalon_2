/**
 * Game types for Phase 3: Quest System
 * Defines types for game state, proposals, votes, and quest actions
 */

// ============================================
// ENUM TYPES
// ============================================

export type GamePhase =
  | 'team_building'   // Leader selecting team
  | 'voting'          // All players voting on team
  | 'quest'           // Team executing quest
  | 'quest_result'    // Showing quest result
  | 'lady_of_lake'    // Lady of the Lake investigation (after Quest 2, 3, 4)
  | 'assassin'        // Assassin guessing Merlin (Good won 3 quests)
  | 'game_over';      // Game ended

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export type VoteChoice = 'approve' | 'reject';

export type QuestActionType = 'success' | 'fail';

export type GameWinner = 'good' | 'evil';

// ============================================
// DATABASE ROW TYPES
// ============================================

export interface Game {
  id: string;
  room_id: string;
  player_count: number;
  phase: GamePhase;
  current_quest: number;
  current_leader_id: string;
  vote_track: number;
  quest_results: QuestResult[];
  seating_order: string[];
  leader_index: number;
  winner: GameWinner | null;
  win_reason: string | null;
  assassin_guess_id: string | null;
  lady_holder_id: string | null;
  lady_enabled: boolean;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface GameInsert {
  id?: string;
  room_id: string;
  player_count: number;
  phase?: GamePhase;
  current_quest?: number;
  current_leader_id: string;
  vote_track?: number;
  quest_results?: QuestResult[];
  seating_order: string[];
  leader_index?: number;
  winner?: GameWinner | null;
  win_reason?: string | null;
  lady_holder_id?: string | null;
  lady_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  ended_at?: string | null;
}

export interface GameUpdate {
  phase?: GamePhase;
  current_quest?: number;
  current_leader_id?: string;
  vote_track?: number;
  quest_results?: QuestResult[];
  leader_index?: number;
  winner?: GameWinner | null;
  win_reason?: string | null;
  assassin_guess_id?: string | null;
  lady_holder_id?: string | null;
  lady_enabled?: boolean;
  ended_at?: string | null;
}

export interface TeamProposal {
  id: string;
  game_id: string;
  quest_number: number;
  proposal_number: number;
  leader_id: string;
  team_member_ids: string[];
  status: ProposalStatus;
  approve_count: number;
  reject_count: number;
  created_at: string;
  resolved_at: string | null;
}

export interface TeamProposalInsert {
  id?: string;
  game_id: string;
  quest_number: number;
  proposal_number: number;
  leader_id: string;
  team_member_ids: string[];
  status?: ProposalStatus;
  approve_count?: number;
  reject_count?: number;
  created_at?: string;
  resolved_at?: string | null;
}

export interface Vote {
  id: string;
  proposal_id: string;
  player_id: string;
  vote: VoteChoice;
  created_at: string;
}

export interface VoteInsert {
  id?: string;
  proposal_id: string;
  player_id: string;
  vote: VoteChoice;
  created_at?: string;
}

export interface QuestAction {
  id: string;
  game_id: string;
  quest_number: number;
  player_id: string;
  action: QuestActionType;
  created_at: string;
}

export interface QuestActionInsert {
  id?: string;
  game_id: string;
  quest_number: number;
  player_id: string;
  action: QuestActionType;
  created_at?: string;
}

export interface GameEvent {
  id: string;
  game_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface GameEventInsert {
  id?: string;
  game_id: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  created_at?: string;
}

// ============================================
// QUEST CONFIGURATION
// ============================================

export interface QuestRequirement {
  size: number;      // Team size required
  fails: number;     // Fails needed for quest to fail (usually 1, sometimes 2)
}

export interface QuestResult {
  quest: number;           // 1-5
  result: 'success' | 'fail';
  success_count: number;   // Cards played
  fail_count: number;      // Cards played
  team_member_ids: string[];
  completed_at: string;    // ISO timestamp
}

// ============================================
// CLIENT STATE TYPES
// ============================================

/**
 * Full game state for client rendering
 */
export interface GameState {
  game: Game;
  players: GamePlayer[];
  current_proposal: TeamProposal | null;
  quest_requirement: QuestRequirement;
  // Player-specific state
  my_vote: VoteChoice | null;
  am_team_member: boolean;
  can_submit_action: boolean;
  has_submitted_action: boolean;
  // Aggregate state
  votes_submitted: number;
  total_players: number;
  actions_submitted: number;
  total_team_members: number;
  // Last vote result (for reveal animation)
  last_vote_result: LastVoteResult | null;
  // Assassin phase (when Good wins 3 quests)
  assassin_phase: AssassinPhaseState | null;
  is_assassin: boolean;
  // Lady of the Lake phase
  lady_of_lake: LadyOfLakeState | null;
}

/**
 * Last vote result for reveal animation
 */
export interface LastVoteResult {
  proposal_id: string;
  is_approved: boolean;
  approve_count: number;
  reject_count: number;
  votes: VoteInfo[];
}

/**
 * Player info for game display
 */
export interface GamePlayer {
  id: string;
  nickname: string;
  seat_position: number;    // Index in seating order (0-based)
  is_leader: boolean;
  is_on_team: boolean;      // On current proposal's team
  has_voted: boolean;       // Has voted on current proposal
  is_connected: boolean;
  // Only populated during game_over phase
  revealed_role?: 'good' | 'evil';
  revealed_special_role?: string;
}

/**
 * Assassin phase state
 */
export interface AssassinPhaseState {
  assassin_id: string;
  assassin_nickname: string;
  merlin_id: string; // Only known to server
  can_guess: boolean; // True if current player is assassin
}

/**
 * Lady of the Lake state
 */
export interface LadyOfLakeState {
  enabled: boolean;
  holder_id: string | null;
  holder_nickname: string | null;
  investigated_player_ids: string[];
  previous_lady_holder_ids: string[]; // Previous holders cannot be investigated
  is_holder: boolean;           // Current player is Lady holder
  can_investigate: boolean;     // In lady_of_lake phase and is holder
  last_investigation: {         // For public announcement
    investigator_nickname: string;
    target_nickname: string;
  } | null;
}

/**
 * Lady investigation record
 */
export interface LadyInvestigation {
  id: string;
  game_id: string;
  quest_number: number;
  investigator_id: string;
  target_id: string;
  result: 'good' | 'evil';
  created_at: string;
}

/**
 * Lady investigation API request
 */
export interface LadyInvestigateRequest {
  target_player_id: string;
}

/**
 * Lady investigation API response
 */
export interface LadyInvestigateResponse {
  success: boolean;
  result: 'good' | 'evil';      // Only for Lady holder
  new_holder_id: string;
  new_holder_nickname: string;
  next_quest?: number;          // The next quest number after Lady phase
}

/**
 * Vote info (after reveal)
 */
export interface VoteInfo {
  player_id: string;
  nickname: string;
  vote: VoteChoice;
}

/**
 * Quest result display (shuffled actions)
 */
export interface QuestResultDisplay {
  quest_number: number;
  team_size: number;
  success_count: number;
  fail_count: number;
  outcome: 'success' | 'fail';
  fails_required: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ProposeTeamRequest {
  team_member_ids: string[];
}

export interface ProposeTeamResponse {
  proposal_id: string;
  quest_number: number;
  proposal_number: number;
  team_member_ids: string[];
  leader_id: string;
}

export interface VoteRequest {
  vote: VoteChoice;
}

export interface VoteResponse {
  recorded: boolean;
  votes_submitted: number;
  total_players: number;
}

export interface QuestActionRequest {
  action: QuestActionType;
}

export interface QuestActionResponse {
  recorded: boolean;
  actions_submitted: number;
  total_team_members: number;
}

export interface ContinueGameResponse {
  phase: GamePhase;
  current_quest: number;
  current_leader_id: string;
  winner?: GameWinner;
  win_reason?: string;
}

export interface GameHistoryResponse {
  events: GameEvent[];
  proposals: (TeamProposal & { votes: VoteInfo[] })[];
  quest_results: QuestResult[];
}

// ============================================
// EVENT DATA TYPES
// ============================================

export interface GameStartedEventData {
  seating_order: string[];
  first_leader_id: string;
  player_count: number;
}

export interface TeamProposedEventData {
  quest_number: number;
  proposal_number: number;
  leader_id: string;
  team_member_ids: string[];
}

export interface VotesRevealedEventData {
  proposal_id: string;
  votes: VoteInfo[];
  result: ProposalStatus;
  approve_count: number;
  reject_count: number;
}

export interface QuestCompletedEventData {
  quest_number: number;
  result: 'success' | 'fail';
  success_count: number;
  fail_count: number;
  team_size: number;
}

export interface GameEndedEventData {
  winner: GameWinner;
  win_reason: string;
  final_score: { good: number; evil: number };
  assassin_found_merlin?: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export type WinReason =
  | '3_quest_successes'      // Good won 3 quests (Assassin failed to find Merlin)
  | '3_quest_failures'       // Evil won 3 quests
  | '5_rejections'           // 5 consecutive team rejections
  | 'assassin_found_merlin'; // Assassin correctly identified Merlin

export interface GameScore {
  good: number;  // Successful quests
  evil: number;  // Failed quests
}

