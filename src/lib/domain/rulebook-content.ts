/**
 * Rulebook Content Definitions
 * Static content for the rulebook page and modal
 * Feature 014: Rulebook Page
 */

// ============================================================================
// TAB DEFINITIONS
// ============================================================================

export type RulebookTabId = 'roles' | 'modes' | 'visual' | 'flow';

export interface RulebookTab {
  id: RulebookTabId;
  label: string;
  icon: string;
}

export const RULEBOOK_TABS: RulebookTab[] = [
  { id: 'roles', label: 'Roles', icon: '🎭' },
  { id: 'modes', label: 'Game Modes', icon: '⚙️' },
  { id: 'visual', label: 'Visual Guide', icon: '👁️' },
  { id: 'flow', label: 'Game Flow', icon: '🔄' },
];

// ============================================================================
// GAME MODES
// ============================================================================

export interface GameModeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  details: string[];
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: 'lady',
    name: 'Lady of the Lake',
    emoji: '🌊',
    description: 'Investigate player loyalties after Quests 2, 3, and 4',
    details: [
      'Holder chooses a player to investigate',
      'Learns if target is Good or Evil',
      'Cannot investigate the same player twice',
      'Token passes to the investigated player',
    ],
  },
  {
    id: 'decoy',
    name: 'Decoy Mode',
    emoji: '🃏',
    description: 'One random good player appears evil to Merlin',
    details: [
      'Adds uncertainty to Merlin\'s knowledge',
      'The decoy player is unaware of their status',
      'Forces Merlin to be more cautious',
      'Revealed at end of game',
    ],
  },
  {
    id: 'split_intel',
    name: 'Split Intel Mode',
    emoji: '🔀',
    description: 'Merlin sees two groups: certain evil and mixed intel',
    details: [
      'Certain Evil group: guaranteed evil players',
      'Mixed Intel group: one evil and one good player',
      'Merlin must deduce which is which in mixed group',
      'Cannot be used with Decoy Mode',
    ],
  },
];

// ============================================================================
// VISUAL INDICATORS
// ============================================================================

export interface VisualIndicator {
  id: string;
  symbol: string;
  name: string;
  description: string;
  category: 'avatar' | 'color' | 'quest';
}

export const VISUAL_INDICATORS: VisualIndicator[] = [
  // Avatar indicators
  { id: 'crown', symbol: '👑', name: 'Crown', description: 'Current team leader', category: 'avatar' },
  { id: 'lady', symbol: '🌊', name: 'Wave', description: 'Lady of the Lake holder', category: 'avatar' },
  { id: 'voted', symbol: '✓', name: 'Checkmark', description: 'Player has voted', category: 'avatar' },
  { id: 'amber_border', symbol: '🟡', name: 'Amber Border', description: 'You (current player)', category: 'avatar' },
  { id: 'blue_fill', symbol: '🔵', name: 'Blue Fill', description: 'Selected for team', category: 'avatar' },
  { id: 'green_fill', symbol: '🟢', name: 'Green Fill', description: 'On proposed team', category: 'avatar' },
  { id: 'red_nickname', symbol: '🔴', name: 'Red Nickname', description: 'Disconnected player', category: 'avatar' },
  
  // Team colors
  { id: 'good_color', symbol: '🔷', name: 'Sky Blue', description: 'Good team', category: 'color' },
  { id: 'evil_color', symbol: '🟧', name: 'Orange', description: 'Evil team', category: 'color' },
  { id: 'gold_color', symbol: '🟨', name: 'Gold', description: 'Accents and highlights', category: 'color' },
  
  // Quest results
  { id: 'quest_success', symbol: '✓', name: 'Green Checkmark', description: 'Quest succeeded', category: 'quest' },
  { id: 'quest_fail', symbol: '✗', name: 'Red X', description: 'Quest failed', category: 'quest' },
  { id: 'two_fails', symbol: '2!', name: 'Two Fails Badge', description: 'Quest requires 2 fails', category: 'quest' },
];

// ============================================================================
// GAME PHASES
// ============================================================================

export interface GamePhaseInfo {
  id: string;
  name: string;
  description: string;
  order: number;
  details?: string[];
}

export const GAME_PHASES: GamePhaseInfo[] = [
  {
    id: 'team_building',
    name: 'Team Building',
    description: 'Leader proposes quest team',
    order: 1,
    details: [
      'Current leader selects players for the quest',
      'Team size depends on quest number and player count',
      'Leader can change selection before confirming',
    ],
  },
  {
    id: 'voting',
    name: 'Voting',
    description: 'All players approve or reject the proposal',
    order: 2,
    details: [
      'Everyone votes simultaneously',
      'Majority approval sends team on quest',
      'Rejection passes leadership to next player',
      '5 rejections in a row = Evil wins',
    ],
  },
  {
    id: 'quest',
    name: 'Quest',
    description: 'Team members secretly succeed or fail',
    order: 3,
    details: [
      'Good players must succeed',
      'Evil players can succeed or fail',
      'Votes are shuffled before reveal',
    ],
  },
  {
    id: 'quest_result',
    name: 'Quest Result',
    description: 'Reveal success or failure',
    order: 4,
    details: [
      '1 fail = quest fails (2 fails on quest 4 with 7+ players)',
      'Track shows quest history',
      'First to 3 quest wins advances',
    ],
  },
  {
    id: 'lady_of_lake',
    name: 'Lady of the Lake',
    description: 'Investigation phase (if enabled)',
    order: 5,
    details: [
      'Occurs after quests 2, 3, and 4',
      'Holder investigates one player',
      'Learns their true loyalty',
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin Phase',
    description: 'If Good wins 3 quests, Assassin guesses Merlin',
    order: 6,
    details: [
      'Evil team discusses who Merlin might be',
      'Assassin makes final selection',
      'Correct guess = Evil wins despite quest losses',
    ],
  },
];

// ============================================================================
// WIN CONDITIONS
// ============================================================================

export interface WinCondition {
  team: 'good' | 'evil';
  description: string;
}

export const WIN_CONDITIONS: WinCondition[] = [
  { team: 'good', description: '3 successful quests AND Merlin survives assassination' },
  { team: 'evil', description: '3 failed quests' },
  { team: 'evil', description: '5 rejected team proposals in a row' },
  { team: 'evil', description: 'Assassin correctly identifies Merlin' },
];

