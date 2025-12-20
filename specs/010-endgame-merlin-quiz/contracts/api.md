# API Contracts: Endgame Merlin Quiz

**Feature**: 010-endgame-merlin-quiz
**Date**: 2025-12-20

## Overview

This document defines the REST API endpoints for the Merlin Quiz feature. All endpoints follow existing patterns in the codebase.

## Base URL

```
/api/games/[gameId]/merlin-quiz
```

## Authentication

All endpoints require the `x-player-id` header containing the client's localStorage player UUID.

```http
x-player-id: <player-uuid>
```

---

## Endpoints

### 1. POST `/api/games/[gameId]/merlin-quiz`

Submit a quiz vote for who the player thinks is Merlin.

#### Request

**Headers**:
```http
Content-Type: application/json
x-player-id: <player-uuid>
```

**Body**:
```typescript
{
  suspected_player_id: string | null  // Player ID or null to skip
}
```

#### Response

**Success (200)**:
```typescript
{
  data: {
    success: true,
    votes_submitted: number,   // Current vote count
    total_players: number,     // Total players in game
    quiz_complete: boolean     // True if all have voted or timeout
  }
}
```

**Errors**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_PHASE | "Quiz is only available at game over" |
| 400 | ALREADY_VOTED | "You have already submitted your guess" |
| 400 | CANNOT_VOTE_SELF | "You cannot vote for yourself" |
| 400 | INVALID_PLAYER | "Selected player is not in this game" |
| 401 | UNAUTHORIZED | "Player ID required" |
| 403 | NOT_IN_GAME | "You are not in this game" |
| 404 | GAME_NOT_FOUND | "Game not found" |
| 404 | NO_MERLIN | "This game does not have a Merlin role" |

#### Example

**Request**:
```bash
curl -X POST "https://api/games/abc123/merlin-quiz" \
  -H "Content-Type: application/json" \
  -H "x-player-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"suspected_player_id": "660e8400-e29b-41d4-a716-446655440001"}'
```

**Response**:
```json
{
  "data": {
    "success": true,
    "votes_submitted": 4,
    "total_players": 6,
    "quiz_complete": false
  }
}
```

---

### 2. GET `/api/games/[gameId]/merlin-quiz`

Get current quiz state for the game.

#### Request

**Headers**:
```http
x-player-id: <player-uuid>
```

#### Response

**Success (200)**:
```typescript
{
  data: {
    quiz_enabled: boolean,        // True if Merlin was in game
    quiz_active: boolean,         // True if quiz in progress
    quiz_complete: boolean,       // True if all voted or timeout
    my_vote: string | null,       // Current player's voted player_id (null if not voted)
    has_voted: boolean,           // Whether current player voted
    has_skipped: boolean,         // Whether current player skipped
    votes_submitted: number,      // Count of submitted votes
    total_players: number,        // Total players in game
    connected_players: number,    // Currently connected players
    quiz_started_at: string | null, // ISO timestamp of first vote
    timeout_seconds: number       // Quiz timeout (60)
  }
}
```

#### Example

**Request**:
```bash
curl "https://api/games/abc123/merlin-quiz" \
  -H "x-player-id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response**:
```json
{
  "data": {
    "quiz_enabled": true,
    "quiz_active": true,
    "quiz_complete": false,
    "my_vote": null,
    "has_voted": false,
    "has_skipped": false,
    "votes_submitted": 3,
    "total_players": 6,
    "connected_players": 5,
    "quiz_started_at": "2025-12-20T10:30:00.000Z",
    "timeout_seconds": 60
  }
}
```

---

### 3. GET `/api/games/[gameId]/merlin-quiz/results`

Get quiz results. Only returns full results after quiz is complete.

#### Request

**Headers**:
```http
x-player-id: <player-uuid>
```

#### Response

**Success (200)** - Quiz Complete:
```typescript
{
  data: {
    quiz_complete: true,
    results: Array<{
      player_id: string,
      nickname: string,
      vote_count: number,
      is_most_voted: boolean,   // True if this player has the highest votes
      is_actual_merlin: boolean // True if this is the real Merlin
    }>,
    actual_merlin_id: string,
    actual_merlin_nickname: string,
    total_votes: number,
    skipped_count: number       // How many players skipped
  }
}
```

**Success (200)** - Quiz Not Complete:
```typescript
{
  data: {
    quiz_complete: false,
    results: null,
    votes_submitted: number,
    total_players: number
  }
}
```

**Errors**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | "Player ID required" |
| 403 | NOT_IN_GAME | "You are not in this game" |
| 404 | GAME_NOT_FOUND | "Game not found" |
| 404 | NO_QUIZ | "No quiz available for this game" |

#### Example

**Request**:
```bash
curl "https://api/games/abc123/merlin-quiz/results" \
  -H "x-player-id: 550e8400-e29b-41d4-a716-446655440000"
```

**Response** (quiz complete):
```json
{
  "data": {
    "quiz_complete": true,
    "results": [
      {
        "player_id": "660e8400-e29b-41d4-a716-446655440001",
        "nickname": "Alice",
        "vote_count": 3,
        "is_most_voted": true,
        "is_actual_merlin": false
      },
      {
        "player_id": "660e8400-e29b-41d4-a716-446655440002",
        "nickname": "Bob",
        "vote_count": 2,
        "is_most_voted": false,
        "is_actual_merlin": true
      },
      {
        "player_id": "660e8400-e29b-41d4-a716-446655440003",
        "nickname": "Charlie",
        "vote_count": 0,
        "is_most_voted": false,
        "is_actual_merlin": false
      }
    ],
    "actual_merlin_id": "660e8400-e29b-41d4-a716-446655440002",
    "actual_merlin_nickname": "Bob",
    "total_votes": 5,
    "skipped_count": 1
  }
}
```

---

## Updated Endpoint

### GET `/api/games/[gameId]`

The existing game state endpoint is extended to include quiz metadata.

#### Response Extension

Add to existing response:
```typescript
{
  data: {
    // ... existing fields ...
    
    // NEW: Quiz metadata
    has_merlin: boolean,           // Whether Merlin role exists in game
    quiz_state: {
      quiz_enabled: boolean,       // Same as has_merlin
      quiz_active: boolean,        // Quiz in progress
      quiz_complete: boolean,      // Quiz finished
      votes_submitted: number,     // Current vote count
      total_players: number        // Total player count
    } | null                       // null if has_merlin is false
  }
}
```

---

## Real-time Subscriptions

### Quiz Votes Channel

Subscribe to quiz vote updates:

```typescript
const channel = supabase
  .channel(`quiz-votes-${gameId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'merlin_quiz_votes',
    filter: `game_id=eq.${gameId}`
  }, (payload) => {
    // payload.new contains the new vote record
    // Update vote count in UI
  })
  .subscribe();
```

**Payload**:
```typescript
{
  new: {
    id: string,
    game_id: string,
    voter_player_id: string,
    suspected_player_id: string | null,
    submitted_at: string
  }
}
```

---

## Error Response Format

All errors follow the existing pattern:

```typescript
{
  error: {
    code: string,    // Machine-readable error code
    message: string  // Human-readable message
  }
}
```

---

## Validation Rules

| Rule | Endpoint | Validation |
|------|----------|------------|
| Game must be in `game_over` phase | All | Server-side phase check |
| Player must be in game | All | Check seating_order contains player.id |
| Player can only vote once | POST | Check existing vote in merlin_quiz_votes |
| Cannot vote for self | POST | Compare voter_player_id != suspected_player_id |
| Suspected player must be in game | POST | Check seating_order contains suspected_player_id |
| Quiz timeout (60s) | GET state/results | Compare timestamps; auto-complete if exceeded |

