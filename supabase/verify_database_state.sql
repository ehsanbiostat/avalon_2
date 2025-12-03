-- ============================================
-- PHASE 3 PRE-IMPLEMENTATION DATABASE VERIFICATION
-- Run this script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CHECK EXISTING ENUM TYPES
-- ============================================
SELECT 
  'ENUMS' as section,
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================
-- 2. CHECK EXISTING TABLES
-- ============================================
SELECT 
  'TABLES' as section,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c 
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 3. CHECK PLAYERS TABLE STRUCTURE
-- ============================================
SELECT 
  'PLAYERS_COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'players'
ORDER BY ordinal_position;

-- ============================================
-- 4. CHECK ROOMS TABLE STRUCTURE
-- ============================================
SELECT 
  'ROOMS_COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rooms'
ORDER BY ordinal_position;

-- ============================================
-- 5. CHECK ROOM_PLAYERS TABLE STRUCTURE
-- ============================================
SELECT 
  'ROOM_PLAYERS_COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'room_players'
ORDER BY ordinal_position;

-- ============================================
-- 6. CHECK PLAYER_ROLES TABLE STRUCTURE
-- ============================================
SELECT 
  'PLAYER_ROLES_COLUMNS' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'player_roles'
ORDER BY ordinal_position;

-- ============================================
-- 7. CHECK IF PHASE 3 TABLES ALREADY EXIST
-- ============================================
SELECT 
  'PHASE3_TABLES_CHECK' as section,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN 'EXISTS - WILL CONFLICT!' ELSE 'NOT EXISTS' END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('games', 'team_proposals', 'votes', 'quest_actions', 'game_events')
ORDER BY table_name;

-- ============================================
-- 8. CHECK IF PHASE 3 ENUMS ALREADY EXIST
-- ============================================
SELECT 
  'PHASE3_ENUMS_CHECK' as section,
  typname as enum_name,
  'EXISTS - WILL CONFLICT!' as status
FROM pg_type t
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN ('game_phase', 'proposal_status', 'vote_choice', 'quest_action_type');

-- ============================================
-- 9. CHECK EXISTING RLS POLICIES
-- ============================================
SELECT 
  'RLS_POLICIES' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 10. CHECK EXISTING ROOMS DATA
-- ============================================
SELECT 
  'ROOMS_DATA' as section,
  status,
  COUNT(*) as count
FROM rooms
GROUP BY status
ORDER BY status;

-- ============================================
-- 11. CHECK FOR STARTED ROOMS WITHOUT GAMES
-- (These would be orphaned after Phase 3)
-- ============================================
SELECT 
  'STARTED_ROOMS' as section,
  r.id,
  r.code,
  r.status,
  r.expected_players,
  r.created_at,
  (SELECT COUNT(*) FROM room_players rp WHERE rp.room_id = r.id) as player_count
FROM rooms r
WHERE r.status = 'started'
ORDER BY r.created_at DESC
LIMIT 10;

-- ============================================
-- 12. CHECK INDEXES
-- ============================================
SELECT 
  'INDEXES' as section,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 13. CHECK FOREIGN KEYS
-- ============================================
SELECT 
  'FOREIGN_KEYS' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- 14. CHECK DATABASE FUNCTIONS
-- ============================================
SELECT 
  'FUNCTIONS' as section,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- 15. SUMMARY CHECK
-- ============================================
SELECT 
  'SUMMARY' as section,
  'Players' as table_name,
  (SELECT COUNT(*) FROM players) as row_count
UNION ALL
SELECT 'SUMMARY', 'Rooms', (SELECT COUNT(*) FROM rooms)
UNION ALL
SELECT 'SUMMARY', 'Room Players', (SELECT COUNT(*) FROM room_players)
UNION ALL
SELECT 'SUMMARY', 'Player Roles', (SELECT COUNT(*) FROM player_roles);

-- ============================================
-- END OF VERIFICATION SCRIPT
-- ============================================

