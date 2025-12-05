-- Player Recovery & Reconnection Migration
-- Migration: 010_player_reconnection.sql
-- Date: 2025-12-05
-- Feature: 006-player-reconnection

-- ============================================
-- STEP 1: ADD NEW COLUMNS (without unique constraint yet)
-- ============================================

-- T002: Add last_activity_at column
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- T003: Add generated column for case-insensitive nickname (NO unique index yet)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS nickname_lower varchar(20)
  GENERATED ALWAYS AS (LOWER(nickname)) STORED;

-- T008: Create index for activity queries
CREATE INDEX IF NOT EXISTS players_last_activity_idx
ON players(last_activity_at);

-- Add comments
COMMENT ON COLUMN players.last_activity_at IS 'Last heartbeat/activity timestamp for disconnect detection';
COMMENT ON COLUMN players.nickname_lower IS 'Lowercase nickname for case-insensitive uniqueness';

-- ============================================
-- T004: HELPER FUNCTION - Check Nickname Availability
-- ============================================

CREATE OR REPLACE FUNCTION check_nickname_available(p_nickname varchar)
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM players
    WHERE nickname_lower = LOWER(p_nickname)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- T005: HELPER FUNCTION - Find Player in Room by Nickname
-- ============================================

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

-- ============================================
-- T006: HELPER FUNCTION - Reclaim Seat
-- ============================================

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
-- STEP 2: RESOLVE DUPLICATE NICKNAMES (MUST RUN BEFORE UNIQUE INDEX)
-- ============================================
-- Strategy: Keep first-registered player, rename others with _N suffix
-- This resolves duplicates like 'ehsanbio' that appear multiple times

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
-- STEP 3: BACKFILL EXISTING DATA
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

-- ============================================
-- STEP 4: NOW CREATE UNIQUE INDEX (after duplicates resolved)
-- ============================================

-- T003: Create unique index on lowercase nickname
-- This will succeed now that duplicates have been renamed
CREATE UNIQUE INDEX IF NOT EXISTS players_nickname_lower_unique
ON players(nickname_lower);
