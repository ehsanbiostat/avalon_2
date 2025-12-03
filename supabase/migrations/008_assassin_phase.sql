-- ============================================
-- Migration: 008_assassin_phase.sql
-- Phase 3.5: Assassin Phase
-- Date: 2025-12-03
-- Description: Add assassin phase to game_phase enum
-- ============================================

-- Add assassin phase to game_phase enum
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'assassin' AFTER 'quest_result';

-- Add assassin_guess_id to games table (who the assassin guessed)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS assassin_guess_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Comment
COMMENT ON COLUMN games.assassin_guess_id IS 'Player ID that Assassin guessed as Merlin (null until guess submitted)';

-- ============================================
-- END OF MIGRATION
-- ============================================

