# Research: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Date**: 2025-12-05

---

## Resolved Technical Questions

### 1. Nickname Uniqueness Implementation

**Decision**: Case-insensitive UNIQUE constraint on `nickname_lower` column

**Rationale**:
- PostgreSQL default collation is case-sensitive
- Using a computed `nickname_lower` column with UNIQUE constraint ensures:
  - "Player1" and "player1" cannot coexist
  - Original casing is preserved for display
  - Index can be used for fast lookups

**Alternatives Considered**:
- `UNIQUE (LOWER(nickname))` - Not directly supported in PostgreSQL
- `citext` extension - Adds complexity, requires extension installation
- Application-level check - Race condition risk

**Implementation**:
```sql
ALTER TABLE players ADD COLUMN nickname_lower varchar(20)
  GENERATED ALWAYS AS (LOWER(nickname)) STORED;
CREATE UNIQUE INDEX players_nickname_lower_unique ON players(nickname_lower);
```

---

### 2. Heartbeat Implementation Strategy

**Decision**: Client-side interval with Server API endpoint

**Rationale**:
- Simple implementation with existing polling infrastructure
- No WebSocket complexity needed
- Heartbeat endpoint can update `last_activity_at` in players table
- Existing 3-second polling already provides some activity signal

**Alternatives Considered**:
- Supabase Realtime presence - More complex, requires channel management
- WebSocket dedicated connection - Overkill for this use case
- Service worker background sync - Limited browser support

**Implementation**:
- Client: `setInterval` every 30 seconds (when tab is visible)
- Server: `POST /api/players/heartbeat` updates `last_activity_at`
- Query: Players with `last_activity_at < NOW() - INTERVAL '60 seconds'` are disconnected

---

### 3. Session Takeover Mechanism

**Decision**: Replace `player_id` in `room_players` table

**Rationale**:
- Simplest approach: Update the FK to point to the new player record
- All game state (roles, votes, quest actions) are linked via `player_id`
- Single UPDATE accomplishes the session transfer

**Alternatives Considered**:
- Create new room_player entry, delete old - Breaks FK references
- Session token system - Adds unnecessary complexity
- Copy all related data - Error-prone, data duplication

**Implementation**:
```sql
-- When reclaiming seat
UPDATE room_players
SET player_id = :new_player_id,
    is_connected = true,
    disconnected_at = NULL
WHERE room_id = :room_id AND player_id = :old_player_id;
```

**Challenge**: The old `player_id` is the database UUID, not the localStorage UUID. Need to find player by nickname first.

---

### 4. Nickname Registration Flow

**Decision**: Registration required before joining any room

**Rationale**:
- Globally unique nicknames must be registered before any room activity
- Existing flow: nickname entered when joining → now must validate uniqueness
- New players see "register" screen first if no localStorage identity

**Flow**:
1. New visitor → Show "Choose your nickname" screen
2. Validate uniqueness via API
3. If taken → Show error + suggestions
4. If available → Create player record + store in localStorage
5. Redirect to home/lobby

---

### 5. Disconnect Detection Query

**Decision**: Server-side computed `is_connected` based on `last_activity_at`

**Rationale**:
- Current `is_connected` field in `room_players` is never updated
- Better to compute from `last_activity_at` than maintain two fields
- Query: `last_activity_at > NOW() - INTERVAL '60 seconds'`

**Implementation**:
- Add `last_activity_at` to `players` table (not room_players)
- Create a view or SQL function to compute `is_disconnected`
- UI polls and computes status client-side from timestamps

---

### 6. Grace Period Enforcement

**Decision**: 30-second grace period before reclaim allowed

**Rationale**:
- Prevents accidental reclaims during brief network hiccups
- If player disconnects at T, reclaim allowed at T+30s
- Computed from `last_activity_at` + 60s (disconnect) + 30s (grace)

**Implementation**:
```sql
-- Reclaim allowed if:
-- player.last_activity_at < NOW() - INTERVAL '90 seconds'
```

---

### 7. Finding Player by Nickname for Reclaim

**Decision**: Query chain: nickname → player.id → room_players entry

**Rationale**:
- Nickname is globally unique, so lookup is unambiguous
- Must verify player is actually in the specified room

**Implementation**:
```sql
-- Find player in room by nickname
SELECT rp.*, p.nickname, p.last_activity_at
FROM room_players rp
JOIN players p ON p.id = rp.player_id
JOIN rooms r ON r.id = rp.room_id
WHERE LOWER(p.nickname) = LOWER(:nickname)
  AND r.code = :room_code;
```

---

### 8. Session Invalidation Notification

**Decision**: Polling-based detection with localStorage flag

**Rationale**:
- Old session's next poll will see their `player_id` no longer in room
- Can detect takeover by checking if their seat is now held by different player
- No push notification needed - poll interval is 3 seconds

**Implementation**:
- Old session polls `/api/rooms/[code]`
- Detects they're no longer in player list
- Shows "Session taken over by another device"
- Clears localStorage room reference

---

## Best Practices Applied

### PostgreSQL Best Practices
- Use generated columns for case-insensitive uniqueness
- Index computed columns for performance
- Avoid triggers for simple transformations

### Next.js API Best Practices
- Heartbeat endpoint should be lightweight (no heavy queries)
- Use server-side validation for all reclaim logic
- Return appropriate HTTP status codes (409 for conflict, 403 for forbidden)

### Security Considerations
- Grace period prevents instant hijacking
- Activity check prevents active player displacement
- Nickname ownership is not password-protected (acceptable for MVP)

---

## Open Questions (Deferred)

1. **Nickname suggestions when taken**: Future enhancement - suggest variations
2. **Profanity filter**: Out of scope for this phase
3. **Nickname change**: Out of scope - once registered, nickname is permanent
4. **Multiple active games**: Edge case - player in multiple rooms simultaneously
