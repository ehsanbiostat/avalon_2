-- ============================================
-- Migration: 007_quest_system.sql
-- Phase 3: Quest System
-- Date: 2025-12-03
-- Description: Add tables for game state, team proposals, voting, and quest actions
-- ============================================

-- ============================================
-- ENUM TYPES
-- ============================================

-- Game phase states
CREATE TYPE game_phase AS ENUM (
  'team_building',    -- Leader selecting team
  'voting',           -- All players voting on team
  'quest',            -- Team executing quest
  'quest_result',     -- Showing quest result
  'game_over'         -- Game ended
);

-- Team proposal status
CREATE TYPE proposal_status AS ENUM (
  'pending',    -- Waiting for votes
  'approved',   -- Majority approved
  'rejected'    -- Majority rejected or tie
);

-- Vote choices
CREATE TYPE vote_choice AS ENUM ('approve', 'reject');

-- Quest action types
CREATE TYPE quest_action_type AS ENUM ('success', 'fail');

-- ============================================
-- GAMES TABLE
-- Primary game state - one per room
-- ============================================

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Game config (denormalized for efficiency)
  player_count INT NOT NULL CHECK (player_count >= 5 AND player_count <= 10),
  
  -- Game state
  phase game_phase NOT NULL DEFAULT 'team_building',
  current_quest INT NOT NULL DEFAULT 1 CHECK (current_quest >= 1 AND current_quest <= 5),
  current_leader_id UUID NOT NULL REFERENCES players(id),
  vote_track INT NOT NULL DEFAULT 0 CHECK (vote_track >= 0 AND vote_track <= 5),
  
  -- Results (JSONB array of quest outcomes)
  quest_results JSONB NOT NULL DEFAULT '[]',
  
  -- Seating order (randomized player IDs array)
  seating_order UUID[] NOT NULL,
  leader_index INT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Winner (set when game ends)
  winner TEXT CHECK (winner IN ('good', 'evil', NULL)),
  win_reason TEXT,
  
  -- One active game per room
  UNIQUE(room_id)
);

-- Index for room lookup
CREATE INDEX idx_games_room_id ON games(room_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_games_updated_at();

-- ============================================
-- TEAM PROPOSALS TABLE
-- Track team proposals for voting
-- ============================================

CREATE TABLE team_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL CHECK (quest_number >= 1 AND quest_number <= 5),
  proposal_number INT NOT NULL CHECK (proposal_number >= 1 AND proposal_number <= 5),
  leader_id UUID NOT NULL REFERENCES players(id),
  team_member_ids UUID[] NOT NULL,
  
  -- Status
  status proposal_status NOT NULL DEFAULT 'pending',
  
  -- Vote counts (updated when resolved)
  approve_count INT DEFAULT 0,
  reject_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for proposal lookup
CREATE INDEX idx_proposals_game_id ON team_proposals(game_id);
CREATE INDEX idx_proposals_game_quest ON team_proposals(game_id, quest_number);
CREATE INDEX idx_proposals_pending ON team_proposals(game_id) WHERE status = 'pending';

-- ============================================
-- VOTES TABLE
-- Individual player votes on proposals
-- ============================================

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES team_proposals(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  vote vote_choice NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One vote per player per proposal
  UNIQUE(proposal_id, player_id)
);

-- Index for vote lookup
CREATE INDEX idx_votes_proposal_id ON votes(proposal_id);

-- ============================================
-- QUEST ACTIONS TABLE
-- Secret actions submitted by quest team members
-- ============================================

CREATE TABLE quest_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL CHECK (quest_number >= 1 AND quest_number <= 5),
  player_id UUID NOT NULL REFERENCES players(id),
  action quest_action_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One action per player per quest
  UNIQUE(game_id, quest_number, player_id)
);

-- Index for quest action lookup
CREATE INDEX idx_quest_actions_game_quest ON quest_actions(game_id, quest_number);

-- ============================================
-- GAME EVENTS TABLE
-- Audit log for game history display
-- ============================================

CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event lookup
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_game_created ON game_events(game_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GAMES TABLE POLICIES
-- ============================================

-- Room members can read game state
CREATE POLICY "Room members can read games"
  ON games FOR SELECT
  USING (
    room_id IN (
      SELECT rp.room_id FROM room_players rp
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Service role can do everything (for API operations)
CREATE POLICY "Service role manages games"
  ON games FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- TEAM PROPOSALS TABLE POLICIES
-- ============================================

-- Room members can read proposals
CREATE POLICY "Room members can read proposals"
  ON team_proposals FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Service role can do everything
CREATE POLICY "Service role manages proposals"
  ON team_proposals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VOTES TABLE POLICIES
-- ============================================

-- Players can read their own vote immediately
CREATE POLICY "Players can read own vote"
  ON votes FOR SELECT
  USING (
    player_id IN (
      SELECT id FROM players
      WHERE player_id = current_setting('app.player_id', true)
    )
  );

-- All votes visible after proposal resolved
CREATE POLICY "All votes visible after resolved"
  ON votes FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM team_proposals
      WHERE status != 'pending'
    )
  );

-- Service role can do everything
CREATE POLICY "Service role manages votes"
  ON votes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- QUEST ACTIONS TABLE POLICIES
-- Quest actions are NEVER directly readable by clients
-- Results are computed and returned via API only
-- This prevents timing attacks and information leaks
-- ============================================

-- Only service role can access quest actions
CREATE POLICY "Quest actions server only"
  ON quest_actions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- GAME EVENTS TABLE POLICIES
-- ============================================

-- Room members can read events
CREATE POLICY "Room members can read events"
  ON game_events FOR SELECT
  USING (
    game_id IN (
      SELECT g.id FROM games g
      JOIN room_players rp ON g.room_id = rp.room_id
      JOIN players p ON rp.player_id = p.id
      WHERE p.player_id = current_setting('app.player_id', true)
    )
  );

-- Service role can do everything
CREATE POLICY "Service role manages events"
  ON game_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE games IS 'Game state for active Avalon games. One game per room, created when all players confirm roles.';
COMMENT ON TABLE team_proposals IS 'Team proposals made by leaders for quests. Up to 5 proposals per quest before Evil wins.';
COMMENT ON TABLE votes IS 'Individual player votes on team proposals. Hidden until all votes submitted.';
COMMENT ON TABLE quest_actions IS 'Secret success/fail actions submitted by quest team members. Never directly exposed to clients.';
COMMENT ON TABLE game_events IS 'Audit log of all game events for history display and debugging.';

COMMENT ON COLUMN games.player_count IS 'Number of players (5-10), stored for efficient quest requirements lookup';
COMMENT ON COLUMN games.seating_order IS 'Randomized array of player IDs determining turn order';
COMMENT ON COLUMN games.vote_track IS 'Consecutive team rejections (0-5). Resets on approval. 5 = Evil wins.';
COMMENT ON COLUMN games.quest_results IS 'JSONB array: [{quest, result, success_count, fail_count, team_member_ids, completed_at}]';

-- ============================================
-- END OF MIGRATION
-- ============================================

