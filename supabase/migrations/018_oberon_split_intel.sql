-- Feature 018: Oberon Split Intel Mode
-- A variant of Split Intel where Oberon is ALWAYS in the mixed group

-- Store the Certain Evil Group (Morgana, Assassin, etc. - excluding Oberon)
ALTER TABLE games ADD COLUMN IF NOT EXISTS oberon_split_intel_certain_evil_ids UUID[];

-- Store the good player in Mixed group with Oberon
ALTER TABLE games ADD COLUMN IF NOT EXISTS oberon_split_intel_mixed_good_id UUID REFERENCES players(id);

-- Comments for documentation
COMMENT ON COLUMN games.oberon_split_intel_certain_evil_ids IS
  'Array of player IDs in Certain Evil group (excludes Oberon). NULL if oberon split intel disabled.';
COMMENT ON COLUMN games.oberon_split_intel_mixed_good_id IS
  'Player ID of good player in Mixed Intel group with Oberon. NULL if oberon split intel disabled.';

-- Note: Oberon's ID is not stored separately because Oberon is ALWAYS the evil player
-- in the mixed group when this mode is enabled. We can find Oberon from player_roles.
