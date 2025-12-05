# API Contracts: Real-Time Team Selection Visibility

**Feature**: 007-realtime-team-selection  
**Date**: 2025-12-05

## Overview

This document defines the API endpoints for updating and retrieving the leader's draft team selection state during the team_building phase.

---

## NEW: Update Draft Team Selection

### `PUT /api/games/{gameId}/draft-team`

**Purpose**: Update the leader's tentative team selection before submitting an official proposal. This endpoint broadcasts the leader's selection state to all players for real-time visibility.

**Authentication**: Required (x-player-id header)

**Authorization**: Only the current mission leader can call this endpoint

**Rate Limiting**: Debounced on client-side (200ms); server accepts all valid requests

---

### Request

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameId` | string (UUID) | Yes | Unique identifier of the game |

#### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `x-player-id` | string (UUID) | Yes | Player's unique identifier (from localStorage) |

#### Body

```typescript
{
  team_member_ids: string[];  // Array of player database IDs (0 to quest_size)
}
```

**Field Validations**:
- `team_member_ids`: 
  - Must be an array (can be empty array for "no selections")
  - Length must be ≤ quest requirement size
  - All IDs must exist in `game.seating_order`
  - No duplicate IDs (enforced via set operations)

#### Example Request

```http
PUT /api/games/abc-123-def/draft-team HTTP/1.1
Host: www.playavalon.im
Content-Type: application/json
x-player-id: player-uuid-123

{
  "team_member_ids": [
    "player-b-uuid",
    "player-c-uuid",
    "player-d-uuid"
  ]
}
```

---

### Responses

#### 200 OK - Success

**Description**: Draft team successfully updated and broadcasted to all players.

**Body**:
```typescript
{
  draft_team: string[];         // Updated draft selection
  quest_number: number;         // Current quest number (for confirmation)
  required_size: number;        // Required team size for this quest
  updated_at: string;           // ISO 8601 timestamp
}
```

**Example**:
```json
{
  "draft_team": ["player-b-uuid", "player-c-uuid", "player-d-uuid"],
  "quest_number": 2,
  "required_size": 3,
  "updated_at": "2025-12-05T15:30:45.123Z"
}
```

---

#### 400 Bad Request - Invalid Team

**Description**: The proposed draft team is invalid (wrong size, invalid player IDs, etc.).

**Body**:
```typescript
{
  error: {
    code: 'INVALID_TEAM_SIZE' | 'INVALID_PLAYER_ID' | 'INVALID_REQUEST';
    message: string;
  }
}
```

**Example - Too Many Players**:
```json
{
  "error": {
    "code": "INVALID_TEAM_SIZE",
    "message": "Team size must be 3 or fewer for this quest (received 4)"
  }
}
```

**Example - Invalid Player**:
```json
{
  "error": {
    "code": "INVALID_PLAYER_ID",
    "message": "Player player-xyz-999 is not in this game"
  }
}
```

**Example - Malformed Request**:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "team_member_ids must be an array"
  }
}
```

---

#### 400 Bad Request - Invalid Phase

**Description**: Game is not in team_building phase; draft selections can only be made during team building.

**Body**:
```typescript
{
  error: {
    code: 'INVALID_PHASE';
    message: string;
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "INVALID_PHASE",
    "message": "Cannot update draft team in voting phase"
  }
}
```

---

#### 401 Unauthorized - No Player ID

**Description**: Request missing x-player-id header.

**Body**:
```typescript
{
  error: {
    code: 'UNAUTHORIZED';
    message: string;
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Player authentication required"
  }
}
```

---

#### 403 Forbidden - Not Leader

**Description**: The requesting player is not the current mission leader.

**Body**:
```typescript
{
  error: {
    code: 'NOT_LEADER';
    message: string;
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "NOT_LEADER",
    "message": "Only the current leader can update team selection"
  }
}
```

---

#### 404 Not Found - Game Not Found

**Description**: No game exists with the specified gameId.

**Body**:
```typescript
{
  error: {
    code: 'GAME_NOT_FOUND';
    message: string;
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "Game not found"
  }
}
```

---

#### 500 Internal Server Error

**Description**: Server error (e.g., database connection failure, migration not applied).

**Body**:
```typescript
{
  error: {
    code: 'SERVER_ERROR';
    message: string;
  }
}
```

**Example**:
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Unable to update selection. Please try again."
  }
}
```

---

### Implementation Notes

1. **Idempotency**: Multiple calls with the same `team_member_ids` are safe (no side effects)
2. **Empty Array**: `team_member_ids: []` is valid (clears selection without setting to NULL)
3. **Database**: Updates `games.draft_team` field directly
4. **Broadcast**: All players polling `GET /api/games/{gameId}` will see updated `draft_team` in next poll
5. **Optimistic UI**: Client should update local state immediately, then call this endpoint

---

## MODIFIED: Propose Team

### `POST /api/games/{gameId}/propose`

**Changes**: Clears `draft_team` field when proposal is created.

**Existing Behavior**:
- Validates team composition
- Creates `team_proposals` record with status='pending'
- Updates `game.phase` to 'voting'
- Logs team proposal event

**NEW Behavior**:
- **Before updating phase to 'voting'**, sets `games.draft_team = NULL`

**Reason**: Once a proposal is submitted, the draft state is no longer relevant. The official proposal is stored in `team_proposals.team_member_ids`.

**Code Change**:
```typescript
// After creating proposal, before updating phase
await clearDraftTeam(supabase, gameId);
await updateGamePhase(supabase, gameId, 'voting');
```

**No API contract changes** (request/response unchanged).

---

## MODIFIED: Get Game State

### `GET /api/games/{gameId}`

**Changes**: Includes `draft_team` and derived `is_draft_in_progress` in response.

**Existing Behavior**:
- Returns full game state including players, proposals, vote status, etc.
- Used for polling (called every 3 seconds by all players)

**NEW Response Fields**:

```typescript
{
  data: {
    game: {
      // ... existing fields ...
      draft_team: string[] | null;  // NEW: Leader's current draft selection
    },
    // ... existing fields (players, current_proposal, etc.) ...
    is_draft_in_progress: boolean;  // NEW: Derived from draft_team !== null
  }
}
```

**Derivation Logic**:
```typescript
const isDraftInProgress = game.draft_team !== null && game.draft_team.length > 0;
```

**Example Response** (team_building phase with active draft):
```json
{
  "data": {
    "game": {
      "id": "game-uuid",
      "phase": "team_building",
      "current_quest": 1,
      "current_leader_id": "player-a-uuid",
      "draft_team": ["player-b-uuid", "player-c-uuid"],
      "...": "other fields"
    },
    "players": [...],
    "current_proposal": null,
    "is_draft_in_progress": true,
    "...": "other fields"
  }
}
```

**Example Response** (team_building phase, no draft yet):
```json
{
  "data": {
    "game": {
      "id": "game-uuid",
      "phase": "team_building",
      "current_quest": 1,
      "current_leader_id": "player-a-uuid",
      "draft_team": null,
      "...": "other fields"
    },
    "is_draft_in_progress": false,
    "...": "other fields"
  }
}
```

**Backward Compatibility**:
- If migration 011 not applied, `draft_team` will be undefined in database result
- API normalizes `undefined` to `null` for consistent response shape
- Frontend treats `null` and `undefined` the same (no draft in progress)

---

## Client API Functions

### TypeScript Interface (src/lib/api/game.ts)

```typescript
/**
 * Update the leader's draft team selection
 * @param gameId - Game identifier
 * @param teamMemberIds - Array of player database IDs (0 to quest_size)
 * @returns Promise<UpdateDraftTeamResponse>
 * @throws ApiError if not leader, invalid phase, or validation fails
 */
export async function updateDraftTeam(
  gameId: string,
  teamMemberIds: string[]
): Promise<UpdateDraftTeamResponse> {
  const playerId = getPlayerId();
  const response = await fetch(`/api/games/${gameId}/draft-team`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-player-id': playerId,
    },
    body: JSON.stringify({ team_member_ids: teamMemberIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error.code, error.error.message, response.status);
  }

  const data = await response.json();
  return data;
}
```

**Usage Example** (in TeamProposal component):
```typescript
import { updateDraftTeam } from '@/lib/api/game';

// In component
const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
const [error, setError] = useState<string | null>(null);

// Debounced API call (200ms)
const updateDraftDebounced = useDebouncedCallback(
  async (teamIds: string[]) => {
    try {
      await updateDraftTeam(gameId, teamIds);
    } catch (err) {
      setError('Unable to broadcast selection');
      console.error('Draft update failed:', err);
    }
  },
  200
);

// When leader clicks a player
const handlePlayerClick = (playerId: string) => {
  if (!isLeader) return;
  
  setSelectedTeam((prev) => {
    const newTeam = prev.includes(playerId)
      ? prev.filter((id) => id !== playerId)
      : [...prev, playerId];
    
    // Optimistic UI: update local state immediately
    // Then broadcast to server (debounced)
    updateDraftDebounced(newTeam);
    
    return newTeam;
  });
};
```

---

## Sequence Diagrams

### Happy Path: Leader Selects Team

```text
Leader (Browser)          API Server              Database              Observer (Browser)
     |                        |                        |                        |
     | 1. Click player B      |                        |                        |
     |----------------------->|                        |                        |
     | (optimistic: local     |                        |                        |
     |  state = [B])          |                        |                        |
     |                        | 2. Validate leader,    |                        |
     |                        |    phase, team         |                        |
     |                        |----------------------->|                        |
     |                        |                        | 3. UPDATE games        |
     |                        |                        |    SET draft_team=[B]  |
     |                        |<-----------------------|                        |
     | 4. 200 OK              |                        |                        |
     |<-----------------------|                        |                        |
     |                        |                        |                        |
     |                        |                        |   [3 seconds later]    |
     |                        |<-----------------------------------------------|
     |                        |                        | 5. GET /api/games/{id} |
     |                        |----------------------->|                        |
     |                        |                        | 6. SELECT * FROM games |
     |                        |<-----------------------|    (includes draft_team)|
     |                        | 7. draft_team=[B]      |                        |
     |                        |---------------------------------------------->|
     |                        |                        |                        |
     |                        |                        | (Observer sees B       |
     |                        |                        |  highlighted)          |
```

### Error Path: Not Leader Tries to Update

```text
Non-Leader (Browser)      API Server              Database
     |                        |                        |
     | PUT /draft-team        |                        |
     |----------------------->|                        |
     |                        | Validate caller is     |
     |                        | current_leader_id      |
     |                        | (FAIL)                 |
     | 403 Forbidden          |                        |
     |<-----------------------|                        |
     | { code: NOT_LEADER }   |                        |
```

### Edge Case: Rapid Toggles (Debouncing)

```text
Leader (Browser)          Debounce (200ms)        API Server
     |                        |                        |
     | Click player B         |                        |
     |----------------------->|                        |
     | (local: [B])           | Start timer            |
     |                        |                        |
     | Click player C         |                        |
     |----------------------->|                        |
     | (local: [B,C])         | Reset timer            |
     |                        |                        |
     | Click player B         |                        |
     |----------------------->|                        |
     | (local: [C])           | Reset timer            |
     |                        |                        |
     |                        | [200ms passes]         |
     |                        | PUT draft_team=[C]     |
     |                        |----------------------->|
     |                        |                        | (Only final state sent)
```

---

## Error Codes Summary

| Code | HTTP Status | Meaning | User Action |
|------|-------------|---------|-------------|
| `UNAUTHORIZED` | 401 | Missing player ID | Re-register nickname |
| `NOT_LEADER` | 403 | Not current leader | Wait for your turn |
| `GAME_NOT_FOUND` | 404 | Invalid game ID | Check room code |
| `INVALID_REQUEST` | 400 | Malformed body | Report bug |
| `INVALID_PHASE` | 400 | Not in team_building | Wait for team building phase |
| `INVALID_TEAM_SIZE` | 400 | Too many players | Deselect players |
| `INVALID_PLAYER_ID` | 400 | Player not in game | Report bug (shouldn't happen) |
| `SERVER_ERROR` | 500 | Database or server issue | Retry or refresh |

---

## Testing Endpoints

### Manual Test: Update Draft Team (cURL)

```bash
# Set environment variables
GAME_ID="your-game-uuid"
PLAYER_ID="your-player-uuid"  # Must be current leader
API_URL="https://www.playavalon.im"

# Update draft team
curl -X PUT "$API_URL/api/games/$GAME_ID/draft-team" \
  -H "Content-Type: application/json" \
  -H "x-player-id: $PLAYER_ID" \
  -d '{
    "team_member_ids": [
      "player-b-uuid",
      "player-c-uuid"
    ]
  }'

# Expected: 200 OK with draft_team response

# Verify in game state
curl "$API_URL/api/games/$GAME_ID" \
  -H "x-player-id: $PLAYER_ID" | jq '.data.game.draft_team'

# Expected: ["player-b-uuid", "player-c-uuid"]
```

### Automated Test: Validation

```typescript
describe('PUT /api/games/{gameId}/draft-team', () => {
  it('should update draft team when called by leader', async () => {
    const response = await fetch(`/api/games/${gameId}/draft-team`, {
      method: 'PUT',
      headers: { 'x-player-id': leaderId, 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_member_ids: [player1, player2] }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.draft_team).toEqual([player1, player2]);
  });

  it('should reject non-leader attempts', async () => {
    const response = await fetch(`/api/games/${gameId}/draft-team`, {
      method: 'PUT',
      headers: { 'x-player-id': nonLeaderId, 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_member_ids: [player1] }),
    });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error.code).toBe('NOT_LEADER');
  });

  it('should reject oversized teams', async () => {
    const response = await fetch(`/api/games/${gameId}/draft-team`, {
      method: 'PUT',
      headers: { 'x-player-id': leaderId, 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_member_ids: [p1, p2, p3, p4, p5, p6] }), // Too many
    });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('INVALID_TEAM_SIZE');
  });
});
```

---

## Conclusion

API contracts are minimal and follow existing patterns. The new `PUT /draft-team` endpoint is the only addition; other endpoints have minor modifications to include `draft_team` in responses. All contracts are fully typed and ready for implementation (Phase 2-N).

