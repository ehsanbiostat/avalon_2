# Data Model: Real-Time Broadcast Updates

**Feature**: 016-realtime-broadcast
**Date**: 2025-12-25

## Overview

This feature introduces ephemeral broadcast channels and event types. **No new database tables are required** - all broadcast state is in-memory and transient.

## Key Entities

### 1. BroadcastChannel

An ephemeral Supabase Realtime channel for a specific game.

**Not persisted** - exists only in memory while game is active.

| Field | Type | Description |
|-------|------|-------------|
| gameId | string | UUID of the game |
| channelName | string | `game:${gameId}` |
| createdAt | Date | When channel was created |
| lastActivity | Date | Last broadcast sent |
| timeoutId | NodeJS.Timeout | 2-hour inactivity timeout |

**Lifecycle**:
- Created: When game phase transitions to `team_building`
- Active: While game is in progress
- Destroyed: When game phase is `game_over` OR after 2 hours of inactivity

---

### 2. BroadcastEvent

A typed message sent through a broadcast channel.

**Not persisted** - ephemeral message.

| Field | Type | Description |
|-------|------|-------------|
| type | `'broadcast'` | Supabase event type (constant) |
| event | BroadcastEventType | Event name (see enum below) |
| payload | EventPayload | Event-specific data |

---

### 3. BroadcastEventType (Enum)

```typescript
type BroadcastEventType =
  | 'draft_update'       // Leader's team selection changed
  | 'vote_submitted'     // A player submitted their vote
  | 'action_submitted'   // A team member submitted quest action
  | 'phase_transition'   // Game phase changed
  | 'game_over';         // Game ended
```

---

### 4. Event Payloads

#### DraftUpdatePayload

Sent when leader selects/deselects players for the team.

| Field | Type | Description |
|-------|------|-------------|
| draft_team | string[] | Array of selected player IDs (0 to quest_size) |

**Validation**:
- `draft_team` length ≤ quest requirement size
- All IDs must be valid player IDs in the game

---

#### VoteSubmittedPayload

Sent when a player submits their vote (without revealing the vote).

| Field | Type | Description |
|-------|------|-------------|
| player_id | string | ID of player who voted |
| votes_count | number | Total votes submitted so far |
| total_players | number | Total players in game |

**Validation**:
- `votes_count` ≤ `total_players`
- `player_id` must be valid player in game

**Security**: Does NOT include vote value (approve/reject)

---

#### ActionSubmittedPayload

Sent when a team member submits their quest action.

| Field | Type | Description |
|-------|------|-------------|
| actions_count | number | Total actions submitted so far |
| total_team_members | number | Team size for current quest |

**Validation**:
- `actions_count` ≤ `total_team_members`

**Security**: Does NOT include action type (success/fail)

---

#### PhaseTransitionPayload

Sent when game phase changes.

| Field | Type | Description |
|-------|------|-------------|
| phase | GamePhase | New game phase |
| previous_phase | GamePhase | Previous phase |
| trigger | string | What caused the transition |
| quest_number | number | Current quest number |

**Trigger values**:
- `'proposal_approved'` - Team was approved, moving to quest
- `'proposal_rejected'` - Team was rejected, rotating leader
- `'quest_complete'` - Quest finished, showing result
- `'quest_result_shown'` - Result displayed, continuing game
- `'lady_complete'` - Lady investigation done
- `'assassin_phase'` - Good won 3 quests, assassin's turn
- `'game_ended'` - Game is over

---

#### GameOverPayload

Sent when game ends.

| Field | Type | Description |
|-------|------|-------------|
| winner | 'good' \| 'evil' | Winning team |
| reason | WinReason | Why the game ended |

**WinReason values**:
- `'3_quest_successes'`
- `'3_quest_failures'`
- `'5_rejections'`
- `'assassin_found_merlin'`

---

## TypeScript Type Definitions

```typescript
// src/types/broadcast.ts

import type { GamePhase, WinReason } from './game';

// Event type enum
export type BroadcastEventType =
  | 'draft_update'
  | 'vote_submitted'
  | 'action_submitted'
  | 'phase_transition'
  | 'game_over';

// Payload types
export interface DraftUpdatePayload {
  draft_team: string[];
}

export interface VoteSubmittedPayload {
  player_id: string;
  votes_count: number;
  total_players: number;
}

export interface ActionSubmittedPayload {
  actions_count: number;
  total_team_members: number;
}

export interface PhaseTransitionPayload {
  phase: GamePhase;
  previous_phase: GamePhase;
  trigger: string;
  quest_number: number;
}

export interface GameOverPayload {
  winner: 'good' | 'evil';
  reason: WinReason;
}

// Union type for all payloads
export type BroadcastPayload =
  | DraftUpdatePayload
  | VoteSubmittedPayload
  | ActionSubmittedPayload
  | PhaseTransitionPayload
  | GameOverPayload;

// Discriminated union for type-safe event handling
export type BroadcastMessage =
  | { event: 'draft_update'; payload: DraftUpdatePayload }
  | { event: 'vote_submitted'; payload: VoteSubmittedPayload }
  | { event: 'action_submitted'; payload: ActionSubmittedPayload }
  | { event: 'phase_transition'; payload: PhaseTransitionPayload }
  | { event: 'game_over'; payload: GameOverPayload };

// Channel manager types
export interface ActiveChannel {
  gameId: string;
  channelName: string;
  createdAt: Date;
  lastActivity: Date;
  timeoutId: ReturnType<typeof setTimeout>;
}

// Debounce tracking
export interface DebounceState {
  lastBroadcast: Map<string, number>; // eventKey -> timestamp
  pendingBroadcast: Map<string, NodeJS.Timeout>; // eventKey -> timeout
}
```

---

## State Transitions

### Channel State

```
[No Channel] ---(game starts)---> [Active]
                                     |
                                     +---(game_over)---> [Destroyed]
                                     |
                                     +---(2hr timeout)---> [Destroyed]
```

### Event Flow

```
[Server Action] ---> [DB Update] ---> [Broadcast] ---> [Client Receives]
                          |                                    |
                          v                                    v
                    [Source of Truth]               [Optimistic Update]
                                                           |
                                                           v
                                               [Poll confirms state]
```

---

## Relationships

```
Game (1) -------- (0..1) BroadcastChannel
  |                         |
  |                         +---- (many) BroadcastEvents
  |
  +---- (many) Players <---subscribe---> BroadcastChannel
  |
  +---- (many) Watchers <---subscribe---> BroadcastChannel
```

---

## Indexing / Performance

No database indexes needed - broadcast is entirely in-memory.

**Memory Considerations**:
- One `ActiveChannel` entry per active game
- Each entry ~100 bytes
- With 100 concurrent games: ~10KB memory
- Negligible overhead

---

## Migration Notes

**No database migration required** - this feature uses only Supabase Realtime infrastructure and in-memory state.
