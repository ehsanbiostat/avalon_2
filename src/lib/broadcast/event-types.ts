/**
 * Broadcast Event Types and Helpers
 * Feature 016: Real-Time Broadcast Updates
 *
 * Constants and utility functions for broadcast event handling.
 */

import type {
  BroadcastEventType,
  BroadcastMessage,
  DraftUpdatePayload,
  VoteSubmittedPayload,
  ActionSubmittedPayload,
  PhaseTransitionPayload,
  GameOverPayload,
  QuizVoteSubmittedPayload,
} from '@/types/broadcast';

// ============================================
// EVENT TYPE CONSTANTS
// ============================================

/**
 * All broadcast event types as a constant array
 * Useful for iteration and validation
 */
export const BROADCAST_EVENT_TYPES: readonly BroadcastEventType[] = [
  'draft_update',
  'vote_submitted',
  'action_submitted',
  'phase_transition',
  'game_over',
  'quiz_vote_submitted', // Feature 021
] as const;

/**
 * Event type descriptions for logging
 */
export const EVENT_DESCRIPTIONS: Record<BroadcastEventType, string> = {
  draft_update: 'Draft team selection changed',
  vote_submitted: 'Player submitted vote',
  action_submitted: 'Quest action submitted',
  phase_transition: 'Game phase changed',
  game_over: 'Game ended',
  quiz_vote_submitted: 'Quiz vote submitted', // Feature 021
};

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Check if a string is a valid broadcast event type
 */
export function isBroadcastEventType(type: string): type is BroadcastEventType {
  return BROADCAST_EVENT_TYPES.includes(type as BroadcastEventType);
}

/**
 * Type guard for draft_update payload
 */
export function isDraftUpdatePayload(
  payload: unknown
): payload is DraftUpdatePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'draft_team' in payload &&
    Array.isArray((payload as DraftUpdatePayload).draft_team)
  );
}

/**
 * Type guard for vote_submitted payload
 */
export function isVoteSubmittedPayload(
  payload: unknown
): payload is VoteSubmittedPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'player_id' in payload &&
    'votes_count' in payload &&
    'total_players' in payload
  );
}

/**
 * Type guard for action_submitted payload
 */
export function isActionSubmittedPayload(
  payload: unknown
): payload is ActionSubmittedPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'actions_count' in payload &&
    'total_team_members' in payload
  );
}

/**
 * Type guard for phase_transition payload
 */
export function isPhaseTransitionPayload(
  payload: unknown
): payload is PhaseTransitionPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'phase' in payload &&
    'previous_phase' in payload &&
    'trigger' in payload &&
    'quest_number' in payload
  );
}

/**
 * Type guard for game_over payload
 */
export function isGameOverPayload(
  payload: unknown
): payload is GameOverPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'winner' in payload &&
    'reason' in payload
  );
}

/**
 * Feature 021: Type guard for quiz_vote_submitted payload
 */
export function isQuizVoteSubmittedPayload(
  payload: unknown
): payload is QuizVoteSubmittedPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'votes_count' in payload &&
    'total_eligible' in payload
  );
}

// ============================================
// PAYLOAD VALIDATORS
// ============================================

/**
 * Validate a broadcast message has correct structure
 */
export function validateBroadcastMessage(
  message: unknown
): BroadcastMessage | null {
  if (typeof message !== 'object' || message === null) {
    return null;
  }

  const msg = message as { event?: unknown; payload?: unknown };

  if (typeof msg.event !== 'string' || !isBroadcastEventType(msg.event)) {
    return null;
  }

  const event = msg.event as BroadcastEventType;
  const payload = msg.payload;

  switch (event) {
    case 'draft_update':
      if (isDraftUpdatePayload(payload)) {
        return { event, payload };
      }
      break;
    case 'vote_submitted':
      if (isVoteSubmittedPayload(payload)) {
        return { event, payload };
      }
      break;
    case 'action_submitted':
      if (isActionSubmittedPayload(payload)) {
        return { event, payload };
      }
      break;
    case 'phase_transition':
      if (isPhaseTransitionPayload(payload)) {
        return { event, payload };
      }
      break;
    case 'game_over':
      if (isGameOverPayload(payload)) {
        return { event, payload };
      }
      break;
    case 'quiz_vote_submitted':
      if (isQuizVoteSubmittedPayload(payload)) {
        return { event, payload };
      }
      break;
  }

  return null;
}

// ============================================
// LOGGING HELPERS
// ============================================

/**
 * Format a broadcast event for logging
 */
export function formatEventForLog(
  event: BroadcastEventType,
  gameId: string
): string {
  return `[Broadcast] ${EVENT_DESCRIPTIONS[event]} (game:${gameId})`;
}

/**
 * Format connection status for logging
 */
export function formatConnectionLog(
  status: string,
  gameId: string,
  error?: Error
): string {
  const base = `[Broadcast] Connection ${status} for game:${gameId}`;
  return error ? `${base} - Error: ${error.message}` : base;
}
