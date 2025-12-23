-- ============================================
-- Migration: 015_room_cleanup_cron.sql
-- Feature: Automated Room Cleanup via pg_cron
-- Description: Enable pg_cron and schedule automatic cleanup of inactive rooms
-- ============================================

-- ============================================
-- STEP 1: Enable pg_cron extension
-- ============================================
-- pg_cron is available on Supabase free tier
-- It allows scheduling PostgreSQL functions to run periodically

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- STEP 2: Enhanced cleanup function with logging
-- ============================================
-- Drop existing function and recreate with better logging

DROP FUNCTION IF EXISTS cleanup_stale_rooms();

CREATE OR REPLACE FUNCTION cleanup_stale_rooms()
RETURNS TABLE (
  deleted_waiting integer,
  deleted_roles_distributed integer,
  deleted_started integer,
  total_deleted integer
) AS $$
DECLARE
  waiting_count integer := 0;
  roles_dist_count integer := 0;
  started_count integer := 0;
BEGIN
  -- Delete waiting rooms inactive for 24 hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status = 'waiting'
      AND last_activity_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO waiting_count FROM deleted;

  -- Delete roles_distributed rooms inactive for 24 hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status = 'roles_distributed'
      AND last_activity_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO roles_dist_count FROM deleted;

  -- Delete started rooms inactive for 48 hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE status = 'started'
      AND last_activity_at < NOW() - INTERVAL '48 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO started_count FROM deleted;

  -- Return counts
  RETURN QUERY SELECT
    waiting_count,
    roles_dist_count,
    started_count,
    (waiting_count + roles_dist_count + started_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_stale_rooms IS
  'Removes inactive rooms: 24h for waiting/roles_distributed, 48h for started. Called by pg_cron.';

-- ============================================
-- STEP 3: Create a wrapper function for cron
-- ============================================
-- pg_cron requires a void function, so we wrap the cleanup function

CREATE OR REPLACE FUNCTION run_room_cleanup()
RETURNS void AS $$
DECLARE
  result RECORD;
BEGIN
  -- Run cleanup and log results
  SELECT * INTO result FROM cleanup_stale_rooms();

  -- Only log if something was deleted (avoid log spam)
  IF result.total_deleted > 0 THEN
    RAISE NOTICE 'Room cleanup completed: % waiting, % roles_distributed, % started rooms deleted (total: %)',
      result.deleted_waiting,
      result.deleted_roles_distributed,
      result.deleted_started,
      result.total_deleted;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION run_room_cleanup IS
  'Wrapper function for pg_cron to execute room cleanup';

-- ============================================
-- STEP 4: Schedule the cleanup job
-- ============================================
-- Run cleanup every hour at minute 0
-- This ensures stale rooms are cleaned up regularly

-- First, remove any existing job with the same name (idempotent)
SELECT cron.unschedule('cleanup-stale-rooms')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-rooms'
);

-- Schedule the cleanup to run every hour
SELECT cron.schedule(
  'cleanup-stale-rooms',           -- Job name
  '0 * * * *',                     -- Every hour at minute 0
  'SELECT run_room_cleanup();'     -- SQL to execute
);

-- ============================================
-- STEP 5: Verify the job was scheduled
-- ============================================
-- You can check scheduled jobs with: SELECT * FROM cron.job;

COMMENT ON EXTENSION pg_cron IS
  'Job scheduler for PostgreSQL - used for automated room cleanup';

-- ============================================
-- OPTIONAL: Manual cleanup trigger
-- ============================================
-- Function to manually trigger cleanup (useful for testing)

CREATE OR REPLACE FUNCTION manual_room_cleanup()
RETURNS TABLE (
  deleted_waiting integer,
  deleted_roles_distributed integer,
  deleted_started integer,
  total_deleted integer,
  message text
) AS $$
DECLARE
  result RECORD;
BEGIN
  SELECT * INTO result FROM cleanup_stale_rooms();

  RETURN QUERY SELECT
    result.deleted_waiting,
    result.deleted_roles_distributed,
    result.deleted_started,
    result.total_deleted,
    format('Cleanup complete: %s rooms deleted', result.total_deleted)::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION manual_room_cleanup IS
  'Manually trigger room cleanup. Call with: SELECT * FROM manual_room_cleanup();';
