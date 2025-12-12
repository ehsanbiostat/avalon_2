-- ============================================
-- Migration: 012_merlin_decoy.sql
-- Feature: 009-merlin-decoy
-- Description: Add decoy player tracking to games table
-- ============================================

-- Add column to store the selected decoy player
-- NULL when decoy mode is disabled or game not yet started
ALTER TABLE games
ADD COLUMN IF NOT EXISTS merlin_decoy_player_id UUID REFERENCES players(id);

-- Documentation: Lifecycle of merlin_decoy_player_id
-- 1. Set to NULL when game is created (regardless of role_config.merlin_decoy_enabled)
-- 2. Set to a player_id during role distribution IF merlin_decoy_enabled is true
-- 3. The player_id must be a good player (role = 'good') who is NOT Merlin
-- 4. Once set, it persists for the entire game duration
-- 5. Revealed to all players when phase = 'game_over'
COMMENT ON COLUMN games.merlin_decoy_player_id IS
  'Player ID of the good player randomly selected as decoy for Merlin.
   NULL if merlin_decoy_enabled is false in role_config or game not started.
   Selected during role distribution from good players (excluding Merlin).
   Revealed to all players at game end.';

-- Index for faster lookups (optional, low cardinality)
-- Only index non-null values since most games won't have decoy enabled
CREATE INDEX IF NOT EXISTS idx_games_merlin_decoy
ON games(merlin_decoy_player_id)
WHERE merlin_decoy_player_id IS NOT NULL;
