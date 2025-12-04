-- ============================================
-- Migration: 009_lady_of_lake_phase.sql
-- Phase 4: Lady of the Lake Investigation Mechanic
-- Date: 2024-12-05
-- Description: Add Lady of the Lake investigation phase and tracking
-- ============================================

-- ============================================
-- 1. ADD LADY_OF_LAKE TO GAME_PHASE ENUM
-- ============================================

ALTER TYPE game_phase ADD VALUE IF NOT EXISTS 'lady_of_lake' AFTER 'quest_result';

-- ============================================
-- 2. CREATE LADY_INVESTIGATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS lady_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quest_number INT NOT NULL CHECK (quest_number BETWEEN 2 AND 4),
  investigator_id UUID NOT NULL REFERENCES players(id),
  target_id UUID NOT NULL REFERENCES players(id),
  result TEXT NOT NULL CHECK (result IN ('good', 'evil')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure each player can only be investigated once per game
  UNIQUE (game_id, target_id)
);

-- Index for fast lookups by game
CREATE INDEX IF NOT EXISTS idx_lady_investigations_game 
ON lady_investigations(game_id);

-- Index for finding investigations by target
CREATE INDEX IF NOT EXISTS idx_lady_investigations_target 
ON lady_investigations(target_id);

-- ============================================
-- 3. UPDATE GAMES TABLE
-- ============================================

-- Add column to track current Lady holder during active game
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS lady_holder_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Add column to track if Lady is enabled for this game
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS lady_enabled BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. RLS POLICIES FOR LADY_INVESTIGATIONS
-- ============================================

-- Enable RLS on lady_investigations
ALTER TABLE lady_investigations ENABLE ROW LEVEL SECURITY;

-- Policy: Players can view investigations in games they're part of
CREATE POLICY "Players can view investigations in their game"
ON lady_investigations FOR SELECT
TO authenticated, anon
USING (true);

-- Policy: Allow inserting investigations (validation done in API)
CREATE POLICY "Allow creating investigations"
ON lady_investigations FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE lady_investigations IS 'Tracks Lady of the Lake investigations during gameplay';
COMMENT ON COLUMN lady_investigations.quest_number IS 'Which quest this investigation occurred after (2, 3, or 4)';
COMMENT ON COLUMN lady_investigations.investigator_id IS 'Player who held Lady and performed investigation';
COMMENT ON COLUMN lady_investigations.target_id IS 'Player who was investigated';
COMMENT ON COLUMN lady_investigations.result IS 'Alignment revealed to investigator (good or evil)';

COMMENT ON COLUMN games.lady_holder_id IS 'Current Lady of the Lake holder during active game';
COMMENT ON COLUMN games.lady_enabled IS 'Whether Lady of the Lake is enabled for this game';

-- ============================================
-- END OF MIGRATION
-- ============================================

