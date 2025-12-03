# API Contracts: Avalon Online – MVP Lobby & Role Distribution

**Branch**: `001-avalon-mvp-lobby`
**Date**: 2025-12-02

All endpoints are under `/api/`. All requests include `X-Player-ID` header for identification.

---

## Common Headers

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `X-Player-ID` | string | Yes* | Client-generated UUID from localStorage |
| `Content-Type` | string | For POST | `application/json` |

*Required for all authenticated endpoints

### Response Headers

| Header | Type | Description |
|--------|------|-------------|
| `Content-Type` | string | `application/json` |

---

## Common Response Shapes

### Success Response

```typescript
interface SuccessResponse<T> {
  data: T;
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Common Error Codes

| Code | HTTP Status | Message |
|------|-------------|---------|
| `INVALID_REQUEST` | 400 | "Invalid request body" |
| `UNAUTHORIZED` | 401 | "Player ID required" |
| `NOT_FOUND` | 404 | "Resource not found" |
| `INTERNAL_ERROR` | 500 | "An unexpected error occurred" |

---

## Endpoints

### 1. POST `/api/players`

Register or update player information.

**Authorization**: None (creates identity)

**Request Body**:
```typescript
{
  player_id: string;   // Client-generated UUID
  nickname: string;    // 3-20 chars, alphanumeric + spaces
}
```

**Success Response** (200):
```typescript
{
  data: {
    id: string;           // Internal player UUID
    player_id: string;    // Client UUID
    nickname: string;
    created_at: string;   // ISO timestamp
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `INVALID_NICKNAME` | 400 | Nickname empty or >20 chars |
| `INVALID_PLAYER_ID` | 400 | Player ID not valid UUID |

---

### 2. GET `/api/rooms`

List all active (waiting) rooms.

**Authorization**: None (public list)

**Query Parameters**: None

**Success Response** (200):
```typescript
{
  data: Array<{
    id: string;
    code: string;
    manager_nickname: string;
    expected_players: number;
    current_players: number;
    is_full: boolean;
    created_at: string;
  }>
}
```

**Notes**:
- Only returns rooms with `status = 'waiting'`
- Ordered by `created_at` descending (newest first)

---

### 3. POST `/api/rooms`

Create a new room.

**Authorization**: Requires `X-Player-ID`

**Request Body**:
```typescript
{
  expected_players: number;  // 5-10
}
```

**Success Response** (201):
```typescript
{
  data: {
    id: string;
    code: string;           // 6-char room code
    manager_id: string;
    expected_players: number;
    status: "waiting";
    created_at: string;
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `INVALID_PLAYER_COUNT` | 400 | Player count not 5-10 |
| `PLAYER_NOT_FOUND` | 404 | Player ID not registered |
| `PLAYER_ALREADY_IN_ROOM` | 409 | Player is in another room |

---

### 4. GET `/api/rooms/[code]`

Get room details including players.

**Authorization**: Requires `X-Player-ID`, must be room member

**Path Parameters**:
- `code`: 6-char room code (case-insensitive)

**Success Response** (200):
```typescript
{
  data: {
    room: {
      id: string;
      code: string;
      manager_id: string;
      expected_players: number;
      status: "waiting" | "roles_distributed" | "started";
      created_at: string;
      last_activity_at: string;
    };
    players: Array<{
      id: string;
      nickname: string;
      is_manager: boolean;
      is_connected: boolean;
      joined_at: string;
    }>;
    current_player: {
      id: string;
      nickname: string;
      is_manager: boolean;
    };
    confirmations?: {
      total: number;
      confirmed: number;
    };
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room code doesn't exist |
| `NOT_ROOM_MEMBER` | 403 | Player not in this room |

---

### 5. POST `/api/rooms/[code]/join`

Join an existing room.

**Authorization**: Requires `X-Player-ID`

**Path Parameters**:
- `code`: 6-char room code (case-insensitive)

**Request Body**: None

**Success Response** (200):
```typescript
{
  data: {
    room_id: string;
    player_id: string;
    joined_at: string;
    is_rejoin: boolean;  // true if player was previously in room
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room code doesn't exist |
| `ROOM_FULL` | 409 | Room at capacity |
| `ROOM_NOT_WAITING` | 409 | Room not accepting players |
| `NICKNAME_TAKEN` | 409 | Another player has same nickname |
| `PLAYER_ALREADY_IN_ROOM` | 409 | Player in different room |

---

### 6. POST `/api/rooms/[code]/leave`

Leave current room.

**Authorization**: Requires `X-Player-ID`, must be room member

**Path Parameters**:
- `code`: 6-char room code

**Request Body**: None

**Success Response** (200):
```typescript
{
  data: {
    left: true;
    room_code: string;
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `NOT_ROOM_MEMBER` | 403 | Player not in this room |

**Notes**:
- If manager leaves, manager role transfers to longest-present player
- If room becomes empty, room is deleted

---

### 7. POST `/api/rooms/[code]/distribute`

Distribute roles to all players (manager only).

**Authorization**: Requires `X-Player-ID`, must be room manager

**Path Parameters**:
- `code`: 6-char room code

**Request Body**: None

**Success Response** (200):
```typescript
{
  data: {
    distributed: true;
    player_count: number;
    good_count: number;
    evil_count: number;
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `NOT_ROOM_MANAGER` | 403 | Player is not the manager |
| `ROOM_NOT_FULL` | 409 | Not all expected players present |
| `ROLES_ALREADY_DISTRIBUTED` | 409 | Roles already assigned |

---

### 8. GET `/api/rooms/[code]/role`

Get current player's role.

**Authorization**: Requires `X-Player-ID`, must be room member

**Path Parameters**:
- `code`: 6-char room code

**Success Response** (200):
```typescript
{
  data: {
    role: "good" | "evil";
    role_name: string;        // "Loyal Servant of Arthur" or "Minion of Mordred"
    role_description: string;
    is_confirmed: boolean;
    evil_teammates?: string[];  // Only for Evil players
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `NOT_ROOM_MEMBER` | 403 | Player not in this room |
| `ROLES_NOT_DISTRIBUTED` | 409 | Roles haven't been assigned yet |

---

### 9. POST `/api/rooms/[code]/confirm`

Confirm that player has seen their role.

**Authorization**: Requires `X-Player-ID`, must be room member

**Path Parameters**:
- `code`: 6-char room code

**Request Body**: None

**Success Response** (200):
```typescript
{
  data: {
    confirmed: true;
    confirmations: {
      total: number;
      confirmed: number;
    };
    all_confirmed: boolean;
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `NOT_ROOM_MEMBER` | 403 | Player not in this room |
| `ROLES_NOT_DISTRIBUTED` | 409 | Roles haven't been assigned yet |
| `ALREADY_CONFIRMED` | 409 | Player already confirmed |

---

### 10. POST `/api/rooms/[code]/start`

Start the game (manager only, after all confirmations).

**Authorization**: Requires `X-Player-ID`, must be room manager

**Path Parameters**:
- `code`: 6-char room code

**Request Body**: None

**Success Response** (200):
```typescript
{
  data: {
    started: true;
    room_code: string;
    status: "started";
  }
}
```

**Error Responses**:

| Code | Status | When |
|------|--------|------|
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist |
| `NOT_ROOM_MANAGER` | 403 | Player is not the manager |
| `NOT_ALL_CONFIRMED` | 409 | Not all players confirmed roles |
| `ALREADY_STARTED` | 409 | Game already started |

---

## Real-Time Subscriptions

Clients subscribe to room changes via Supabase Realtime:

### Room Channel: `room:{roomCode}`

**Events**:

1. **Player Joined**
   ```typescript
   {
     event: 'player_joined';
     payload: {
       player_id: string;
       nickname: string;
       joined_at: string;
     };
   }
   ```

2. **Player Left**
   ```typescript
   {
     event: 'player_left';
     payload: {
       player_id: string;
     };
   }
   ```

3. **Player Disconnected**
   ```typescript
   {
     event: 'player_disconnected';
     payload: {
       player_id: string;
       disconnected_at: string;
     };
   }
   ```

4. **Player Reconnected**
   ```typescript
   {
     event: 'player_reconnected';
     payload: {
       player_id: string;
     };
   }
   ```

5. **Roles Distributed**
   ```typescript
   {
     event: 'roles_distributed';
     payload: {
       room_status: 'roles_distributed';
     };
   }
   ```

6. **Role Confirmed**
   ```typescript
   {
     event: 'role_confirmed';
     payload: {
       confirmations: {
         total: number;
         confirmed: number;
       };
     };
   }
   ```

7. **Game Started**
   ```typescript
   {
     event: 'game_started';
     payload: {
       room_status: 'started';
     };
   }
   ```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST `/api/rooms` | 5 | 1 minute |
| POST `/api/rooms/[code]/join` | 10 | 1 minute |
| All others | 60 | 1 minute |

Rate limit exceeded returns:
```typescript
{
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests. Please try again later."
  }
}
```
