-- Feature 019: Evil Ring Visibility Mode
-- Evil players only see ONE teammate each in a circular chain pattern (A→B→C→A)

-- Store the ring assignments as JSONB: { "player_id_1": "player_id_2", "player_id_2": "player_id_3", ... }
ALTER TABLE games ADD COLUMN IF NOT EXISTS evil_ring_assignments JSONB;

-- Comments for documentation
COMMENT ON COLUMN games.evil_ring_assignments IS
  'JSONB mapping of evil player ID to their one known teammate ID.
   Each player knows exactly one teammate, forming a circular chain.
   NULL if evil ring visibility disabled or game not started.
   Example: {"uuid1": "uuid2", "uuid2": "uuid3", "uuid3": "uuid1"}';

-- Note: Ring assignments are never exposed to clients in full.
-- Each evil player only sees their own mapping entry via the role API.
