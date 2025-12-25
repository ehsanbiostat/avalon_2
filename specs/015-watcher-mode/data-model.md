# Data Model: Watcher Mode

**Feature**: 015-watcher-mode
**Date**: 2024-12-25

## Overview

This feature uses **ephemeral in-memory storage only**. No database schema changes are required. This is a deliberate design decision to satisfy NFR-004 (no foreign keys to game tables) and NFR-006 (watcher state must be ephemeral).

## In-Memory Data Structures

### WatcherInfo

```typescript
/**
 * Information about a single watcher
 * Stored in memory only - NOT persisted to database
 */
interface WatcherInfo {
  /** Watcher's display nickname (required per FR-002) */
  nickname: string;
  
  /** Player ID from existing player registration */
  playerId: string;
  
  /** Unix timestamp when watcher joined */
  joinedAt: number;
  
  /** Unix timestamp of last activity (for timeout detection) */
  lastSeen: number;
}
```

### WatcherSessionStore

```typescript
/**
 * In-memory storage for all watcher sessions
 * Key: gameId
 * Value: Set of WatcherInfo for that game
 * 
 * CRITICAL: This is NOT persisted. Server restart clears all sessions.
 * This is intentional - watchers simply rejoin after restart.
 */
const watcherSessions = new Map<string, Set<WatcherInfo>>();
```

### WatcherGameState

```typescript
/**
 * Game state as seen by a watcher
 * This is a SUBSET of GameState - excludes all player-specific fields
 */
interface WatcherGameState {
  /** Core game data (same as player view) */
  game: Game;
  
  /** Player info WITHOUT role data */
  players: WatcherPlayerInfo[];
  
  /** Current proposal (if any) */
  current_proposal: TeamProposal | null;
  
  /** Quest requirements for current quest */
  quest_requirement: QuestRequirement;
  
  /** Aggregate vote count (not individual votes until reveal) */
  votes_submitted: number;
  total_players: number;
  
  /** Quest action count (not individual actions) */
  actions_submitted: number;
  total_team_members: number;
  
  /** Vote results ONLY after reveal (same timing as players) */
  last_vote_result: LastVoteResult | null;
  
  /** Lady of the Lake state (public info only) */
  lady_of_lake: WatcherLadyState | null;
  
  /** Draft team (visible to all) */
  draft_team: string[] | null;
}

/**
 * Player info for watcher view - NO role information
 */
interface WatcherPlayerInfo {
  id: string;
  nickname: string;
  seat_position: number;
  is_leader: boolean;
  is_on_team: boolean;
  has_voted: boolean;
  is_connected: boolean;
  // NO revealed_role
  // NO revealed_special_role
  // NO was_decoy
  // NO was_mixed_group
}

/**
 * Lady of the Lake state for watchers
 * Shows WHO was investigated but NOT the result
 */
interface WatcherLadyState {
  enabled: boolean;
  holder_nickname: string | null;
  /** Public announcement of investigation (no result) */
  last_investigation: {
    investigator_nickname: string;
    target_nickname: string;
    // NO result field - watchers don't see this
  } | null;
}
```

## API Response Types

### JoinWatchResponse

```typescript
interface JoinWatchResponse {
  success: boolean;
  gameId: string;
  watcherCount: number;
  
  // Error cases
  error?: {
    code: 'GAME_NOT_STARTED' | 'WATCHER_LIMIT_REACHED' | 'GAME_NOT_FOUND' | 'NICKNAME_REQUIRED';
    message: string;
  };
}
```

### LeaveWatchResponse

```typescript
interface LeaveWatchResponse {
  success: boolean;
  watcherCount: number;
}
```

## Database Changes

**None required.**

The following entities are **NOT modified**:
- `games` table - No watcher fields added
- `rooms` table - No watcher fields added
- `players` table - No watcher fields added
- `room_players` table - No watcher membership

This is intentional per:
- NFR-004: No foreign keys into game tables
- SC-009: Game state database writes have zero watcher-related fields
- SC-010: Watcher join/leave operations complete without any game table writes

## State Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    WATCHER SESSION LIFECYCLE                     │
│                                                                  │
│  User enters room code                                           │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐     Game not started      ┌──────────────────┐ │
│  │ Check room  │─────────────────────────► │ Show error:      │ │
│  │ status      │                           │ "Game hasn't     │ │
│  └─────────────┘                           │  started yet"    │ │
│        │                                   └──────────────────┘ │
│        │ Game in progress                                       │
│        ▼                                                         │
│  ┌─────────────┐     Limit reached (10)    ┌──────────────────┐ │
│  │ Check       │─────────────────────────► │ Show error:      │ │
│  │ watcher     │                           │ "Max spectators" │ │
│  │ count       │                           └──────────────────┘ │
│  └─────────────┘                                                │
│        │                                                         │
│        │ Under limit                                             │
│        ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Add to      │◄────────────────────────────────────┐          │
│  │ in-memory   │                                     │          │
│  │ sessions    │     Rejoin (same nickname)          │          │
│  └─────────────┘                                     │          │
│        │                                             │          │
│        ▼                                             │          │
│  ┌─────────────┐                                     │          │
│  │ Poll game   │                                     │          │
│  │ state       │◄───────────────┐                    │          │
│  │ (3 sec)     │                │                    │          │
│  └─────────────┘                │                    │          │
│        │                        │                    │          │
│        ├────────────────────────┘                    │          │
│        │ Continue watching                           │          │
│        │                                             │          │
│        ├─────────────────────┐                       │          │
│        │                     │ Click "Stop"          │          │
│        │                     ▼                       │          │
│        │               ┌─────────────┐               │          │
│        │               │ Remove from │               │          │
│        │               │ sessions    │               │          │
│        │               └─────────────┘               │          │
│        │                     │                       │          │
│        │                     ▼                       │          │
│        │               ┌─────────────┐               │          │
│        │               │ Redirect to │               │          │
│        │               │ home page   │               │          │
│        │               └─────────────┘               │          │
│        │                                             │          │
│        ├─────────────────────────────────────────────┘          │
│        │ Browser closed / timeout (30s no activity)             │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Lazy cleanup│  (on next watcher count check)                 │
│  │ removes     │                                                │
│  │ stale entry │                                                │
│  └─────────────┘                                                │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Game ends   │                                                │
│  └─────────────┘                                                │
│        │                                                         │
│        ▼                                                         │
│  ┌─────────────┐                                                │
│  │ Show game   │                                                │
│  │ over screen │                                                │
│  │ with roles  │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Constants

```typescript
/** Maximum watchers per game (FR-004) */
const MAX_WATCHERS_PER_GAME = 10;

/** Timeout for stale watcher cleanup (seconds) */
const WATCHER_TIMEOUT_SECONDS = 30;

/** Polling interval matches players */
const WATCHER_POLL_INTERVAL_MS = 3000;
```

