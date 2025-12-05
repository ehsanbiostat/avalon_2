-- Migration: 011_draft_team_selection.sql
-- Feature: 007-realtime-team-selection
-- Description: Add draft_team column to games table for real-time selection visibility
-- Date: 2025-12-05

-- =============================================================================
-- Add draft_team column to games table
-- =============================================================================

ALTER TABLE games
ADD COLUMN IF NOT EXISTS draft_team text[] DEFAULT NULL;

-- Add column comment documenting lifecycle
COMMENT ON COLUMN games.draft_team IS 'Leader''s current draft team selection (array of player database IDs); NULL if no draft in progress or proposal already submitted. Lifecycle: Set during team_building phase when leader selects players, cleared when proposal submitted or quest advances.';

-- =============================================================================
-- Notes
-- =============================================================================

-- No index needed for draft_team because:
-- 1. Always fetched as part of full game state (SELECT * WHERE id = ...)
-- 2. Not queried independently
-- 3. Frequently updated field - index overhead not justified

-- Backward compatibility:
-- - Nullable column with DEFAULT NULL
-- - Existing games unaffected (will have NULL)
-- - Application code handles undefined as NULL gracefully

-- If future analytics require finding games with active drafts:
-- CREATE INDEX idx_games_draft_team ON games USING GIN (draft_team) WHERE draft_team IS NOT NULL;

