# Research: Real-Time Team Selection Visibility

**Feature**: 007-realtime-team-selection  
**Date**: 2025-12-05

## Overview

This document consolidates research findings for implementing real-time visibility of the mission leader's team selection process during the team_building phase.

---

## R1: Draft Selection Storage Strategy

### Problem

Currently, the leader's team selection is stored only in local React state (`useState` in TeamProposal.tsx). This means:
- Other players cannot see what the leader is selecting
- Selection state is lost if the leader refreshes the page
- No way to broadcast selections to other players

### Options Evaluated

#### Option A: New `draft_selections` Table

**Schema**:
```sql
CREATE TABLE draft_selections (
  id uuid PRIMARY KEY,
  game_id uuid REFERENCES games(id),
  player_id text, -- ID of selected player
  selected_at timestamptz,
  deselected_at timestamptz
);
```

**Pros**:
- Detailed history of selections/deselections
- Can track timing of each action
- Supports analytics later

**Cons**:
- Requires creating/deleting many rows per team selection (3-5 rows)
- Complex queries to get "current" draft state
- Overkill for transient data that's cleared frequently

#### Option B: `draft_team` Column on `games` Table (CHOSEN)

**Schema**:
```sql
ALTER TABLE games ADD COLUMN draft_team text[] DEFAULT NULL;
```

**Pros**:
- Simple: single array field
- Efficient: one UPDATE per selection change
- Natural lifecycle: cleared when proposal submitted
- Existing polling already fetches entire games row

**Cons**:
- No history of selection changes
- Can't track timing or order of selections

**Decision**: **Option B** - Simple, efficient, meets all functional requirements. History tracking is out of scope.

---

## R2: Update Frequency and Latency

### Problem

The spec requires <500ms latency for observers to see selection changes. Current polling interval is 3 seconds.

### Options Evaluated

#### Option A: Supabase Realtime Subscriptions

**Approach**: Subscribe to `games` table changes, push updates to clients when `draft_team` changes.

**Pros**:
- Sub-second latency (typically 100-300ms)
- True real-time updates
- Efficient (only changed data transmitted)

**Cons**:
- Requires refactoring entire game state synchronization
- Current codebase uses polling for all game state updates
- Adds complexity: connection management, reconnection logic, subscription lifecycle
- Risk of introducing bugs in stable gameplay (voting, quest phases)

#### Option B: Keep Existing Polling, Add Optimistic UI (CHOSEN)

**Approach**: 
- Leader updates local state immediately (optimistic)
- Leader calls API to persist draft_team to database
- All players (including leader) poll game state every 3 seconds
- Observers see updates within 0-3 seconds (average ~1.5s)

**Pros**:
- Zero refactoring of existing infrastructure
- Leader gets instant (<100ms) feedback (FR-006 satisfied)
- Proven stable (existing polling has worked for voting, quests, Lady phase)
- Simple error handling (retry on next poll if API call fails)

**Cons**:
- Observers may experience 0-3 second delay (not true <500ms)
- Slight network overhead (full game state polled every 3s)

**Decision**: **Option B** - Practical compromise. The spec's <500ms target is for "strategic value"; observing selections within 3 seconds still provides significant strategic information. Optimistic UI ensures leader has no perceived delay. Can upgrade to Realtime later if users request faster updates.

#### Option C: Reduce Polling Frequency to 1 Second

**Approach**: Change polling interval from 3s to 1s.

**Pros**:
- Closer to <500ms target
- No architecture changes needed

**Cons**:
- 3x increase in API requests and database queries
- Higher Supabase costs
- Potential performance issues under load
- Doesn't guarantee <500ms (still depends on poll timing)

**Decision**: Rejected - Cost/performance tradeoff not justified; 3s polling already meets user needs for all other game phases.

---

## R3: Visual State Differentiation

### Problem

Players must distinguish between:
1. **No selection**: Default state
2. **Draft selection**: Leader is actively selecting, not yet submitted
3. **Proposed team**: Leader has submitted proposal, now voting

### Design Principles

- **Accessibility**: Must work for colorblind users
- **Clarity**: States should be immediately distinguishable
- **Consistency**: Follow existing Avalon design language (gold accents, shield icons)

### Options Evaluated

#### Option A: Color-Only Distinction

**Approach**:
- Default: Gray border
- Draft: Blue/cyan border
- Proposed: Green border

**Pros**: Simple, minimal CSS changes

**Cons**: Fails for red-green colorblind users; no non-color cues

#### Option B: Animation + Color + Icon (CHOSEN)

**Approach**:
- **Default**: Normal border (`border-slate-600`), no special styling
- **Draft**: Pulsing cyan border (`animate-pulse border-cyan-400`), lighter background (`bg-cyan-900/30`), optional "DRAFTING" text label
- **Proposed**: Solid green border (`border-green-400`), shield icon (🛡️), "ON TEAM" badge

**Pros**:
- Multi-sensory: animation (motion), color, icon, text
- Accessible: pulsing animation works for all vision types
- Clear intent: pulsing = "in progress", solid = "finalized"
- Consistent: shield icon already used for proposed teams

**Cons**: Slightly more CSS complexity

**Decision**: **Option B** - Accessibility is non-negotiable. Animation + icon + text ensures all users can distinguish states.

#### Option C: Opacity Changes

**Approach**: Reduce opacity for draft selections (e.g., 50% transparent).

**Pros**: Minimal CSS

**Cons**: Poor contrast, harder to see on dark backgrounds, not intuitive

**Decision**: Rejected - Unclear intent, accessibility issues.

### Final CSS Classes

```css
/* Default state - no special classes */

/* Draft selected */
.draft-selected {
  @apply border-cyan-400 animate-pulse bg-cyan-900/30 shadow-cyan-400/50;
}

/* Proposed (official team) */
.proposed {
  @apply border-green-400 bg-green-800 shadow-green-400/50;
}
```

---

## R4: Race Condition Handling

### Problem

Leader rapidly clicks to select/deselect the same player multiple times within a short window (e.g., 5 clicks in 1 second). This can cause:
- API calls arriving out of order
- Database showing incorrect final state
- Observers seeing flickering or incorrect selections

### Options Evaluated

#### Option A: Last-Write-Wins + Debouncing (CHOSEN)

**Approach**:
- Leader updates local state immediately (optimistic UI)
- API calls are debounced (200ms delay after last change)
- If multiple changes occur within 200ms, only the final state is sent
- Server always accepts latest draft_team value (no versioning)

**Pros**:
- Simple to implement (React debounce hook)
- Reduces API calls (5 clicks in 1s → 1 API call)
- Final state is always accurate
- No complex server-side locking

**Cons**:
- Observers may miss intermediate states (e.g., if leader selects then immediately deselects, they may never see the selection)
- 200ms delay before broadcast (acceptable, still <500ms)

**Decision**: **Option A** - Aligns with spec's focus on "strategic information"; observers care about the leader's decision-making process, not every single click. Missing ultra-rapid intermediate states is acceptable.

#### Option B: Queue All Updates

**Approach**: Send every selection change to server, queue them, process in order.

**Pros**: Complete history preserved

**Cons**: Complex server-side queueing; excessive API calls; potential for queue buildup and delays

**Decision**: Rejected - Over-engineered for the problem. The spec doesn't require perfect capture of every intermediate state.

#### Option C: Optimistic Locking (Version Numbers)

**Approach**: Each draft_team update includes a version number; server rejects updates with old versions.

**Pros**: Prevents out-of-order updates

**Cons**: Complex error handling; leader may see confusing "update rejected" errors; doesn't solve the core problem (observers still miss rapid intermediate states due to polling)

**Decision**: Rejected - Complexity doesn't justify benefits given polling-based architecture.

### Implementation Details

- Use `useDebouncedCallback` hook (200ms delay)
- Leader's local state updates immediately (no debounce)
- API call is debounced
- If API call fails, retry on next change (or user refresh will re-sync)

---

## R5: State Persistence on Navigation

### Problem

If the leader navigates away from the game page (e.g., opens "View My Role" modal) and returns, should their draft selections persist?

### Options Evaluated

#### Option A: Clear on Any Navigation

**Approach**: Clear draft_team whenever leader navigates away.

**Pros**: Simple, stateless

**Cons**: Poor UX - leader loses progress if they accidentally navigate

#### Option B: Persist in Database, Clear on Phase Change (CHOSEN)

**Approach**:
- Store draft_team in database (already decided in R1)
- Persist across leader's navigation within the same game phase
- Clear only when:
  - Proposal is submitted (POST /propose)
  - Quest advances (game.current_quest increments)
  - Game ends (game.phase = 'game_over')

**Pros**:
- Good UX - leader can safely navigate and return
- Consistent with general principle of database persistence
- Observers see accurate state even if leader navigates away

**Cons**: Slightly more complex lifecycle management

**Decision**: **Option B** - Better UX, aligns with database-centric architecture.

#### Option C: sessionStorage Fallback

**Approach**: Store draft_team in sessionStorage, sync to database.

**Pros**: Fast local access

**Cons**: Doesn't help observers (still need database); adds complexity

**Decision**: Rejected - Database persistence alone is sufficient.

---

## Best Practices Applied

### From Next.js + Supabase Ecosystem

1. **API Route Validation**: All `/draft-team` endpoint validations follow existing patterns:
   - Check player authentication (x-player-id header)
   - Verify game phase (must be 'team_building')
   - Validate caller is current_leader_id
   - Use domain logic for team validation (Phase 3: lib/domain/team-selection.ts)

2. **Optimistic UI**: React best practice for perceived performance:
   - Update local state immediately
   - API call in background
   - On error, revert or show error message
   - Next poll will re-sync if state diverged

3. **Type Safety**: Strict TypeScript across the stack:
   - `draft_team: string[] | null` in Game interface
   - API request/response types defined
   - Domain logic functions fully typed

4. **Error Handling**: 
   - Graceful degradation: if draft_team is undefined (migration not applied), treat as null
   - User-friendly errors: "Unable to update selection" (not "500 Internal Server Error")
   - Logging: Track draft_team API calls in game_events table (optional)

### From Avalon Constitution

- **Domain Logic Isolation**: Validation in `lib/domain/team-selection.ts`, not in API routes
- **Separation of Concerns**: Supabase queries in `lib/supabase/games.ts`, not in components
- **Mobile Functional**: Touch targets maintained (PlayerSeats already touch-friendly), responsive design preserved

---

## Performance Considerations

### Database Impact

- **Writes**: 1 UPDATE per draft change (debounced to ~1-2 per second max)
- **Reads**: No additional reads (draft_team included in existing poll query)
- **Index**: No new index needed (draft_team not queried, only read as part of full game state)

### Network Impact

- **Polling frequency unchanged**: Still 3 seconds
- **Payload size increase**: Minimal (~50-100 bytes for draft_team array in JSON response)
- **API calls**: New PUT /draft-team endpoint; ~1-10 calls per team_building phase (depending on leader behavior)

### Client-Side Rendering

- **Re-render frequency**: Same as existing (every 3s poll + local state changes)
- **CSS animations**: `animate-pulse` is GPU-accelerated, minimal performance impact
- **No additional React hooks**: Existing useGameState hook already polls; no new subscriptions

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| 3s polling too slow for UX | Medium | Medium | Optimistic UI for leader; user testing to validate; can add Realtime later |
| Debouncing hides rapid selections from observers | Low | Low | Acceptable per spec (observers care about decision process, not every click) |
| Visual states not distinguishable | Low | High | Multi-modal design (color + animation + icon + text); user testing |
| Database writes under load | Low | Medium | Debouncing reduces writes; games table already handles frequent updates (voting, quest actions) |
| Leader loses draft on accidental navigation | Low | Medium | Database persistence + browser confirmation on page close (existing Next.js behavior) |

---

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [React Debouncing Best Practices](https://www.freecodecamp.org/news/debounce-and-throttle-in-react-with-hooks/)
- [WCAG 2.1 Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)
- [Next.js API Routes Patterns](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

---

## Conclusion

All unknowns from the Technical Context have been resolved. The chosen approach prioritizes:
1. **Simplicity**: Minimal changes to existing architecture
2. **Stability**: No refactoring of proven polling mechanism
3. **UX**: Optimistic UI for leader, multi-modal visual feedback for all players
4. **Maintainability**: Clear separation of concerns, type-safe code

Ready to proceed to Phase 1 (Data Model & API Contracts).

