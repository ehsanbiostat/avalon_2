# Quickstart: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Date**: 2025-12-05

---

## Overview

This feature enables players to rejoin games after losing their browser session (different device, browser, or cleared localStorage) by using their globally unique nickname.

---

## Prerequisites

1. Supabase project running (local or production)
2. Migration 001-009 already applied
3. Node.js and npm installed
4. Project dependencies installed (`npm install`)

---

## Quick Setup

### 1. Apply Database Migration

```bash
# Local development (Supabase CLI)
supabase migration apply

# OR manually in Supabase SQL Editor:
# Copy contents of supabase/migrations/010_player_reconnection.sql
```

### 2. Verify Migration

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
  AND column_name IN ('last_activity_at', 'nickname_lower');

-- Should return:
-- last_activity_at | timestamp with time zone
-- nickname_lower   | character varying

-- Check unique index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'players'
  AND indexname = 'players_nickname_lower_unique';

-- Should return: players_nickname_lower_unique
```

### 3. Check for Duplicate Nicknames (Important!)

```sql
-- Before migration, check for duplicates that would block unique index
SELECT LOWER(nickname), COUNT(*)
FROM players
GROUP BY LOWER(nickname)
HAVING COUNT(*) > 1;

-- If duplicates exist, resolve them manually:
-- UPDATE players SET nickname = 'NewName' WHERE id = 'conflict-id';
```

---

## Development Workflow

### Start Dev Server

```bash
npm run dev
```

### Test Registration Flow

1. Open browser in incognito mode (no localStorage)
2. Navigate to `http://localhost:3000`
3. Should see "Choose your nickname" registration screen
4. Enter a nickname and register
5. Verify redirect to home page

### Test Heartbeat

```bash
# In browser dev tools, check Network tab
# Should see POST /api/players/heartbeat every 30 seconds
```

### Test Reconnection

1. Join a room in browser A
2. Open browser B (incognito or different browser)
3. In browser B, enter your nickname in "Find My Game"
4. Click "Rejoin" to reclaim your seat
5. Browser A should show "Session taken over"

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useHeartbeat.ts` | Client-side heartbeat sender |
| `src/app/api/players/heartbeat/route.ts` | Heartbeat API endpoint |
| `src/app/api/rooms/[code]/reclaim/route.ts` | Seat reclaim endpoint |
| `src/components/NicknameRegistration.tsx` | Registration UI |
| `src/components/FindMyGame.tsx` | Game finder UI |
| `src/lib/domain/connection-status.ts` | Connection status logic |

---

## Configuration

### Timing Constants

```typescript
// src/lib/domain/connection-status.ts
export const DISCONNECT_AFTER_SECONDS = 60;   // Mark as disconnected
export const GRACE_PERIOD_SECONDS = 30;        // Before reclaim allowed
export const HEARTBEAT_INTERVAL_SECONDS = 30;  // Client heartbeat frequency
```

### Nickname Rules

```typescript
// src/lib/domain/nickname-validation.ts
export const NICKNAME_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_-]+$/,
};
```

---

## API Reference

### Register Player

```bash
curl -X POST http://localhost:3000/api/players/register \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestPlayer", "player_id": "uuid-from-localstorage"}'
```

### Check Nickname

```bash
curl "http://localhost:3000/api/players/check-nickname?nickname=TestPlayer"
```

### Send Heartbeat

```bash
curl -X POST http://localhost:3000/api/players/heartbeat \
  -H "x-player-id: uuid-from-localstorage"
```

### Find Active Game

```bash
curl "http://localhost:3000/api/players/find-game?nickname=TestPlayer"
```

### Reclaim Seat

```bash
curl -X POST http://localhost:3000/api/rooms/ABC123/reclaim \
  -H "Content-Type: application/json" \
  -H "x-player-id: new-uuid-from-localstorage" \
  -d '{"nickname": "TestPlayer"}'
```

---

## Troubleshooting

### "Nickname already taken" on registration

- Nicknames are globally unique and case-insensitive
- "Player1" and "player1" are considered the same
- Choose a different nickname or use "Find My Game" if it's your old account

### Heartbeat not working

- Check browser console for errors
- Verify `x-player-id` header is being sent
- Ensure player exists in database

### Cannot reclaim seat

- **"Player is active"**: Original session is still connected (activity in last 60s)
- **"Grace period"**: Wait 30 more seconds after disconnect
- **"Player not found"**: Nickname doesn't match any player in that room

### Session takeover not detected

- Old session polls every 3 seconds
- May take up to 3 seconds to notice
- Check browser console for "Session taken over" log

---

## Testing Checklist

- [ ] New player can register unique nickname
- [ ] Duplicate nickname (case variants) rejected
- [ ] Heartbeat updates `last_activity_at` every 30s
- [ ] Player shown as disconnected after 60s inactivity
- [ ] Cannot reclaim active player's seat
- [ ] Cannot reclaim during 30s grace period
- [ ] Can reclaim after grace period expires
- [ ] All game state (role, votes) transfers to new player
- [ ] Old session shows "Session taken over" message
- [ ] "Find My Game" shows active room for nickname
