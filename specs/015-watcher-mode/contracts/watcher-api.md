# Watcher API Contracts

**Feature**: 015-watcher-mode
**Date**: 2024-12-25

## Overview

All watcher endpoints are under `/api/watch/` and are completely separate from player game endpoints. This ensures complete isolation per NFR requirements.

## Endpoints

### POST /api/watch/[gameId]/join

Join a game as a watcher.

**Request Headers**:
```
X-Player-ID: string (required)
```

**Response (200 OK)**:
```json
{
  "data": {
    "success": true,
    "gameId": "uuid",
    "watcherCount": 5
  }
}
```

**Error Responses**:

```json
// 400 - Game hasn't started
{
  "error": {
    "code": "GAME_NOT_STARTED",
    "message": "Game hasn't started yet - watching will be available once the game begins"
  }
}

// 403 - Watcher limit reached
{
  "error": {
    "code": "WATCHER_LIMIT_REACHED",
    "message": "This game has reached the maximum number of spectators (10)"
  }
}

// 404 - Game not found
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "Game not found"
  }
}

// 401 - No nickname
{
  "error": {
    "code": "NICKNAME_REQUIRED",
    "message": "Please register a nickname before watching"
  }
}
```

---

### GET /api/watch/[gameId]

Get current game state for watcher (neutral observer view).

**Request Headers**:
```
X-Player-ID: string (required, must be registered watcher)
```

**Response (200 OK)**:
```json
{
  "data": {
    "game": {
      "id": "uuid",
      "room_id": "uuid",
      "player_count": 7,
      "phase": "voting",
      "current_quest": 2,
      "current_leader_id": "uuid",
      "vote_track": 1,
      "quest_results": [
        {
          "quest": 1,
          "result": "success",
          "success_count": 2,
          "fail_count": 0,
          "team_member_ids": ["uuid1", "uuid2"],
          "completed_at": "2024-12-25T12:00:00Z"
        }
      ],
      "seating_order": ["uuid1", "uuid2", "..."],
      "leader_index": 3,
      "winner": null,
      "lady_enabled": true,
      "draft_team": null
    },
    "players": [
      {
        "id": "uuid",
        "nickname": "Player1",
        "seat_position": 0,
        "is_leader": false,
        "is_on_team": true,
        "has_voted": true,
        "is_connected": true
      }
    ],
    "current_proposal": {
      "id": "uuid",
      "game_id": "uuid",
      "quest_number": 2,
      "proposal_number": 1,
      "leader_id": "uuid",
      "team_member_ids": ["uuid1", "uuid2", "uuid3"],
      "status": "pending",
      "approve_count": 0,
      "reject_count": 0
    },
    "quest_requirement": {
      "size": 3,
      "fails": 1
    },
    "votes_submitted": 4,
    "total_players": 7,
    "actions_submitted": 0,
    "total_team_members": 0,
    "last_vote_result": null,
    "lady_of_lake": {
      "enabled": true,
      "holder_nickname": "Player5",
      "last_investigation": null
    },
    "draft_team": null
  }
}
```

**Error Responses**:

```json
// 401 - Not a registered watcher
{
  "error": {
    "code": "NOT_WATCHER",
    "message": "You are not watching this game"
  }
}

// 404 - Game not found
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "Game not found"
  }
}
```

---

### POST /api/watch/[gameId]/leave

Leave watching a game.

**Request Headers**:
```
X-Player-ID: string (required)
```

**Response (200 OK)**:
```json
{
  "data": {
    "success": true,
    "watcherCount": 4
  }
}
```

---

### GET /api/rooms/[code]/watch-status

Check if a room's game is watchable.

**Request Headers**:
```
X-Player-ID: string (required)
```

**Response (200 OK)**:
```json
{
  "data": {
    "watchable": true,
    "gameId": "uuid",
    "watcherCount": 3,
    "watcherLimit": 10
  }
}
```

**Response when not watchable**:
```json
{
  "data": {
    "watchable": false,
    "reason": "GAME_NOT_STARTED" | "GAME_ENDED" | "ROOM_NOT_FOUND"
  }
}
```

---

## Data Types

### WatcherGameState

Fields explicitly EXCLUDED from watcher response (compared to player GameState):
- `my_vote` - Player's own vote
- `am_team_member` - Whether current player is on team
- `can_submit_action` - Whether player can submit quest action
- `has_submitted_action` - Whether player has submitted
- `is_assassin` - Whether current player is assassin
- `assassin_phase.can_guess` - Assassin-specific field
- `lady_of_lake.is_holder` - Whether current player holds Lady
- `lady_of_lake.can_investigate` - Lady-specific permission
- Player role information (until game_over phase)

### WatcherPlayerInfo

Subset of GamePlayer without role information:
```typescript
interface WatcherPlayerInfo {
  id: string;
  nickname: string;
  seat_position: number;
  is_leader: boolean;
  is_on_team: boolean;
  has_voted: boolean;
  is_connected: boolean;
  // Roles only revealed at game_over
  revealed_role?: 'good' | 'evil';
  revealed_special_role?: string;
}
```

---

## Important Notes

1. **No writes to game tables**: All watcher endpoints only READ from game tables
2. **In-memory session storage**: Watcher sessions stored in server memory, not database
3. **Same polling interval**: Watchers poll at 3-second interval (same as players)
4. **Information timing**: Watchers see vote/quest reveals at same time as players

