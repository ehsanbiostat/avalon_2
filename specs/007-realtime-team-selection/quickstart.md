# Quick Start: Real-Time Team Selection Visibility

**Feature**: 007-realtime-team-selection  
**Date**: 2025-12-05

## Overview

This guide helps developers and testers understand and validate the real-time team selection visibility feature.

---

## What This Feature Does

**Before**: Only the mission leader could see which players they were selecting for the quest team. Other players had no visibility until the team was officially submitted.

**After**: All players see the leader's selection process in real-time as they click on players. Selected players are highlighted with a pulsing border, and everyone sees a selection count (e.g., "2/3 selected").

**Why It Matters**: In physical Avalon, players observe the leader's hand movements and hesitations. This feature restores that strategic information to the digital version.

---

## Visual States

### Player Avatar States

Players can be in one of three visual states during team building:

| State | Visual Indicator | When | Visible To |
|-------|------------------|------|------------|
| **Default** | Normal border, default colors | Not selected | All players |
| **Draft Selected** | Pulsing cyan border, lighter background, subtle glow | In leader's draft_team but not yet submitted | All players |
| **Proposed** | Solid green border, shield icon (🛡️), "ON TEAM" badge | Proposal submitted, now voting | All players |

### Example Screens

**Before Leader Selects**:
```
┌─────────────────────────────┐
│   Quest 2 - Team Building   │
│                             │
│   Alice is selecting team   │
│   (0/3 selected)            │
│                             │
│    ◯ Alice (Leader)         │
│    ◯ Bob                    │
│    ◯ Carol                  │
│    ◯ Dave                   │
│    ◯ Eve                    │
└─────────────────────────────┘
```

**After Leader Selects Bob and Carol (Draft)**:
```
┌─────────────────────────────┐
│   Quest 2 - Team Building   │
│                             │
│   Selecting team: 2/3       │
│                             │
│    ◯ Alice (Leader)         │
│    ◯ Bob     [PULSING]      │ <- Cyan pulsing border
│    ◯ Carol   [PULSING]      │ <- Cyan pulsing border
│    ◯ Dave                   │
│    ◯ Eve                    │
└─────────────────────────────┘
```

**After Leader Submits Team**:
```
┌─────────────────────────────┐
│   Quest 2 - Voting Phase    │
│                             │
│   Team proposed: 3/3        │
│                             │
│    ◯ Alice (Leader)         │
│   🛡️ Bob     [SOLID GREEN]  │ <- Solid green border
│   🛡️ Carol   [SOLID GREEN]  │ <- Solid green border
│   🛡️ Dave    [SOLID GREEN]  │ <- Solid green border
│    ◯ Eve                    │
└─────────────────────────────┘
```

---

## Setup Instructions

### Prerequisites

1. **Supabase Migration**: Apply migration 011 to your Supabase database:
   ```bash
   # Open Supabase SQL Editor (https://supabase.com/dashboard/project/{your-project}/sql)
   # Run: supabase/migrations/011_draft_team_selection.sql
   
   ALTER TABLE games
   ADD COLUMN IF NOT EXISTS draft_team text[] DEFAULT NULL;
   
   COMMENT ON COLUMN games.draft_team IS 'Leader''s current draft team selection';
   ```

2. **Verify Deployment**: Check that the latest code is deployed to Vercel (branch: 007-realtime-team-selection)

3. **Browser Setup**: Open 2-3 browser windows (or incognito tabs) for multi-player testing

### Create Test Game

1. **Browser 1** (Alice - Leader):
   - Go to https://www.playavalon.im
   - Create a new room (5 players, default roles)
   - Copy room code

2. **Browser 2** (Bob - Observer):
   - Go to https://www.playavalon.im
   - Join room with code
   - Enter nickname "Bob"

3. **Browser 3** (Carol - Observer):
   - Go to https://www.playavalon.im
   - Join room with code
   - Enter nickname "Carol"

4. **Add 2 More Players** (optional):
   - Can be bots or additional browsers

5. **Start Game**:
   - Browser 1 (Alice): Click "Distribute Roles" → "Start Game"
   - All players: Confirm roles
   - Game should advance to Quest 1 (team_building phase)

---

## Testing Scenarios

### Test 1: Basic Real-Time Visibility

**Objective**: Verify observers see leader's selections in real-time

**Steps**:
1. **Browser 1** (Alice - Leader): Click on Bob's avatar to select him
2. **Browser 2** (Bob): Wait ~3 seconds (polling interval)
3. **Browser 3** (Carol): Wait ~3 seconds

**Expected Results**:
- ✅ Browser 1 (Alice): Bob's avatar immediately shows pulsing cyan border (<100ms)
- ✅ Browser 2 (Bob): After ~0-3 seconds, Bob's avatar shows pulsing cyan border
- ✅ Browser 3 (Carol): After ~0-3 seconds, Bob's avatar shows pulsing cyan border
- ✅ All browsers: Selection count shows "1/2" or "1/3" (depending on quest size)

**Pass Criteria**: All players see the selection within 3 seconds (one polling cycle)

---

### Test 2: Deselection

**Objective**: Verify deselections are broadcasted

**Steps**:
1. **Browser 1** (Alice): Select Bob and Carol (wait 3s for broadcast)
2. **Verify**: All browsers show Bob and Carol with pulsing borders
3. **Browser 1** (Alice): Click Bob again to deselect him
4. **Wait**: 3 seconds

**Expected Results**:
- ✅ Browser 1 (Alice): Bob's pulsing border disappears immediately
- ✅ Browser 2-3: After ~3 seconds, Bob's pulsing border disappears
- ✅ Carol remains selected (pulsing border) for all players
- ✅ Selection count updates to "1/2" or "1/3"

**Pass Criteria**: Deselection propagates within 3 seconds

---

### Test 3: Rapid Toggles

**Objective**: Verify system handles rapid selection changes

**Steps**:
1. **Browser 1** (Alice): Rapidly click the same player 5 times in 1 second (select, deselect, select, deselect, select)
2. **Wait**: 3-4 seconds
3. **Verify**: Final state is accurate across all browsers

**Expected Results**:
- ✅ Browser 1 (Alice): Sees immediate feedback on each click (local state updates)
- ✅ Browser 2-3: See the FINAL state (player selected) after debounce period + polling
- ✅ No errors in browser console
- ✅ Selection count is accurate

**Pass Criteria**: Final state is consistent across all players; intermediate rapid states may be skipped (acceptable)

---

### Test 4: State Transition (Draft → Proposed)

**Objective**: Verify clear visual distinction between draft and proposed states

**Steps**:
1. **Browser 1** (Alice): Select 2-3 players (depending on quest requirement)
2. **Wait**: 3 seconds for broadcast
3. **Verify**: All browsers show pulsing cyan borders
4. **Browser 1** (Alice): Click "Submit Team" button
5. **Wait**: 3 seconds

**Expected Results**:
- ✅ **Before submission**: Pulsing cyan borders, "Selecting team: X/Y" label
- ✅ **After submission**: 
  - Solid green borders (no pulsing)
  - Shield icons (🛡️) appear
  - "Team proposed: X/Y" label
  - Phase changes to "Voting"
- ✅ All players see the state change

**Pass Criteria**: Clear visual distinction between the two states

---

### Test 5: Leader Navigation Persistence

**Objective**: Verify draft persists if leader navigates away

**Steps**:
1. **Browser 1** (Alice): Select Bob and Carol
2. **Wait**: 3 seconds (ensure broadcasted)
3. **Browser 1** (Alice): Click "View My Role" button (opens modal)
4. **Browser 1** (Alice): Close modal (return to game)
5. **Verify**: Bob and Carol still have pulsing borders in Browser 1

**Expected Results**:
- ✅ Selections persist in database
- ✅ Alice sees same selections when returning
- ✅ Other players continue to see selections (no interruption)

**Pass Criteria**: Selections are not lost on navigation

---

### Test 6: Disconnected Player Selection

**Objective**: Verify disconnected players can still be selected

**Setup**:
1. Start a game with Bob connected
2. **Browser 2** (Bob): Close browser entirely (disconnect)
3. **Wait**: 60+ seconds for Bob to show as disconnected
4. **Browser 1** (Alice): Attempt to select Bob for the team

**Expected Results**:
- ✅ Alice CAN select Bob (pulsing border appears)
- ✅ Bob's avatar shows BOTH disconnect indicator AND draft selection highlight
- ✅ Other players see Bob as disconnected + selected

**Pass Criteria**: Disconnected players can be selected; both statuses are visible

---

### Test 7: Page Refresh (Leader)

**Objective**: Verify selections persist if leader refreshes page

**Steps**:
1. **Browser 1** (Alice): Select Bob and Carol
2. **Wait**: 3 seconds (ensure saved to database)
3. **Browser 1** (Alice): Press F5 (refresh page)
4. **Wait**: Page reloads, game state fetches
5. **Verify**: Bob and Carol still show pulsing borders

**Expected Results**:
- ✅ draft_team persists in database
- ✅ Selections are restored when game state loads
- ✅ Other players see no interruption (selections remain visible)

**Pass Criteria**: Selections persist across leader refresh

---

### Test 8: Non-Leader Cannot Update

**Objective**: Verify only the leader can update draft selections

**Steps**:
1. **Browser 2** (Bob - Not Leader): Open browser console (F12)
2. **Browser 2**: Attempt to call API directly:
   ```javascript
   const playerId = localStorage.getItem('player_id');
   const gameId = window.location.pathname.split('/').pop();
   
   fetch(`/api/games/${gameId}/draft-team`, {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'x-player-id': playerId,
     },
     body: JSON.stringify({ team_member_ids: ['player-id-1', 'player-id-2'] }),
   }).then(r => r.json()).then(console.log);
   ```

**Expected Results**:
- ✅ API returns 403 Forbidden
- ✅ Error message: "Only the current leader can update team selection"
- ✅ draft_team in database is unchanged

**Pass Criteria**: Non-leaders cannot manipulate draft selections

---

## Performance Benchmarks

### Latency Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Leader feedback | <100ms | Local state update time |
| Observer update (normal) | <3s | Time from leader click to observer screen update |
| Observer update (degraded network) | <5s | Same as above, with network throttling |
| API response time | <500ms | Server processing time for PUT /draft-team |

### How to Measure

**Leader Feedback** (Browser 1):
```javascript
// In browser console
const start = performance.now();
// Click player avatar
const end = performance.now();
console.log(`Feedback time: ${end - start}ms`); // Should be <100ms
```

**Observer Update** (Browser 2-3):
1. Browser 1 (Alice): Note exact time when clicking player (use `console.log(new Date())`)
2. Browser 2 (Bob): Note exact time when pulsing border appears
3. Calculate difference: Should be <3s

**API Response Time**:
1. Open browser Network tab (F12 → Network)
2. Select players as leader
3. Find PUT request to `/api/games/.../draft-team`
4. Check "Time" column: Should be <500ms

---

## Troubleshooting

### Issue: Selections Not Appearing for Observers

**Symptoms**: Leader sees selections immediately, but observers never see them

**Possible Causes**:
1. Migration 011 not applied to production database
2. Polling stopped (check browser console for errors)
3. API endpoint returning errors (check Network tab)

**Debug Steps**:
```bash
# 1. Verify migration applied
# In Supabase SQL Editor:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'games' AND column_name = 'draft_team';
# Expected: 1 row with data_type = 'ARRAY'

# 2. Check API response
# In browser console (any player):
const gameId = window.location.pathname.split('/').pop();
const playerId = localStorage.getItem('player_id');
fetch(`/api/games/${gameId}`, {
  headers: { 'x-player-id': playerId }
}).then(r => r.json()).then(data => {
  console.log('draft_team:', data.data.game.draft_team);
  console.log('is_draft_in_progress:', data.data.is_draft_in_progress);
});
# Expected: draft_team should be array or null
```

---

### Issue: "Cannot update selection" Error

**Symptoms**: Leader clicks players, but sees error message

**Possible Causes**:
1. Player is not actually the current leader (game state desync)
2. Game not in team_building phase
3. Network error

**Debug Steps**:
```javascript
// In browser console (Browser 1 - Alice):
const gameId = window.location.pathname.split('/').pop();
const playerId = localStorage.getItem('player_id');

fetch(`/api/games/${gameId}`, {
  headers: { 'x-player-id': playerId }
}).then(r => r.json()).then(data => {
  console.log('My player ID:', playerId);
  console.log('Current leader ID:', data.data.game.current_leader_id);
  console.log('Am I leader?', playerId === data.data.game.current_leader_id);
  console.log('Game phase:', data.data.game.phase);
});
// Expected: Am I leader? true, Game phase: team_building
```

---

### Issue: Visual States Not Distinct

**Symptoms**: Draft and proposed selections look too similar

**Debug Steps**:
1. Check CSS classes are applied:
   ```javascript
   // In browser console:
   document.querySelectorAll('[class*="draft-selected"]').length; // Should be > 0 during draft
   document.querySelectorAll('[class*="proposed"]').length; // Should be > 0 after submission
   ```

2. Verify Tailwind classes:
   - Draft: `border-cyan-400 animate-pulse bg-cyan-900/30`
   - Proposed: `border-green-400 bg-green-800`

3. Check browser rendering (some browsers may not support `animate-pulse`)

---

### Issue: Rapid Toggles Cause Errors

**Symptoms**: Clicking players very rapidly shows console errors or wrong final state

**Expected Behavior**: Debouncing should prevent this (200ms delay)

**Debug Steps**:
```javascript
// In browser console (Browser 1):
// Watch for API calls
let callCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('/draft-team')) {
    callCount++;
    console.log(`Draft API call #${callCount} at ${new Date().toISOString()}`);
  }
  return originalFetch.apply(this, args);
};

// Now rapidly click players (5x in 1 second)
// Expected: Only 1-2 API calls (debounced)
```

---

## Manual Checklist

Before marking feature as complete, verify:

- [ ] Migration 011 applied to production Supabase
- [ ] Code deployed to Vercel (007-realtime-team-selection branch merged to main)
- [ ] Test 1-8 all pass (documented above)
- [ ] Leader feedback <100ms (measured)
- [ ] Observer updates <3s (measured)
- [ ] Visual states are clearly distinguishable (peer review)
- [ ] No console errors during normal usage
- [ ] Mobile web functional (touch targets work, visual states visible)
- [ ] Backward compatible (no errors if migration not applied)

---

## Demo Script (For User Testing)

**Setup**: 3 players (Alice as leader, Bob and Carol as observers)

**Script**:
1. "Alice, please select Bob for the quest team by clicking his avatar."
   - **Observe**: Bob's avatar gets pulsing cyan border
2. "Bob and Carol, watch your screens. Do you see Bob highlighted?"
   - **Expected**: Yes, within 3 seconds
3. "Alice, now also select Carol."
   - **Observe**: Carol's avatar also gets pulsing cyan border
4. "Everyone, how many players are selected? What does the counter say?"
   - **Expected**: "2/3 selected" or similar
5. "Alice, change your mind and deselect Bob."
   - **Observe**: Bob's pulsing border disappears (for all players within 3s)
6. "Alice, select Dave instead, then submit the team."
   - **Observe**: State changes from pulsing cyan to solid green + shield icons
7. "Everyone, can you tell the difference between the 'drafting' state and the 'proposed' state?"
   - **Expected**: Yes, clear visual distinction

**Post-Demo Questions**:
- Does real-time selection visibility improve your gameplay experience?
- Can you distinguish between draft selections and submitted proposals?
- Did you notice any delays or confusing behavior?

---

## Next Steps

After this feature is validated:
1. Merge `007-realtime-team-selection` branch to `main`
2. Deploy to production Vercel
3. Monitor API error rates for `/api/games/{gameId}/draft-team`
4. Collect user feedback (survey: "Does real-time visibility help your strategy?")
5. Consider Supabase Realtime upgrade if users request faster updates

---

## Resources

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/api.md](./contracts/api.md)
- **Tasks**: [tasks.md](./tasks.md) (generated by /speckit.tasks)

