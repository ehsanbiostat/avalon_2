# Quickstart Guide: Center Game Messages

**Feature**: 008-center-game-messages
**Date**: 2025-12-05
**Branch**: `008-center-game-messages`

## Overview

This guide provides step-by-step instructions for testing the Center Game Messages feature - replacing the static "ROUND TABLE" label with dynamic game status messages.

---

## Prerequisites

Before testing:

1. ✅ Local development environment running
   ```bash
   npm run dev
   # Server should be running on http://localhost:3000
   ```

2. ✅ Supabase instance configured
   - Environment variables set in `.env.local`
   - Database migrations applied

3. ✅ Browser developer tools ready
   - Chrome DevTools or equivalent
   - Console open for error monitoring

---

## Quick Start (5 Minutes)

### Scenario 1: Team Building Messages

**Goal**: Verify leader and non-leader see different messages during team selection.

**Steps**:
1. Open two browser windows (or incognito + normal)
2. **Window A** (Leader):
   - Create a new 5-player room
   - Add 4 other players (can use Window B)
   - Start the game
   - ✅ **Verify**: Center circle shows:
     - Line 1: "Quest 1"
     - Line 2: "Select 2 players for the quest"

3. **Window B** (Non-Leader):
   - Join the room from Window A
   - Wait for game to start
   - ✅ **Verify**: Center circle shows:
     - Line 1: "Quest 1"
     - Line 2: "[Leader Name] is selecting a team"

**Expected Outcome**: 
- Leader sees actionable instructions
- Other players see who is selecting
- Quest number is visible to all

---

### Scenario 2: Voting Phase Message

**Goal**: Verify all players see voting prompt.

**Steps**:
1. Continue from Scenario 1
2. Leader selects 2 players and proposes team
3. ✅ **Verify** (all players): Center circle shows:
   - Line 1: "Quest 1"
   - Line 2: "Vote on the proposed team"

**Expected Outcome**:
- All players see the same message
- Message updates immediately after proposal

---

### Scenario 3: Quest Execution Messages

**Goal**: Verify team members and observers see different messages.

**Steps**:
1. Continue from Scenario 2
2. All players vote (majority approve)
3. **For players ON the quest team**:
   - ✅ **Verify**: Center shows "Submit your quest action"
4. **For players NOT on the quest team**:
   - ✅ **Verify**: Center shows "Quest team is deciding..."

**Expected Outcome**:
- Team members know to act
- Observers see passive message

---

## Complete Test Matrix

### Test Coverage: All Game Phases

| # | Phase | Test Case | Expected Line 1 | Expected Line 2 | Pass/Fail |
|---|-------|-----------|------------------|-----------------|-----------|
| 1 | Team Building | Leader view | "Quest 1" | "Select [N] players for the quest" | ☐ |
| 2 | Team Building | Non-leader view | "Quest 1" | "[Name] is selecting a team" | ☐ |
| 3 | Voting | All players | "Quest 1" | "Vote on the proposed team" | ☐ |
| 4 | Quest | Team member | "Quest 1" | "Submit your quest action" | ☐ |
| 5 | Quest | Observer | "Quest 1" | "Quest team is deciding..." | ☐ |
| 6 | Quest Result | Success | "Quest 1" | "Quest succeeded!" | ☐ |
| 7 | Quest Result | Failure | "Quest 1" | "Quest failed!" | ☐ |
| 8 | Assassin | Is Assassin | "Assassin Phase" | "Select your target" | ☐ |
| 9 | Assassin | Not Assassin | "Assassin Phase" | "The Assassin is choosing..." | ☐ |
| 10 | Lady of Lake | Is holder | "Lady of the Lake" | "Select a player to investigate" | ☐ |
| 11 | Lady of Lake | Not holder | "Lady of the Lake" | "[Name] is investigating..." | ☐ |
| 12 | Game Over | Good wins | "Game Over" | "Good Wins!" | ☐ |
| 13 | Game Over | Evil wins | "Game Over" | "Evil Wins!" | ☐ |

---

## Edge Case Testing

### Test 1: Long Player Nicknames

**Goal**: Verify nicknames are truncated gracefully.

**Setup**:
```
Player nickname: "VeryLongPlayerNameThatWontFit" (30 characters)
```

**Steps**:
1. Create player with 25+ character nickname
2. Make them the leader
3. Start game (team building phase)
4. ✅ **Verify**: Non-leader sees:
   - "VeryLongPlayerN... is selecting a team"
   - Name truncated to ~15 characters

**Expected**: No overflow, readable message

---

### Test 2: Quest Number Progression

**Goal**: Verify quest number updates correctly.

**Steps**:
1. Complete Quest 1 (any outcome)
2. ✅ **Verify**: Center now shows "Quest 2"
3. Complete Quest 2
4. ✅ **Verify**: Center now shows "Quest 3"
5. Repeat through Quest 5

**Expected**: Quest number always matches current quest

---

### Test 3: Rapid Phase Transitions

**Goal**: Verify no flickering or layout issues during fast phase changes.

**Steps**:
1. Use keyboard shortcuts or automate clicks to rapidly:
   - Propose team → Vote → Execute quest
2. ✅ **Verify**:
   - No flickering or blank center circle
   - Messages update smoothly
   - No console errors

**Expected**: Smooth transitions, no UI glitches

---

### Test 4: Missing/Invalid Data

**Goal**: Verify graceful handling of edge cases.

**Manual Testing** (requires code modification or dev tools):

| Scenario | Condition | Expected Fallback |
|----------|-----------|-------------------|
| Unknown phase | `game.phase = 'invalid'` | "Quest 1" / "Game in progress..." |
| Missing leader | `leader = null` | "Unknown is selecting a team" |
| Invalid quest | `current_quest = 0` | "Quest 1" / "[message]" |
| Missing team size | `questReq.size = undefined` | "Select team for the quest" |

**Note**: These scenarios are unlikely in production but good to verify defensive code works.

---

## Visual Validation

### Contrast & Readability Checklist

Use browser developer tools to verify:

1. **Contrast Ratio**:
   ```
   - Open DevTools → Inspect center text
   - Check computed contrast ratio
   - ✅ Verify: ≥ 4.5:1 (WCAG AA minimum)
   ```

2. **Font Sizes**:
   ```
   - Line 1: Should be text-lg (18px)
   - Line 2: Should be text-sm (14px)
   - ✅ Verify: Text is readable at normal viewing distance
   ```

3. **Layout**:
   ```
   - ✅ Both lines fit within circle (no overflow)
   - ✅ Text is horizontally centered
   - ✅ Text is vertically centered
   - ✅ No layout shift when message changes
   ```

---

## Mobile/Responsive Testing

### Mobile Viewport Test

**Steps**:
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
2. Select "iPhone 12 Pro" or similar (390x844)
3. Run through Scenarios 1-3 above
4. ✅ **Verify**:
   - Center circle is visible
   - Text is readable (no need to zoom)
   - All messages display correctly
   - Player positions adjust but center remains usable

**Expected**: Functional on mobile, though primary target is desktop.

---

## Performance Verification

### Update Latency Test

**Goal**: Verify messages update within 500ms of phase change.

**Steps**:
1. Open browser DevTools → Performance tab
2. Start recording
3. Trigger a phase change (e.g., propose team)
4. Stop recording
5. ✅ **Verify**: Time from state update to render < 500ms

**Expected**: Should be nearly instant (<100ms typically) since it's synchronous rendering.

---

## Regression Testing

### Ensure No Breaking Changes

**Checklist**:

- [ ] **Player selection still works**
  - Can click players during team building
  - Selected players show visual feedback
  - Proposal button enables when team complete

- [ ] **Player circle layout unchanged**
  - Players positioned correctly around circle
  - Crown shows on leader
  - Lady of Lake icon shows on holder
  - Disconnect indicators work

- [ ] **Existing features unaffected**
  - Voting works normally
  - Quest actions submit correctly
  - Game progression continues as expected

**Expected**: Feature is purely additive - no regression in existing functionality.

---

## Troubleshooting

### Issue: Center shows "Game in progress..." instead of specific message

**Possible Causes**:
1. Game phase is undefined or unknown
2. Component not receiving game state props

**Debug Steps**:
```javascript
// In browser console
console.log(game.phase);           // Should be 'team_building', 'voting', etc.
console.log(game.current_quest);   // Should be 1-5
console.log(players);              // Should have nickname for leader
```

**Fix**: Verify parent component (GameBoard) is passing game state correctly.

---

### Issue: Nickname shows as "Unknown"

**Possible Causes**:
1. Player data not loaded yet
2. Leader ID doesn't match any player

**Debug Steps**:
```javascript
const leader = players.find(p => p.id === game.current_leader_id);
console.log(leader);  // Should have a nickname property
```

**Fix**: Ensure players array includes leader with valid nickname.

---

### Issue: Text overflows circle

**Possible Causes**:
1. Message too long
2. Font size too large
3. Nickname not truncated

**Debug Steps**:
```javascript
// Check message lengths
console.log(message.line1.length);  // Should be < 25
console.log(message.line2.length);  // Should be < 40
```

**Fix**: Ensure nickname truncation logic is working (15 char max).

---

### Issue: Message doesn't update on phase change

**Possible Causes**:
1. Component not re-rendering
2. Polling not working
3. React memo preventing update

**Debug Steps**:
```javascript
// Check if game state is updating
console.log(game.phase);  // Should change when phase transitions
```

**Fix**: Verify useGameState hook is polling every 3 seconds and updating state.

---

## Success Criteria Validation

After completing all tests, verify these success criteria from the spec:

- [ ] **SC-001**: Players identify game state within 1 second ✅
  - *Test*: Ask test players "what phase is this?" - should answer immediately

- [ ] **SC-002**: 95% understand whose turn without explanation ✅
  - *Test*: Show non-leader screen, ask "whose turn is it?" - should say leader's name

- [ ] **SC-003**: Messages update within 500ms of phase changes ✅
  - *Test*: Performance tab measurement (see above)

- [ ] **SC-004**: 40% reduction in user confusion ✅
  - *Test*: Compare with old "ROUND TABLE" label - users should report clearer understanding

- [ ] **SC-005**: 4.5:1 contrast ratio maintained ✅
  - *Test*: DevTools accessibility checker (see above)

---

## Deployment Checklist

Before merging to main:

- [ ] All test matrix items pass
- [ ] Edge cases handled gracefully
- [ ] Visual validation complete
- [ ] Mobile/responsive testing done
- [ ] No regressions in existing features
- [ ] Performance meets target (<500ms updates)
- [ ] Accessibility requirements met
- [ ] No console errors or warnings

---

## Next Steps

After successful testing:

1. ✅ Complete `/speckit.tasks` to break work into tasks
2. ✅ Implement according to tasks
3. ✅ Deploy to staging environment
4. ✅ Re-run this quickstart guide on staging
5. ✅ Get user feedback (optional)
6. ✅ Deploy to production
7. ✅ Monitor for issues in first 24 hours

---

## Contact & Support

**Feature Owner**: [Your Name]
**Spec**: `specs/008-center-game-messages/spec.md`
**Plan**: `specs/008-center-game-messages/plan.md`
**Branch**: `008-center-game-messages`

For issues or questions, refer to spec documentation or create a GitHub issue.

