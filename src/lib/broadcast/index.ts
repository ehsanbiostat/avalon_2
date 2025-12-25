/**
 * Broadcast Module Exports
 * Feature 016: Real-Time Broadcast Updates
 *
 * Central export point for all broadcast functionality.
 */

// ============================================
// BROADCASTER (Server-side)
// ============================================
export {
  broadcastEvent,
  broadcastDraftUpdate,
  broadcastVoteSubmitted,
  broadcastActionSubmitted,
  broadcastPhaseTransition,
  broadcastGameOver,
} from './broadcaster';

// ============================================
// CHANNEL MANAGER
// ============================================
export {
  markGameActive,
  markGameEnded,
  updateGameActivity,
  isGameActive,
  getGameChannelName,
  cleanupInactiveGames,
  getChannelStats,
  clearAllGames,
} from './channel-manager';

// ============================================
// DEBOUNCE
// ============================================
export {
  debouncedBroadcast,
  cancelPendingBroadcasts,
  clearAllDebounceState,
  getPendingBroadcastCount,
  hasPendingBroadcasts,
} from './debounce';

// ============================================
// EVENT TYPES
// ============================================
export {
  BROADCAST_EVENT_TYPES,
  EVENT_DESCRIPTIONS,
  isBroadcastEventType,
  isDraftUpdatePayload,
  isVoteSubmittedPayload,
  isActionSubmittedPayload,
  isPhaseTransitionPayload,
  isGameOverPayload,
  validateBroadcastMessage,
  formatEventForLog,
  formatConnectionLog,
} from './event-types';
