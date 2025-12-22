# API Contracts: Merlin Split Intel Mode

**Feature**: 011-merlin-split-intel
**Date**: 2025-12-22

## Overview

This document defines the API contract changes for the Merlin Split Intel Mode feature. All endpoints extend existing APIs with additional fields.

---

## Updated Endpoints

### POST `/api/rooms`

Create a new room with role configuration.

**Request Body** (extended):

```typescript
interface CreateRoomRequest {
  expected_players: number;
  role_config?: {
    percival?: boolean;
    morgana?: boolean;
    mordred?: boolean;
    oberon?: 'standard' | 'chaos';
    ladyOfLake?: boolean;
    merlin_decoy_enabled?: boolean;
    merlin_split_intel_enabled?: boolean;  // NEW
  };
}
```

**Response**: No changes to response structure.

**Validation Errors**:

| Status | Code | Message | Condition |
|--------|------|---------|-----------|
| 400 | `INVALID_CONFIG` | "Cannot enable both Merlin Decoy Mode and Split Intel Mode. Choose one." | Both modes enabled |

---

### PATCH `/api/rooms/[code]/config`

Update room role configuration.

**Request Body** (extended):

```typescript
interface UpdateRoleConfigRequest {
  role_config: {
    percival?: boolean;
    morgana?: boolean;
    mordred?: boolean;
    oberon?: 'standard' | 'chaos' | false;
    ladyOfLake?: boolean;
    merlin_decoy_enabled?: boolean;
    merlin_split_intel_enabled?: boolean;  // NEW
  };
}
```

**Validation Errors**:

| Status | Code | Message | Condition |
|--------|------|---------|-----------|
| 400 | `INVALID_CONFIG` | "Cannot enable both Merlin Decoy Mode and Split Intel Mode. Choose one." | Both modes enabled |

---

### POST `/api/rooms/[code]/distribute`

Distribute roles to players and start the game.

**Request**: No changes.

**New Behavior**:

1. Check `role_config.merlin_split_intel_enabled`
2. If enabled:
   - Count visible evil players (exclude Mordred, Oberon Chaos)
   - If count = 0: Return 400 error (see below)
   - If count >= 1: Create groups and store in games table

**Response** (no changes to structure, groups not revealed):

```typescript
interface DistributeResponse {
  data: {
    game_id: string;
    phase: 'role_reveal';
  };
}
```

**Validation Errors**:

| Status | Code | Message | Condition |
|--------|------|---------|-----------|
| 400 | `SPLIT_INTEL_BLOCKED` | "Cannot use Split Intel Mode with current role configuration. All evil players are hidden from Merlin (Mordred + Oberon Chaos). Please disable Split Intel Mode or change role selection." | 0 visible evil when Split Intel enabled |

---

### GET `/api/rooms/[code]/role`

Get the requesting player's role information.

**Request**: No changes.

**Response for Merlin with Split Intel** (extended):

```typescript
interface RoleResponse {
  data: {
    player_id: string;
    role: 'good' | 'evil';
    special_role: SpecialRole;
    role_name: string;
    team: 'good' | 'evil';
    known_players: Array<{ id: string; name: string }>;  // Empty for Split Intel
    known_players_label: string;
    hidden_count: number;
    ability_note: string;

    // Feature 009: Decoy fields (null when Split Intel is active)
    has_decoy?: boolean;
    decoy_warning?: string;

    // NEW: Split Intel fields
    split_intel?: {
      enabled: true;
      certain_evil: Array<{ id: string; name: string }>;
      certain_label: string;  // "🎯 Certain Evil"
      certain_description: string;  // "These players are definitely evil"
      mixed_intel: Array<{ id: string; name: string }>;
      mixed_label: string;  // "❓ Mixed Intel"
      mixed_description: string;  // "One is evil, one is good - you don't know which"
      hidden_count: number;  // Mordred + Oberon Chaos count
      hidden_warning?: string;  // "1 evil player is hidden from you" (if applicable)
    };
  };
}
```

**Response Examples**:

**Merlin with Split Intel (7 players, no hidden roles)**:
```json
{
  "data": {
    "player_id": "uuid-1",
    "role": "good",
    "special_role": "merlin",
    "role_name": "Merlin",
    "team": "good",
    "known_players": [],
    "known_players_label": "",
    "hidden_count": 0,
    "ability_note": "You see players divided into two groups with different certainty levels.",
    "split_intel": {
      "enabled": true,
      "certain_evil": [
        { "id": "uuid-2", "name": "Alice" },
        { "id": "uuid-3", "name": "Bob" }
      ],
      "certain_label": "🎯 Certain Evil",
      "certain_description": "These players are definitely evil",
      "mixed_intel": [
        { "id": "uuid-4", "name": "Charlie" },
        { "id": "uuid-5", "name": "Diana" }
      ],
      "mixed_label": "❓ Mixed Intel",
      "mixed_description": "One is evil, one is good - you don't know which",
      "hidden_count": 0
    }
  }
}
```

**Merlin with Split Intel + Mordred (hidden evil)**:
```json
{
  "data": {
    "player_id": "uuid-1",
    "role": "good",
    "special_role": "merlin",
    "role_name": "Merlin",
    "team": "good",
    "known_players": [],
    "known_players_label": "",
    "hidden_count": 1,
    "ability_note": "You see players divided into two groups. One evil player is completely hidden from you.",
    "split_intel": {
      "enabled": true,
      "certain_evil": [
        { "id": "uuid-2", "name": "Alice" }
      ],
      "certain_label": "🎯 Certain Evil",
      "certain_description": "These players are definitely evil",
      "mixed_intel": [
        { "id": "uuid-3", "name": "Bob" },
        { "id": "uuid-4", "name": "Charlie" }
      ],
      "mixed_label": "❓ Mixed Intel",
      "mixed_description": "One is evil, one is good - you don't know which",
      "hidden_count": 1,
      "hidden_warning": "1 evil player is hidden from you"
    }
  }
}
```

**Merlin with Split Intel (only 1 visible evil)**:
```json
{
  "data": {
    "player_id": "uuid-1",
    "role": "good",
    "special_role": "merlin",
    "role_name": "Merlin",
    "team": "good",
    "known_players": [],
    "known_players_label": "",
    "hidden_count": 2,
    "ability_note": "You see a mixed group only. 2 evil players are completely hidden from you.",
    "split_intel": {
      "enabled": true,
      "certain_evil": [],
      "certain_label": "🎯 Certain Evil",
      "certain_description": "These players are definitely evil",
      "mixed_intel": [
        { "id": "uuid-2", "name": "Alice" },
        { "id": "uuid-3", "name": "Bob" }
      ],
      "mixed_label": "❓ Mixed Intel",
      "mixed_description": "One is evil, one is good - you don't know which",
      "hidden_count": 2,
      "hidden_warning": "2 evil players are hidden from you"
    }
  }
}
```

---

### GET `/api/games/[gameId]`

Get complete game state (used during gameplay and game over).

**Response** (extended):

```typescript
interface GameStateResponse {
  data: {
    id: string;
    room_id: string;
    phase: GamePhase;
    current_quest: number;
    current_leader_index: number;
    vote_track: number;
    quest_results: QuestResult[];
    seating_order: string[];
    winner: 'good' | 'evil' | null;
    win_reason: string | null;
    lady_holder_id: string | null;
    lady_enabled: boolean;
    merlin_decoy_player_id: string | null;

    // NEW: Split Intel fields
    split_intel_certain_evil_ids: string[] | null;
    split_intel_mixed_evil_id: string | null;
    split_intel_mixed_good_id: string | null;

    players: Array<{
      id: string;
      nickname: string;
      seat_position: number;
      is_leader: boolean;
      is_connected: boolean;
      is_on_team: boolean;
      has_voted: boolean;

      // Only populated when phase = 'game_over'
      revealed_role?: 'good' | 'evil';
      revealed_special_role?: string;
      was_decoy?: boolean;
      was_mixed_group?: boolean;  // NEW
    }>;
  };
}
```

**Game Over Response Example**:

```json
{
  "data": {
    "id": "game-uuid",
    "phase": "game_over",
    "winner": "good",
    "win_reason": "Three successful quests",
    "split_intel_certain_evil_ids": ["uuid-2", "uuid-3"],
    "split_intel_mixed_evil_id": "uuid-4",
    "split_intel_mixed_good_id": "uuid-5",
    "players": [
      {
        "id": "uuid-1",
        "nickname": "Merlin Player",
        "revealed_role": "good",
        "revealed_special_role": "merlin"
      },
      {
        "id": "uuid-2",
        "nickname": "Alice",
        "revealed_role": "evil",
        "revealed_special_role": "assassin"
      },
      {
        "id": "uuid-3",
        "nickname": "Bob",
        "revealed_role": "evil",
        "revealed_special_role": "minion"
      },
      {
        "id": "uuid-4",
        "nickname": "Charlie",
        "revealed_role": "evil",
        "revealed_special_role": "morgana",
        "was_mixed_group": true
      },
      {
        "id": "uuid-5",
        "nickname": "Diana",
        "revealed_role": "good",
        "revealed_special_role": "servant",
        "was_mixed_group": true
      }
    ]
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CONFIG` | 400 | Role configuration is invalid (mutual exclusivity violation) |
| `SPLIT_INTEL_BLOCKED` | 400 | Cannot start game with Split Intel when 0 visible evil |
| `UNAUTHORIZED` | 401 | Player not authenticated |
| `FORBIDDEN` | 403 | Player not in room or not room manager |
| `NOT_FOUND` | 404 | Room or game not found |

---

## Realtime Subscriptions

No changes to realtime subscriptions. Game state changes are broadcast as before.

---

## Client Integration Notes

### Detecting Split Intel Mode

```typescript
// In RoleRevealModal or similar component
function renderMerlinInfo(roleData: RoleResponse['data']) {
  if (roleData.split_intel?.enabled) {
    // Render two-group display
    return <SplitIntelDisplay splitIntel={roleData.split_intel} />;
  } else if (roleData.has_decoy) {
    // Render decoy mode (existing logic)
    return <DecoyModeDisplay {...roleData} />;
  } else {
    // Render standard Merlin view
    return <StandardMerlinDisplay {...roleData} />;
  }
}
```

### Game Over Display

```typescript
// In GameOver component
function renderPlayerCard(player: GameStatePlayer) {
  return (
    <div>
      <span>{player.nickname}</span>
      <span>{player.revealed_special_role}</span>
      {player.was_decoy && <Badge>🎭 Decoy</Badge>}
      {player.was_mixed_group && <Badge>🔀 Mixed Group</Badge>}
    </div>
  );
}
```
