# API Contracts: Merlin Decoy Configuration

**Feature**: 009-merlin-decoy
**Date**: 2025-12-12

## Overview

This document specifies the API changes required for the Merlin Decoy feature. All endpoints are extensions of existing APIs.

---

## POST `/api/rooms`

### Description
Create a new room with optional Merlin Decoy configuration.

### Request Body (Extended)

```typescript
interface CreateRoomRequest {
  expected_players: number;  // 5-10
  role_config?: {
    percival?: boolean;
    morgana?: boolean;
    mordred?: boolean;
    oberon?: 'standard' | 'chaos';
    ladyOfLake?: boolean;
    merlin_decoy_enabled?: boolean;  // NEW
  };
}
```

### Example Request

```json
{
  "expected_players": 7,
  "role_config": {
    "percival": true,
    "morgana": true,
    "merlin_decoy_enabled": true
  }
}
```

### Response (Unchanged)

```typescript
interface CreateRoomResponse {
  data: {
    room_code: string;
    room_id: string;
  };
}
```

### Validation
- `merlin_decoy_enabled` accepts boolean (default: false)
- No additional validation required (works with any player count)

---

## POST `/api/rooms/[code]/distribute`

### Description
Distribute roles to all players. Now also selects decoy if enabled.

### Request Headers (Unchanged)
```
x-player-id: <player-uuid>
```

### Request Body (Unchanged)
```json
{}
```

### New Behavior
1. After assigning roles, check `role_config.merlin_decoy_enabled`
2. If enabled:
   - Get all players with role 'good'
   - Exclude player with special_role 'merlin'
   - Randomly select one as decoy
   - Store in `games.merlin_decoy_player_id`

### Response (Unchanged)

```typescript
interface DistributeResponse {
  data: {
    success: true;
    message: string;
  };
}
```

### Error Codes (Unchanged)
- `403 NOT_MANAGER`: Caller is not room manager
- `400 INVALID_STATE`: Room not in correct state for distribution

---

## GET `/api/rooms/[code]/role`

### Description
Get the calling player's role information. Extended for Merlin when decoy is enabled.

### Request Headers (Unchanged)
```
x-player-id: <player-uuid>
```

### Response for Merlin (Extended)

```typescript
interface MerlinRoleResponse {
  data: {
    role: 'good';
    special_role: 'merlin';
    role_name: string;
    role_description: string;
    is_confirmed: boolean;
    has_lady_of_lake: boolean;

    // Visibility data
    known_players: string[];           // NOW includes decoy if enabled
    known_players_label: "Evil Players";
    hidden_count: number;              // Mordred + Oberon Chaos count

    // NEW: Decoy-specific fields
    has_decoy: boolean;                // True if merlin_decoy_enabled
    decoy_warning: string | null;      // Warning message (see below)
  };
}
```

### Decoy Warning Messages

| hidden_count | decoy_warning |
|--------------|---------------|
| 0 | "⚠️ One of these players is actually good!" |
| 1 | "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you." |
| 2 | "⚠️ One of these players is actually good! Also, 2 evil players are hidden from you." |

### Response for Other Roles (Unchanged)
Other roles receive no decoy-related information.

### Example Response (Merlin with Decoy + Mordred)

```json
{
  "data": {
    "role": "good",
    "special_role": "merlin",
    "role_name": "Merlin",
    "role_description": "You know who the evil players are (except those hidden from you). Guide your team wisely, but don't reveal yourself to the Assassin!",
    "is_confirmed": false,
    "has_lady_of_lake": false,
    "known_players": ["Alice", "Bob", "Charlie"],
    "known_players_label": "Evil Players",
    "hidden_count": 1,
    "has_decoy": true,
    "decoy_warning": "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."
  }
}
```

**Note**: In the above example, one of Alice/Bob/Charlie is actually a good player (the decoy), and there's also one hidden evil (Mordred).

---

## GET `/api/games/[gameId]`

### Description
Get full game state. Extended to include decoy information for game-over reveal.

### Response (Extended)

```typescript
interface GameStateResponse {
  data: {
    game: {
      id: string;
      phase: GamePhase;
      // ... existing fields ...

      // NEW: Decoy reveal (only meaningful at game_over)
      merlin_decoy_player_id: string | null;
    };

    players: GamePlayer[];

    // ... other fields ...
  };
}
```

### GamePlayer (Extended for game-over)

```typescript
interface GamePlayer {
  id: string;
  nickname: string;
  seat_position: number;
  is_leader: boolean;
  is_connected: boolean;

  // Role reveal (only at game_over phase)
  revealed_role?: 'good' | 'evil';
  revealed_special_role?: string;

  // NEW: Decoy indicator (only at game_over if was decoy)
  was_decoy?: boolean;
}
```

### Example Response (Game Over)

```json
{
  "data": {
    "game": {
      "id": "game-uuid",
      "phase": "game_over",
      "winner": "good",
      "win_reason": "3_quest_successes",
      "merlin_decoy_player_id": "player-charlie-uuid"
    },
    "players": [
      {
        "id": "player-alice-uuid",
        "nickname": "Alice",
        "seat_position": 0,
        "revealed_role": "good",
        "revealed_special_role": "merlin",
        "was_decoy": false
      },
      {
        "id": "player-bob-uuid",
        "nickname": "Bob",
        "seat_position": 1,
        "revealed_role": "evil",
        "revealed_special_role": "assassin",
        "was_decoy": false
      },
      {
        "id": "player-charlie-uuid",
        "nickname": "Charlie",
        "seat_position": 2,
        "revealed_role": "good",
        "revealed_special_role": "servant",
        "was_decoy": true
      }
    ]
  }
}
```

---

## GET `/api/rooms/[code]`

### Description
Get room details. Extended to include decoy configuration display.

### Response (Extended)

```typescript
interface RoomDetailsResponse {
  data: {
    room: {
      // ... existing fields ...
      role_config: RoleConfig;  // Now includes merlin_decoy_enabled
      roles_in_play: string[];  // Now includes "Merlin Decoy" if enabled
    };
    // ... other fields ...
  };
}
```

### roles_in_play Examples

Without decoy:
```json
["Merlin", "Percival", "Assassin", "Morgana"]
```

With decoy:
```json
["Merlin", "Percival", "Assassin", "Morgana", "Merlin Decoy"]
```

---

## Error Handling

No new error codes are introduced. Existing error handling applies:

| Code | Status | Description |
|------|--------|-------------|
| NOT_MANAGER | 403 | Only room manager can perform this action |
| INVALID_STATE | 400 | Room/game not in correct state |
| NOT_IN_ROOM | 403 | Player not a member of this room |
| ROOM_NOT_FOUND | 404 | Room code does not exist |

---

## Security Considerations

1. **Decoy ID Hidden During Game**: `merlin_decoy_player_id` is only returned in game state, not in room state
2. **No Client Hints**: The decoy player receives no indication they are the decoy
3. **Server-Side Selection**: Decoy selection uses server-side randomization
4. **Game-Over Only Reveal**: Decoy identity only revealed when phase is `game_over`
