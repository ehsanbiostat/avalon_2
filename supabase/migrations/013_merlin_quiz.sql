-- ============================================
-- Migration: 013_merlin_quiz.sql
-- Feature: 010 - Endgame Merlin Quiz
-- Date: 2025-12-20
-- Description: Add table for storing Merlin quiz votes at game end
-- ============================================

-- ============================================
-- MERLIN QUIZ VOTES TABLE
-- Stores player guesses for who they think is Merlin
-- ============================================

CREATE TABLE merlin_quiz_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES players(id),
  suspected_player_id UUID REFERENCES players(id),  -- NULL if player skipped
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One vote per player per game
  UNIQUE(game_id, voter_player_id)
);

-- Index for efficient game lookups
CREATE INDEX idx_quiz_votes_game_id ON merlin_quiz_votes(game_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE merlin_quiz_votes ENABLE ROW LEVEL SECURITY;

-- Room members can read quiz votes (after they exist)
CREATE POLICY "Room members can read quiz votes"
  ON merlin_quiz_votes FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Players can insert their own vote (game must be in game_over phase)
CREATE POLICY "Players can insert own quiz vote"
  ON merlin_quiz_votes FOR INSERT
  WITH CHECK (
    voter_player_id IN (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
    AND game_id IN (
      SELECT id FROM games WHERE phase = 'game_over'
    )
  );

-- Service role can do everything (for API operations)
CREATE POLICY "Service role manages quiz votes"
  ON merlin_quiz_votes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE merlin_quiz_votes;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE merlin_quiz_votes IS
  'Stores player guesses for the end-of-game Merlin quiz. One vote per player per game.';
COMMENT ON COLUMN merlin_quiz_votes.suspected_player_id IS
  'Player voted as suspected Merlin. NULL if the voter chose to skip.';
COMMENT ON COLUMN merlin_quiz_votes.submitted_at IS
  'Timestamp of vote submission. First vote timestamp serves as quiz start time.';

-- ============================================
-- END OF MIGRATION
-- ============================================
