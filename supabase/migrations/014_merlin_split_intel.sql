-- ============================================
-- Migration: 014_merlin_split_intel.sql
-- Feature: 011-merlin-split-intel
-- Description: Add split intel group tracking to games table
-- ============================================

-- Add column to store the Certain Evil Group (array of 0-2 player IDs)
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_certain_evil_ids UUID[];

-- Add column to store the evil player in Mixed Intel Group
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_mixed_evil_id UUID REFERENCES players(id);

-- Add column to store the good player in Mixed Intel Group
-- NULL when split intel mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS split_intel_mixed_good_id UUID REFERENCES players(id);

-- Documentation: Lifecycle of split intel columns
-- 1. Set to NULL when game is created (regardless of role_config.merlin_split_intel_enabled)
-- 2. During role distribution, IF merlin_split_intel_enabled is true AND visible evil > 0:
--    a. split_intel_certain_evil_ids = array of 0-2 evil player IDs (guaranteed evil)
--    b. split_intel_mixed_evil_id = 1 evil player ID
--    c. split_intel_mixed_good_id = 1 good player ID (not Merlin)
-- 3. Once set, values persist for entire game duration
-- 4. Revealed to all players when phase = 'game_over'

COMMENT ON COLUMN games.split_intel_certain_evil_ids IS
  'Array of player IDs in the Certain Evil group (guaranteed evil to Merlin).
   NULL if split_intel_enabled is false or game not started.
   Can be empty array if only 1 visible evil player exists.
   Revealed to all players at game end.';

COMMENT ON COLUMN games.split_intel_mixed_evil_id IS
  'Player ID of evil player in Mixed Intel group.
   NULL if split_intel_enabled is false or game not started.
   Merlin knows this is one of the two mixed players but not which one.
   Revealed to all players at game end.';

COMMENT ON COLUMN games.split_intel_mixed_good_id IS
  'Player ID of good player (not Merlin) in Mixed Intel group.
   NULL if split_intel_enabled is false or game not started.
   Merlin knows this is one of the two mixed players but not which one.
   Revealed to all players at game end.';

-- Index for faster lookups on split intel fields
-- Only index non-null values since most games won't have split intel enabled
CREATE INDEX IF NOT EXISTS idx_games_split_intel_mixed_evil
ON games(split_intel_mixed_evil_id)
WHERE split_intel_mixed_evil_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_split_intel_mixed_good
ON games(split_intel_mixed_good_id)
WHERE split_intel_mixed_good_id IS NOT NULL;

