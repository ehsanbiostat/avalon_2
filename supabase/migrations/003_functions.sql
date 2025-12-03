-- Avalon Online MVP: Database Functions
-- Migration: 003_functions.sql
-- Date: 2025-12-02

-- ============================================
-- GET_EVIL_TEAMMATES FUNCTION
-- ============================================
-- Returns list of Evil player nicknames for a given Evil player
-- Used to reveal teammates during role distribution

CREATE OR REPLACE FUNCTION get_evil_teammates(
  p_room_id uuid,
  p_player_id uuid
)
RETURNS TABLE (nickname varchar) AS $$
BEGIN
  -- Verify the requesting player is Evil
  IF NOT EXISTS (
    SELECT 1 FROM player_roles
    WHERE room_id = p_room_id
      AND player_id = p_player_id
      AND role = 'evil'
  ) THEN
    RETURN; -- Empty result for non-Evil players
  END IF;

  -- Return other Evil players' nicknames
  RETURN QUERY
  SELECT p.nickname
  FROM player_roles pr
  INNER JOIN players p ON pr.player_id = p.id
  WHERE pr.room_id = p_room_id
    AND pr.role = 'evil'
    AND pr.player_id != p_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_evil_teammates IS 'Returns nicknames of fellow Evil players (for Evil player only)';

-- ============================================
-- CLEANUP_STALE_ROOMS FUNCTION
-- ============================================
-- Deletes rooms past their inactivity threshold
-- Called by scheduled job (cron or Supabase scheduled function)

CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS TABLE (
  deleted_waiting integer,
  deleted_started integer
) AS $$
DECLARE
  waiting_count integer;
  started_count integer;
BEGIN
  -- Delete waiting rooms inactive for 24 hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status = 'waiting'
      AND last_activity_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO waiting_count FROM deleted;

  -- Delete started/roles_distributed rooms inactive for 48 hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status IN ('roles_distributed', 'started')
      AND last_activity_at < NOW() - INTERVAL '48 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO started_count FROM deleted;

  -- Return counts
  RETURN QUERY SELECT waiting_count, started_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_stale_rooms IS 'Removes inactive rooms (24h waiting, 48h started)';

-- ============================================
-- UPDATE_ROOM_ACTIVITY FUNCTION
-- ============================================
-- Updates last_activity_at timestamp for a room
-- Called on any player action within the room

CREATE OR REPLACE FUNCTION update_room_activity(p_room_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE rooms
  SET last_activity_at = NOW()
  WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_room_activity IS 'Updates room last_activity_at for cleanup tracking';

-- ============================================
-- GET_ROOM_CONFIRMATION_STATUS FUNCTION
-- ============================================
-- Returns confirmation counts for a room

CREATE OR REPLACE FUNCTION get_room_confirmation_status(p_room_id uuid)
RETURNS TABLE (
  total_players integer,
  confirmed_players integer,
  all_confirmed boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_players,
    COUNT(*) FILTER (WHERE is_confirmed = true)::integer as confirmed_players,
    BOOL_AND(is_confirmed) as all_confirmed
  FROM player_roles
  WHERE room_id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_room_confirmation_status IS 'Returns role confirmation counts for a room';
