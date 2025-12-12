# Quickstart: Merlin Decoy Configuration

**Feature**: 009-merlin-decoy
**Date**: 2025-12-12

## Overview

This guide provides step-by-step testing scenarios for the Merlin Decoy feature.

## Prerequisites

- Local development environment running (`npm run dev`)
- Supabase database with migration 012 applied
- At least 2 browser windows for testing

---

## Test Scenario 1: Enable Merlin Decoy Mode

**Goal**: Verify room manager can enable Merlin Decoy Mode

### Steps

1. Open browser window (Player 1 - Room Manager)
2. Enter nickname "Manager"
3. Click "Create Room"
4. In role configuration, find "Merlin Decoy Mode" toggle
5. Enable the toggle
6. Verify tooltip appears explaining the feature
7. Set expected players to 7
8. Create room

### Expected Results

- [x] "Merlin Decoy Mode" toggle is visible
- [x] Tooltip explains: "One random good player appears evil to Merlin"
- [x] Toggle can be enabled/disabled
- [x] Room creates successfully

---

## Test Scenario 2: Verify Decoy in Roles In Play

**Goal**: Verify all players see Merlin Decoy indicator

### Steps

1. Continue from Scenario 1 (room with decoy enabled)
2. Have 6 more players join the room
3. View "Roles in Play" section

### Expected Results

- [x] "Roles in Play" shows "🎭 Merlin Decoy" or similar indicator
- [x] All players can see the indicator
- [x] Indicator appears before role distribution

---

## Test Scenario 3: Merlin Sees Decoy (No Hidden Roles)

**Goal**: Verify Merlin sees extra player with correct warning

### Steps

1. Create 7-player room with Merlin Decoy enabled
2. Configure: Percival ✅, Morgana ✅, Mordred ❌, Oberon ❌
3. Distribute roles
4. Open Merlin's browser
5. View role reveal

### Expected Results

- [x] Merlin sees **4 players** listed as evil (3 actual + 1 decoy)
- [x] Warning shows: "⚠️ One of these players is actually good!"
- [x] Players are shuffled (not in any particular order)
- [x] No visual distinction between real evil and decoy

---

## Test Scenario 4: Merlin Sees Decoy + Mordred

**Goal**: Verify correct behavior with one hidden evil

### Steps

1. Create 7-player room with Merlin Decoy enabled
2. Configure: Mordred ✅, others as desired
3. Distribute roles
4. Open Merlin's browser
5. View role reveal

### Expected Results

- [x] Merlin sees **3 players** (2 visible evil + 1 decoy)
- [x] Mordred is NOT in the list
- [x] Warning shows: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."

---

## Test Scenario 5: Merlin Sees Decoy + Oberon Chaos

**Goal**: Verify correct behavior with Oberon Chaos hidden

### Steps

1. Create 7-player room with Merlin Decoy enabled
2. Configure: Oberon Chaos ✅
3. Distribute roles
4. Open Merlin's browser
5. View role reveal

### Expected Results

- [x] Merlin sees **3 players** (2 visible evil + 1 decoy)
- [x] Oberon Chaos is NOT in the list
- [x] Warning shows: "⚠️ One of these players is actually good! Also, 1 evil player is hidden from you."

---

## Test Scenario 6: Merlin Sees Decoy + Mordred + Oberon Chaos

**Goal**: Verify maximum hidden scenario

### Steps

1. Create 7-player room with Merlin Decoy enabled
2. Configure: Mordred ✅, Oberon Chaos ✅
3. Distribute roles
4. Open Merlin's browser
5. View role reveal

### Expected Results

- [x] Merlin sees **2 players** (1 visible evil + 1 decoy)
- [x] Neither Mordred nor Oberon Chaos are in the list
- [x] Warning shows: "⚠️ One of these players is actually good! Also, 2 evil players are hidden from you."

---

## Test Scenario 7: Decoy Player Experience

**Goal**: Verify decoy player has no indication

### Steps

1. Complete Scenario 3 (or any decoy scenario)
2. Identify which player is the decoy (check DB or wait for game end)
3. Open that player's browser
4. View their role reveal

### Expected Results

- [x] Player sees their normal good role (e.g., "Loyal Servant")
- [x] NO mention of being a decoy
- [x] Experience identical to non-decoy good players

---

## Test Scenario 8: Game Over Decoy Reveal

**Goal**: Verify decoy is revealed at game end

### Steps

1. Play a complete game with Merlin Decoy enabled
2. Game ends (any win condition)
3. View game over screen

### Expected Results

- [x] All roles are revealed as normal
- [x] Decoy player has "🎭 Decoy" indicator next to their role
- [x] Format: "Alice - Loyal Servant 🎭 Decoy"
- [x] All players can see who was the decoy

---

## Test Scenario 9: Decoy + Lady of the Lake

**Goal**: Verify Lady sees decoy's TRUE alignment

### Steps

1. Create 7-player room with Merlin Decoy + Lady of the Lake enabled
2. Distribute roles
3. Play until Lady of the Lake phase
4. Lady holder investigates the decoy player

### Expected Results

- [x] Investigation reveals "Good" (true alignment)
- [x] Decoy status is NOT revealed by Lady
- [x] Lady holder may be confused if Merlin accused the decoy

---

## Test Scenario 10: Multiple Games Same Room

**Goal**: Verify decoy is re-selected each game

### Steps

1. Play a complete game with Merlin Decoy enabled
2. Note who was the decoy
3. Rematch (if implemented) or create new game in same room
4. Play to game end
5. Note who is the decoy

### Expected Results

- [x] Each game can have a different decoy
- [x] Selection is random, not sequential
- [x] Previous decoy status has no effect on new game

---

## Quick Reference: Visibility Combinations

| Configuration | Merlin Sees | Warning |
|--------------|-------------|---------|
| Decoy only | Evil + 1 decoy | "1 is good" |
| Decoy + Mordred | Evil - Mordred + 1 decoy | "1 is good, 1 hidden" |
| Decoy + Oberon Chaos | Evil - Oberon + 1 decoy | "1 is good, 1 hidden" |
| Decoy + Mordred + Oberon Chaos | Evil - both + 1 decoy | "1 is good, 2 hidden" |
| Decoy + Oberon Standard | Evil (inc Oberon) + 1 decoy | "1 is good" |

---

## Troubleshooting

### Decoy Not Being Selected

**Symptoms**: `merlin_decoy_player_id` is NULL even when enabled

**Check**:
1. Verify `role_config.merlin_decoy_enabled` is true in room
2. Verify game was created (games table has record)
3. Check server logs for errors during distribution

### Merlin Not Seeing Decoy

**Symptoms**: Merlin's evil list has normal count

**Check**:
1. Verify decoy was selected (`merlin_decoy_player_id` in games table)
2. Check visibility logic is including decoy
3. Verify shuffle is working (list order should vary)

### Decoy Revealed During Game

**Symptoms**: Players know who decoy is before game end

**Check**:
1. Verify `merlin_decoy_player_id` is not in any response except game-over
2. Check no console logs expose the ID
3. Verify decoy player's role response has no decoy mention

---

## Database Queries for Debugging

### Check Decoy Selection

```sql
SELECT
  g.id AS game_id,
  g.merlin_decoy_player_id,
  p.nickname AS decoy_nickname,
  r.role_config->>'merlin_decoy_enabled' AS decoy_enabled
FROM games g
JOIN rooms r ON g.room_id = r.id
LEFT JOIN players p ON g.merlin_decoy_player_id = p.id
ORDER BY g.created_at DESC
LIMIT 10;
```

### Verify Decoy is Good Player

```sql
SELECT
  pr.player_id,
  p.nickname,
  pr.role,
  pr.special_role,
  g.merlin_decoy_player_id = pr.player_id AS is_decoy
FROM player_roles pr
JOIN players p ON pr.player_id = p.id
JOIN games g ON pr.game_id = g.id
WHERE g.id = '<game-id>'
ORDER BY pr.role;
```
