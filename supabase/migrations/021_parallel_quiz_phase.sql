-- ============================================
-- Migration: 021_parallel_quiz_phase.sql
-- Feature 021: Parallel Merlin Quiz Phase
-- Date: 2026-01-02
-- Description: Add parallel_quiz phase to game_phase enum
-- ============================================

-- Add parallel_quiz phase after lady_of_lake (before game_over)
-- This phase runs quiz for all players while Assassin makes their choice
ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'parallel_quiz' AFTER 'lady_of_lake';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TYPE game_phase IS 'Game phases including parallel_quiz for simultaneous Merlin quiz and Assassin choice';

-- ============================================
-- END OF MIGRATION
-- ============================================
