# API Contracts: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Date**: 2025-12-05

---

## New Endpoints

### 1. POST /api/players/register

Register a new player with a globally unique nickname.

**Request**:
```typescript
interface RegisterRequest {
  nickname: string;  // 3-20 chars, alphanumeric + _ + -
  player_id: string; // UUID from localStorage
}
```

**Response (201 Created)**:
```typescript
interface RegisterResponse {
  success: true;
  player: {
    id: string;
    nickname: string;
    player_id: string;
    created_at: string;
  };
}
```

**Response (409 Conflict)**:
```typescript
interface RegisterErrorResponse {
  success: false;
  error: 'NICKNAME_TAKEN';
  message: string;
  suggestions?: string[]; // Future: alternative nicknames
}
```

**Response (400 Bad Request)**:
```typescript
interface ValidationErrorResponse {
  success: false;
  error: 'INVALID_NICKNAME';
  message: string;
  validation_errors: {
    field: string;
    message: string;
  }[];
}
```

---

### 2. GET /api/players/check-nickname

Check if a nickname is available.

**Query Parameters**:
- `nickname`: string (required)

**Response (200 OK)**:
```typescript
interface CheckNicknameResponse {
  nickname: string;
  available: boolean;
  message?: string; // If unavailable: "Nickname already taken"
}
```

---

### 3. POST /api/players/heartbeat

Send activity heartbeat to update `last_activity_at`.

**Headers**:
- `x-player-id`: string (localStorage player_id)

**Request**: Empty body or:
```typescript
interface HeartbeatRequest {
  room_code?: string; // Optional: which room player is viewing
}
```

**Response (200 OK)**:
```typescript
interface HeartbeatResponse {
  success: true;
  timestamp: string; // Server timestamp
}
```

**Response (404 Not Found)**:
```typescript
interface HeartbeatErrorResponse {
  success: false;
  error: 'PLAYER_NOT_FOUND';
}
```

---

### 4. GET /api/players/find-game

Find active game for a nickname.

**Query Parameters**:
- `nickname`: string (required)

**Response (200 OK)**:
```typescript
interface FindGameResponse {
  found: boolean;
  game?: {
    room_code: string;
    room_id: string;
    status: 'waiting' | 'roles_distributed' | 'started';
    player_count: number;
    expected_players: number;
    is_manager: boolean;
    can_reclaim: boolean;
    grace_period_remaining?: number; // Seconds until reclaim allowed
  };
}
```

---

### 5. POST /api/rooms/[code]/reclaim

Reclaim a seat in a room by nickname.

**Headers**:
- `x-player-id`: string (new localStorage player_id)

**Request**:
```typescript
interface ReclaimRequest {
  nickname: string; // Nickname of seat to reclaim
}
```

**Response (200 OK)**:
```typescript
interface ReclaimSuccessResponse {
  success: true;
  room_id: string;
  room_code: string;
  player: {
    id: string;
    nickname: string;
    is_manager: boolean;
  };
  game_id?: string; // If game is started
}
```

**Response (403 Forbidden)**:
```typescript
interface ReclaimForbiddenResponse {
  success: false;
  error: 'PLAYER_ACTIVE' | 'GRACE_PERIOD';
  message: string;
  grace_period_remaining?: number; // Seconds until allowed
  player_last_activity?: string; // ISO timestamp
}
```

**Response (404 Not Found)**:
```typescript
interface ReclaimNotFoundResponse {
  success: false;
  error: 'PLAYER_NOT_FOUND' | 'ROOM_NOT_FOUND';
  message: string;
}
```

---

## Updated Endpoints

### 6. GET /api/rooms/[code] (Updated)

Add connection status to player list.

**Response (Updated)**:
```typescript
interface RoomDetailsResponse {
  room: {
    id: string;
    code: string;
    status: string;
    expected_players: number;
    // ... existing fields
  };
  players: {
    id: string;
    nickname: string;
    is_manager: boolean;
    is_connected: boolean;           // NEW: computed from last_activity_at
    seconds_since_activity: number;  // NEW
    joined_at: string;
  }[];
  current_player: {
    id: string;
    nickname: string;
    is_manager: boolean;
  };
  // ... existing fields
}
```

---

### 7. GET /api/games/[gameId] (Updated)

Add connection status to game players.

**Response (Updated)**:
```typescript
interface GameStateResponse {
  game: { /* existing */ };
  players: {
    id: string;
    nickname: string;
    seat_position: number;
    is_connected: boolean;           // NEW
    seconds_since_activity: number;  // NEW
  }[];
  // ... existing fields
}
```

---

## Validation Rules

### Nickname Validation

```typescript
const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_-]+$/,
  errorMessages: {
    tooShort: 'Nickname must be at least 3 characters',
    tooLong: 'Nickname must be at most 20 characters',
    invalidChars: 'Nickname can only contain letters, numbers, underscores, and hyphens',
    taken: 'This nickname is already taken',
  }
};
```

### Activity Thresholds

```typescript
const ACTIVITY_THRESHOLDS = {
  DISCONNECT_AFTER_SECONDS: 60,      // Mark as disconnected
  GRACE_PERIOD_SECONDS: 30,          // After disconnect, before reclaim allowed
  HEARTBEAT_INTERVAL_SECONDS: 30,    // Client heartbeat frequency
};
```

---

## Error Codes Summary

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NICKNAME_TAKEN` | 409 | Nickname already registered |
| `INVALID_NICKNAME` | 400 | Nickname fails validation |
| `PLAYER_NOT_FOUND` | 404 | No player with this nickname/player_id |
| `ROOM_NOT_FOUND` | 404 | Room code doesn't exist |
| `PLAYER_ACTIVE` | 403 | Cannot reclaim active player's seat |
| `GRACE_PERIOD` | 403 | Player recently disconnected, wait |
| `NOT_IN_ROOM` | 403 | Player is not in this room |

---

## Client-Side Integration

### Heartbeat Setup

```typescript
// src/hooks/useHeartbeat.ts
export function useHeartbeat(roomCode?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/players/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-player-id': getPlayerId(),
          },
          body: JSON.stringify({ room_code: roomCode }),
        });
      } catch (error) {
        console.warn('Heartbeat failed:', error);
      }
    };

    // Send immediately
    sendHeartbeat();

    // Then every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    // Also send on visibility change (tab becomes visible)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [roomCode]);
}
```

### Session Takeover Detection

```typescript
// In existing room/game polling
const checkSessionTakeover = (response: RoomDetailsResponse) => {
  const currentPlayerId = getStoredPlayerId();
  const myPlayer = response.players.find(p => p.id === currentPlayerId);

  if (!myPlayer) {
    // We were in this room but now we're not
    showSessionTakeoverMessage();
    clearRoomFromLocalStorage();
    router.push('/');
  }
};
```
