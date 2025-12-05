# Data Model: Player Recovery & Reconnection

**Feature**: 006-player-reconnection
**Date**: 2025-12-05
**Migration**: `010_player_reconnection.sql`

---

## Schema Changes

### 1. Players Table Updates

```sql
-- Add last_activity_at for disconnect detection
ALTER TABLE players
ADD COLUMN last_activity_at timestamptz DEFAULT now();

-- Add case-insensitive unique nickname constraint
ALTER TABLE players
ADD COLUMN nickname_lower varchar(20)
  GENERATED ALWAYS AS (LOWER(nickname)) STORED;

CREATE UNIQUE INDEX players_nickname_lower_unique
ON players(nickname_lower);

-- Index for activity queries
CREATE INDEX players_last_activity_idx
ON players(last_activity_at);

COMMENT ON COLUMN players.last_activity_at IS 'Last heartbeat/activity timestamp for disconnect detection';
COMMENT ON COLUMN players.nickname_lower IS 'Lowercase nickname for case-insensitive uniqueness';
```

### 2. No Changes to room_players

The existing `is_connected` and `disconnected_at` columns remain but are computed from `players.last_activity_at`:
- `is_connected`: TRUE if `last_activity_at > NOW() - 60 seconds`
- `disconnected_at`: Computed as `last_activity_at` when player is disconnected

---

## Entity Definitions

### Player (Updated)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Internal unique ID |
| player_id | varchar(36) | UNIQUE, NOT NULL | Client localStorage UUID |
| nickname | varchar(20) | NOT NULL | Display name (3-20 chars) |
| nickname_lower | varchar(20) | GENERATED, UNIQUE | Lowercase for uniqueness |
| last_activity_at | timestamptz | DEFAULT now() | Last heartbeat timestamp |
| created_at | timestamptz | DEFAULT now() | Registration time |
| updated_at | timestamptz | DEFAULT now() | Last profile update |

**Validation Rules**:
- `nickname`: 3-20 characters, alphanumeric + underscore + hyphen
- `nickname_lower`: Auto-generated, enforces case-insensitive uniqueness
- `last_activity_at`: Updated by heartbeat API and any player action

---

## Computed States

### Connection Status (Computed, Not Stored)

```typescript
interface ConnectionStatus {
  is_connected: boolean;        // last_activity_at > NOW() - 60s
  seconds_since_activity: number;
  can_be_reclaimed: boolean;    // last_activity_at < NOW() - 90s
  grace_period_remaining: number | null; // If disconnected but in grace
}
```

**Logic**:
```typescript
function getConnectionStatus(lastActivityAt: Date): ConnectionStatus {
  const now = new Date();
  const secondsSince = (now.getTime() - lastActivityAt.getTime()) / 1000;

  const isConnected = secondsSince < 60;
  const disconnectedAt = secondsSince >= 60 ? secondsSince - 60 : 0;
  const canBeReclaimed = secondsSince >= 90; // 60s disconnect + 30s grace
  const graceRemaining = !isConnected && !canBeReclaimed
    ? 90 - secondsSince
    : null;

  return {
    is_connected: isConnected,
    seconds_since_activity: secondsSince,
    can_be_reclaimed: canBeReclaimed,
    grace_period_remaining: graceRemaining,
  };
}
```

---

## Database Functions

### Function: Check Nickname Availability

```sql
CREATE OR REPLACE FUNCTION check_nickname_available(p_nickname varchar)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM players
    WHERE nickname_lower = LOWER(p_nickname)
  );
END;
$$ LANGUAGE plpgsql;
```

### Function: Find Player in Room by Nickname

```sql
CREATE OR REPLACE FUNCTION find_player_in_room(
  p_room_code varchar,
  p_nickname varchar
)
RETURNS TABLE (
  player_id uuid,
  room_player_id uuid,
  nickname varchar,
  last_activity_at timestamptz,
  room_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as player_id,
    rp.id as room_player_id,
    p.nickname,
    p.last_activity_at,
    r.id as room_id
  FROM room_players rp
  JOIN players p ON p.id = rp.player_id
  JOIN rooms r ON r.id = rp.room_id
  WHERE LOWER(p.nickname) = LOWER(p_nickname)
    AND r.code = UPPER(p_room_code)
    AND r.status != 'expired';
END;
$$ LANGUAGE plpgsql;
```

### Function: Reclaim Seat

```sql
CREATE OR REPLACE FUNCTION reclaim_seat(
  p_room_code varchar,
  p_nickname varchar,
  p_new_player_id uuid
)
RETURNS TABLE (
  success boolean,
  error_code varchar,
  room_id uuid,
  old_player_id uuid
) AS $$
DECLARE
  v_target RECORD;
  v_seconds_since_activity int;
BEGIN
  -- Find the player in the room
  SELECT * INTO v_target
  FROM find_player_in_room(p_room_code, p_nickname);

  IF v_target IS NULL THEN
    RETURN QUERY SELECT false, 'PLAYER_NOT_FOUND'::varchar, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  -- Calculate seconds since activity
  v_seconds_since_activity := EXTRACT(EPOCH FROM (NOW() - v_target.last_activity_at));

  -- Check if player is still active (connected)
  IF v_seconds_since_activity < 60 THEN
    RETURN QUERY SELECT false, 'PLAYER_ACTIVE'::varchar, v_target.room_id, v_target.player_id;
    RETURN;
  END IF;

  -- Check grace period (30 seconds after disconnect)
  IF v_seconds_since_activity < 90 THEN
    RETURN QUERY SELECT false, 'GRACE_PERIOD'::varchar, v_target.room_id, v_target.player_id;
    RETURN;
  END IF;

  -- Perform the reclaim: update room_players to point to new player
  UPDATE room_players
  SET player_id = p_new_player_id
  WHERE id = v_target.room_player_id;

  -- Update player_roles if exists
  UPDATE player_roles
  SET player_id = p_new_player_id
  WHERE room_id = v_target.room_id
    AND player_id = v_target.player_id;

  -- Update votes if exists
  UPDATE votes
  SET player_id = p_new_player_id
  WHERE player_id = v_target.player_id;

  -- Update quest_actions if exists
  UPDATE quest_actions
  SET player_id = p_new_player_id
  WHERE player_id = v_target.player_id;

  RETURN QUERY SELECT true, NULL::varchar, v_target.room_id, v_target.player_id;
END;
$$ LANGUAGE plpgsql;
```

---

## RLS Policies

### Players Table

```sql
-- Allow anyone to check nickname availability (read own + check others)
CREATE POLICY "players_select_policy" ON players
  FOR SELECT USING (true);

-- Allow insert for new registrations
CREATE POLICY "players_insert_policy" ON players
  FOR INSERT WITH CHECK (true);

-- Allow update only by owner (matched by player_id header)
CREATE POLICY "players_update_policy" ON players
  FOR UPDATE USING (true);  -- API routes use service role
```

### Room Players

Existing policies remain unchanged.

---

## Migration File: `010_player_reconnection.sql`

```sql
-- Player Recovery & Reconnection Migration
-- Migration: 010_player_reconnection.sql
-- Date: 2025-12-05
-- Feature: 006-player-reconnection

-- ============================================
-- PLAYERS TABLE UPDATES
-- ============================================

-- Add last_activity_at column
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Add generated column for case-insensitive nickname uniqueness
ALTER TABLE players
ADD COLUMN IF NOT EXISTS nickname_lower varchar(20)
  GENERATED ALWAYS AS (LOWER(nickname)) STORED;

-- Create unique index on lowercase nickname
CREATE UNIQUE INDEX IF NOT EXISTS players_nickname_lower_unique
ON players(nickname_lower);

-- Create index for activity queries
CREATE INDEX IF NOT EXISTS players_last_activity_idx
ON players(last_activity_at);

-- Add comments
COMMENT ON COLUMN players.last_activity_at IS 'Last heartbeat/activity timestamp for disconnect detection';
COMMENT ON COLUMN players.nickname_lower IS 'Lowercase nickname for case-insensitive uniqueness';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check nickname availability
CREATE OR REPLACE FUNCTION check_nickname_available(p_nickname varchar)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM players
    WHERE nickname_lower = LOWER(p_nickname)
  );
END;
$$ LANGUAGE plpgsql;

-- Find player in room by nickname
CREATE OR REPLACE FUNCTION find_player_in_room(
  p_room_code varchar,
  p_nickname varchar
)
RETURNS TABLE (
  player_id uuid,
  room_player_id uuid,
  nickname varchar,
  last_activity_at timestamptz,
  room_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as player_id,
    rp.id as room_player_id,
    p.nickname,
    p.last_activity_at,
    r.id as room_id
  FROM room_players rp
  JOIN players p ON p.id = rp.player_id
  JOIN rooms r ON r.id = rp.room_id
  WHERE LOWER(p.nickname) = LOWER(p_nickname)
    AND r.code = UPPER(p_room_code)
    AND r.status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- Reclaim seat function
CREATE OR REPLACE FUNCTION reclaim_seat(
  p_room_code varchar,
  p_nickname varchar,
  p_new_player_id uuid
)
RETURNS TABLE (
  success boolean,
  error_code varchar,
  room_id uuid,
  old_player_id uuid
) AS $$
DECLARE
  v_target RECORD;
  v_seconds_since_activity int;
BEGIN
  -- Find the player in the room
  SELECT * INTO v_target
  FROM find_player_in_room(p_room_code, p_nickname);

  IF v_target IS NULL THEN
    RETURN QUERY SELECT false, 'PLAYER_NOT_FOUND'::varchar, NULL::uuid, NULL::uuid;
    RETURN;
  END IF;

  -- Calculate seconds since activity
  v_seconds_since_activity := EXTRACT(EPOCH FROM (NOW() - v_target.last_activity_at));

  -- Check if player is still active (connected)
  IF v_seconds_since_activity < 60 THEN
    RETURN QUERY SELECT false, 'PLAYER_ACTIVE'::varchar, v_target.room_id, v_target.player_id;
    RETURN;
  END IF;

  -- Check grace period (30 seconds after disconnect)
  IF v_seconds_since_activity < 90 THEN
    RETURN QUERY SELECT false, 'GRACE_PERIOD'::varchar, v_target.room_id, v_target.player_id;
    RETURN;
  END IF;

  -- Perform the reclaim: update room_players to point to new player
  UPDATE room_players
  SET player_id = p_new_player_id
  WHERE id = v_target.room_player_id;

  -- Update player_roles if exists
  UPDATE player_roles
  SET player_id = p_new_player_id
  WHERE room_id = v_target.room_id
    AND player_id = v_target.player_id;

  -- Update votes if exists (table might not exist in older deployments)
  BEGIN
    UPDATE votes
    SET player_id = p_new_player_id
    WHERE player_id = v_target.player_id;
  EXCEPTION WHEN undefined_table THEN
    -- votes table doesn't exist, skip
    NULL;
  END;

  -- Update quest_actions if exists (table might not exist in older deployments)
  BEGIN
    UPDATE quest_actions
    SET player_id = p_new_player_id
    WHERE player_id = v_target.player_id;
  EXCEPTION WHEN undefined_table THEN
    -- quest_actions table doesn't exist, skip
    NULL;
  END;

  RETURN QUERY SELECT true, NULL::varchar, v_target.room_id, v_target.player_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RESOLVE DUPLICATE NICKNAMES (Pre-Unique Constraint)
-- ============================================
-- Strategy: Keep first-registered player, rename others with _N suffix

DO $$
DECLARE
  dup RECORD;
  player_rec RECORD;
  counter INT;
  new_nickname VARCHAR(20);
BEGIN
  -- Find all duplicate nicknames (case-insensitive)
  FOR dup IN
    SELECT LOWER(nickname) as lower_nick, array_agg(id ORDER BY created_at) as player_ids
    FROM players
    GROUP BY LOWER(nickname)
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    -- Skip the first player (keep original), rename the rest
    FOR player_rec IN
      SELECT id, nickname FROM players
      WHERE id = ANY(dup.player_ids[2:])  -- Skip first element
      ORDER BY created_at
    LOOP
      -- Generate unique suffix
      new_nickname := LEFT(player_rec.nickname, 17) || '_' || counter::text;
      -- Ensure new nickname is also unique
      WHILE EXISTS (SELECT 1 FROM players WHERE LOWER(nickname) = LOWER(new_nickname)) LOOP
        counter := counter + 1;
        new_nickname := LEFT(player_rec.nickname, 17) || '_' || counter::text;
      END LOOP;

      UPDATE players SET nickname = new_nickname WHERE id = player_rec.id;
      RAISE NOTICE 'Renamed duplicate nickname: % -> %', player_rec.nickname, new_nickname;
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- BACKFILL EXISTING DATA
-- ============================================

-- Set last_activity_at for existing players based on their most recent room activity
UPDATE players p
SET last_activity_at = COALESCE(
  (SELECT MAX(rp.joined_at)
   FROM room_players rp
   WHERE rp.player_id = p.id),
  p.updated_at
)
WHERE p.last_activity_at IS NULL OR p.last_activity_at = p.created_at;
```

---

## TypeScript Types

### Updated Player Type

```typescript
// src/types/database.ts - Updated Player interface
export interface Player {
  id: string;
  player_id: string;
  nickname: string;
  nickname_lower: string;  // Generated, read-only
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

// Connection status (computed client-side)
export interface ConnectionStatus {
  is_connected: boolean;
  seconds_since_activity: number;
  can_be_reclaimed: boolean;
  grace_period_remaining: number | null;
}

// Reclaim result
export interface ReclaimResult {
  success: boolean;
  error_code?: 'PLAYER_NOT_FOUND' | 'PLAYER_ACTIVE' | 'GRACE_PERIOD';
  room_id?: string;
  old_player_id?: string;
}
```

---

## Entity Relationships

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PLAYER RECONNECTION                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐         ┌───────────────┐                          │
│  │   players   │         │  room_players │                          │
│  ├─────────────┤    1:N  ├───────────────┤                          │
│  │ id (PK)     │◄────────┤ player_id (FK)│                          │
│  │ player_id   │         │ room_id (FK)  │────────►┌───────────┐    │
│  │ nickname    │         │ joined_at     │         │   rooms   │    │
│  │ nickname_   │         └───────────────┘         ├───────────┤    │
│  │   lower*    │                                   │ id (PK)   │    │
│  │ last_       │         ┌───────────────┐         │ code      │    │
│  │ activity_at*│         │ player_roles  │         │ status    │    │
│  │ created_at  │    1:N  ├───────────────┤         └───────────┘    │
│  │ updated_at  │◄────────┤ player_id (FK)│                          │
│  └─────────────┘         │ room_id (FK)  │                          │
│                          │ role          │                          │
│  * New columns           │ special_role  │                          │
│                          └───────────────┘                          │
│                                                                      │
│  RECLAIM FLOW:                                                       │
│  1. Find player by nickname (globally unique)                        │
│  2. Verify player is in specified room                               │
│  3. Check last_activity_at for disconnect status                     │
│  4. Update room_players.player_id to new player                      │
│  5. Update player_roles.player_id to new player                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```
