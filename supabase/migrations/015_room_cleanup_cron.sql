-- ============================================
-- Migration: 015_room_cleanup_cron.sql
-- Feature: Archive Inactive Rooms (preserve game history)
-- Description: Mark inactive rooms as 'closed' instead of deleting them
--              This preserves all game data for statistics while keeping
--              the browse rooms page clean.
-- ============================================

-- ============================================
-- STEP 1: Add 'closed' status to rooms
-- ============================================
-- The existing status check constraint needs to be updated to include 'closed'

ALTER TABLE rooms
  DROP CONSTRAINT IF EXISTS rooms_status_check;

ALTER TABLE rooms
  ADD CONSTRAINT rooms_status_check
  CHECK (status IN ('waiting', 'roles_distributed', 'started', 'closed'));

COMMENT ON COLUMN rooms.status IS
  'Room state: waiting, roles_distributed, started, or closed (archived)';

-- ============================================
-- STEP 2: Enable pg_cron extension
-- ============================================
-- pg_cron is available on Supabase free tier
-- It allows scheduling PostgreSQL functions to run periodically

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- STEP 3: Create archive function (replaces delete)
-- ============================================
-- This function ARCHIVES rooms by setting status = 'closed'
-- instead of deleting them, preserving all game history

CREATE OR REPLACE FUNCTION archive_stale_rooms()
RETURNS TABLE (
  archived_waiting integer,
  archived_roles_distributed integer,
  archived_started integer,
  total_archived integer
) AS $$
DECLARE
  waiting_count integer := 0;
  roles_dist_count integer := 0;
  started_count integer := 0;
BEGIN
  -- Archive waiting rooms inactive for 24 hours
  WITH archived AS (
    UPDATE rooms
    SET status = 'closed',
        last_activity_at = NOW()  -- Mark when it was closed
    WHERE status = 'waiting'
      AND last_activity_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO waiting_count FROM archived;

  -- Archive roles_distributed rooms inactive for 24 hours
  WITH archived AS (
    UPDATE rooms
    SET status = 'closed',
        last_activity_at = NOW()
    WHERE status = 'roles_distributed'
      AND last_activity_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO roles_dist_count FROM archived;

  -- Archive started rooms inactive for 7 days
  -- (longer timeout for games in progress - they might resume)
  WITH archived AS (
    UPDATE rooms
    SET status = 'closed',
        last_activity_at = NOW()
    WHERE status = 'started'
      AND last_activity_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO started_count FROM archived;

  -- Return counts
  RETURN QUERY SELECT
    waiting_count,
    roles_dist_count,
    started_count,
    (waiting_count + roles_dist_count + started_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_stale_rooms IS
  'Archives inactive rooms: 24h for waiting/roles_distributed, 7d for started. Preserves all game history.';

-- ============================================
-- STEP 4: Create a wrapper function for cron
-- ============================================
-- pg_cron requires a void function

CREATE OR REPLACE FUNCTION run_room_archive()
RETURNS void AS $$
DECLARE
  result RECORD;
BEGIN
  -- Run archive and log results
  SELECT * INTO result FROM archive_stale_rooms();

  -- Only log if something was archived
  IF result.total_archived > 0 THEN
    RAISE NOTICE 'Room archive completed: % waiting, % roles_distributed, % started rooms archived (total: %)',
      result.archived_waiting,
      result.archived_roles_distributed,
      result.archived_started,
      result.total_archived;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_room_archive IS
  'Wrapper function for pg_cron to execute room archiving';

-- ============================================
-- STEP 5: Drop old cleanup functions (if they exist)
-- ============================================
-- We're replacing delete with archive

DROP FUNCTION IF EXISTS cleanup_stale_rooms();
DROP FUNCTION IF EXISTS run_room_cleanup();
DROP FUNCTION IF EXISTS manual_room_cleanup();

-- ============================================
-- STEP 6: Schedule the archive job
-- ============================================
-- Run every hour at minute 0

-- First, remove any existing job with the same name (idempotent)
SELECT cron.unschedule('cleanup-stale-rooms')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-rooms'
);

-- Schedule the archiving to run every hour
SELECT cron.schedule(
  'archive-stale-rooms',           -- Job name
  '0 * * * *',                     -- Every hour at minute 0
  'SELECT run_room_archive();'     -- SQL to execute
);

-- ============================================
-- STEP 7: Manual archive trigger
-- ============================================
-- Function to manually trigger archiving (useful for testing)

CREATE OR REPLACE FUNCTION manual_room_archive()
RETURNS TABLE (
  archived_waiting integer,
  archived_roles_distributed integer,
  archived_started integer,
  total_archived integer,
  message text
) AS $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM archive_stale_rooms();

  RETURN QUERY SELECT
    result.archived_waiting,
    result.archived_roles_distributed,
    result.archived_started,
    result.total_archived,
    format('Archive complete: %s rooms archived (game history preserved)', result.total_archived)::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION manual_room_archive IS
  'Manually trigger room archiving. Call with: SELECT * FROM manual_room_archive();';

-- ============================================
-- STEP 8: Create index for closed status
-- ============================================
-- Optimize queries that filter out closed rooms

CREATE INDEX IF NOT EXISTS idx_rooms_status_not_closed
  ON rooms(status)
  WHERE status != 'closed';

-- ============================================
-- STEP 9: Statistics helper view (optional)
-- ============================================
-- Creates a view for easy game statistics queries

CREATE OR REPLACE VIEW game_statistics AS
SELECT
  g.id as game_id,
  r.code as room_code,
  r.expected_players,
  g.player_count,
  g.winner,
  g.win_reason,
  g.quest_results,
  g.created_at as game_started_at,
  g.ended_at as game_ended_at,
  EXTRACT(EPOCH FROM (g.ended_at - g.created_at)) / 60 as duration_minutes,
  r.status as room_status
FROM games g
JOIN rooms r ON g.room_id = r.id
WHERE g.ended_at IS NOT NULL;

COMMENT ON VIEW game_statistics IS
  'Aggregated view of completed games for statistics. Includes both active and archived rooms.';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON EXTENSION pg_cron IS
  'Job scheduler for PostgreSQL - used for automated room archiving';
