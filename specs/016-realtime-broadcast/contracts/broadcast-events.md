# Broadcast Events Contract

**Feature**: 016-realtime-broadcast
**Date**: 2025-12-25

## Overview

This document defines the contract for Supabase Realtime Broadcast events used in Avalon Online. These events enable real-time updates between server and clients without database subscriptions.

## Channel Naming Convention

```
Channel Name: game:{gameId}

Example: game:123e4567-e89b-12d3-a456-426614174000
```

**Rules**:
- Channel names are lowercase
- Use colon (`:`) as separator
- `gameId` is the UUID from the `games` table

---

## Event Types

### 1. draft_update

**Purpose**: Notify clients when the leader's draft team selection changes.

**Trigger**: After successful `PUT /api/games/{gameId}/draft-team`

**Broadcast Message**:
```typescript
{
  type: 'broadcast',
  event: 'draft_update',
  payload: {
    draft_team: string[]  // Array of player database IDs (0 to quest_size)
  }
}
```

**Example**:
```json
{
  "type": "broadcast",
  "event": "draft_update",
  "payload": {
    "draft_team": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440003"
    ]
  }
}
```

**Client Action**: Update `gameState.draft_team` immediately.

---

### 2. vote_submitted

**Purpose**: Notify clients when a player submits their vote (without revealing the vote value).

**Trigger**: After successful `POST /api/games/{gameId}/vote`

**Broadcast Message**:
```typescript
{
  type: 'broadcast',
  event: 'vote_submitted',
  payload: {
    player_id: string,       // Player who just voted
    votes_count: number,     // Total votes submitted so far
    total_players: number    // Total players in game
  }
}
```

**Example**:
```json
{
  "type": "broadcast",
  "event": "vote_submitted",
  "payload": {
    "player_id": "550e8400-e29b-41d4-a716-446655440002",
    "votes_count": 4,
    "total_players": 7
  }
}
```

**Client Action**: Update `gameState.votes_submitted` and mark player as voted in UI.

**Security Note**: The `vote` value (approve/reject) is NEVER included in this broadcast.

---

### 3. action_submitted

**Purpose**: Notify clients when a team member submits their quest action.

**Trigger**: After successful `POST /api/games/{gameId}/quest/action`

**Broadcast Message**:
```typescript
{
  type: 'broadcast',
  event: 'action_submitted',
  payload: {
    actions_count: number,      // Total actions submitted so far
    total_team_members: number  // Team size for current quest
  }
}
```

**Example**:
```json
{
  "type": "broadcast",
  "event": "action_submitted",
  "payload": {
    "actions_count": 2,
    "total_team_members": 3
  }
}
```

**Client Action**: Update `gameState.actions_submitted`.

**Security Note**: The `action` type (success/fail) is NEVER included in this broadcast.

---

### 4. phase_transition

**Purpose**: Notify clients when the game phase changes.

**Trigger**: After any phase-changing operation completes

**Broadcast Message**:
```typescript
{
  type: 'broadcast',
  event: 'phase_transition',
  payload: {
    phase: GamePhase,          // New phase
    previous_phase: GamePhase, // Previous phase
    trigger: string,           // What caused the transition
    quest_number: number       // Current quest number
  }
}
```

**GamePhase values**: `'team_building'`, `'voting'`, `'quest'`, `'quest_result'`, `'lady_of_lake'`, `'assassin'`, `'game_over'`

**Trigger values**:
| Value | Description |
|-------|-------------|
| `'proposal_submitted'` | Leader submitted team proposal |
| `'proposal_approved'` | Voting passed, team approved |
| `'proposal_rejected'` | Voting failed, rotating leader |
| `'quest_complete'` | All actions submitted |
| `'quest_result_shown'` | Continue button pressed |
| `'lady_complete'` | Lady investigation done |
| `'assassin_phase'` | Good won 3, assassin's turn |
| `'game_ended'` | Game is over |

**Example**:
```json
{
  "type": "broadcast",
  "event": "phase_transition",
  "payload": {
    "phase": "quest",
    "previous_phase": "voting",
    "trigger": "proposal_approved",
    "quest_number": 2
  }
}
```

**Client Action**: Trigger immediate state refetch or update phase locally.

---

### 5. game_over

**Purpose**: Notify clients when the game ends with final results.

**Trigger**: After game ends (via 3 quests, 5 rejections, or assassin)

**Broadcast Message**:
```typescript
{
  type: 'broadcast',
  event: 'game_over',
  payload: {
    winner: 'good' | 'evil',
    reason: WinReason
  }
}
```

**WinReason values**:
| Value | Description |
|-------|-------------|
| `'3_quest_successes'` | Good team won 3 quests |
| `'3_quest_failures'` | Evil team won 3 quests |
| `'5_rejections'` | 5 consecutive proposal rejections |
| `'assassin_found_merlin'` | Assassin correctly guessed Merlin |

**Example**:
```json
{
  "type": "broadcast",
  "event": "game_over",
  "payload": {
    "winner": "evil",
    "reason": "assassin_found_merlin"
  }
}
```

**Client Action**: Transition to game over screen, trigger final state fetch.

---

## Client Subscription

### Subscription Setup

```typescript
const channel = supabase
  .channel(`game:${gameId}`)
  .on('broadcast', { event: 'draft_update' }, handleDraftUpdate)
  .on('broadcast', { event: 'vote_submitted' }, handleVoteSubmitted)
  .on('broadcast', { event: 'action_submitted' }, handleActionSubmitted)
  .on('broadcast', { event: 'phase_transition' }, handlePhaseTransition)
  .on('broadcast', { event: 'game_over' }, handleGameOver)
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log(`Connected to game:${gameId}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`Channel error:`, err);
    }
  });
```

### Subscription Cleanup

```typescript
// On component unmount or game exit
await supabase.removeChannel(channel);
```

---

## Server-Side Broadcasting

### Broadcasting Function

```typescript
import { createServerClient } from '@/lib/supabase/server';

async function broadcastEvent<T extends BroadcastEventType>(
  gameId: string,
  event: T,
  payload: PayloadForEvent<T>
): Promise<void> {
  const supabase = createServerClient();

  await supabase
    .channel(`game:${gameId}`)
    .send({
      type: 'broadcast',
      event,
      payload,
    });

  console.log(`[Broadcast] ${event} sent to game:${gameId}`);
}
```

### Debouncing

Broadcasts are debounced at 50ms minimum:

```typescript
// If same event type sent within 50ms, only last one is sent
broadcastDraftUpdate(gameId, ['player1']);       // Queued
broadcastDraftUpdate(gameId, ['player1', 'player2']); // Replaces previous
// 50ms later: Only second broadcast is sent
```

---

## Error Handling

### Client-Side

| Status | Action |
|--------|--------|
| `SUBSCRIBED` | Log success, broadcasts active |
| `CHANNEL_ERROR` | Log error, rely on polling fallback |
| `TIMED_OUT` | Log warning, subscription will retry |
| `CLOSED` | Clean up channel reference |

### Server-Side

| Scenario | Action |
|----------|--------|
| Channel send fails | Log error, do NOT block API response |
| Invalid payload | Log error, skip broadcast |
| Game not active | Skip broadcast silently |

---

## Observability

### Log Format

```
[Broadcast] Connected to game:{gameId}
[Broadcast] draft_update sent to game:{gameId}
[Broadcast] Error on game:{gameId}: {error_message}
[Broadcast] Disconnected from game:{gameId}
```

### Metrics (Future)

- Broadcasts sent per minute
- Average latency from DB write to client receipt
- Connection success rate
- Fallback to polling rate
