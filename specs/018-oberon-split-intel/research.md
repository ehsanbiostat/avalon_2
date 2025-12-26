# Research: Oberon Split Intel Mode

**Feature**: 018-oberon-split-intel
**Date**: 2025-12-26

## Research Topics

### 1. Reuse of Existing Merlin Split Intel Implementation

**Decision**: Reuse UI patterns and visibility logic from feature 011 (Merlin Split Intel)

**Findings**:
The existing Merlin Split Intel implementation provides:
- Two-group display UI in `RoleRevealModal.tsx`
- Visibility helper functions in `lib/domain/visibility.ts`
- Mutual exclusivity logic with Merlin Decoy Mode
- Database schema pattern for storing group assignments

**Files to Reference**:
- `src/components/RoleRevealModal.tsx` - Two-group display UI
- `src/lib/domain/visibility.ts` - `getSplitIntelVisibility()` function
- `src/lib/domain/role-config.ts` - Mutual exclusivity validation
- `supabase/migrations/014_merlin_split_intel.sql` - Schema pattern

**Rationale**: Maximizes code reuse; consistent UX for players familiar with Split Intel mode.

### 2. Prerequisite Validation Pattern

**Decision**: Use disabled state with tooltip for prerequisite validation (not blocking error)

**Findings**:
Existing patterns in `RoleConfigPanel.tsx`:
- Morgana requires Percival message (informational)
- Lady of the Lake toggle (standard boolean)

For Oberon Split Intel, we need a different pattern:
- Toggle should be **disabled** (not just warned) when Oberon Standard not selected
- Clear tooltip explaining why: "Requires Oberon (Standard) to be enabled"

**Rationale**: Prevents configuration errors; guides user to correct setup; better UX than post-submit validation.

### 3. Triple Mutual Exclusivity

**Decision**: Extend existing dual mutual exclusivity to include Oberon Split Intel

**Findings**:
Current mutual exclusivity (from 011):
- `merlin_decoy_enabled` ↔ `merlin_split_intel_enabled`

New mutual exclusivity:
- `merlin_decoy_enabled` ↔ `merlin_split_intel_enabled` ↔ `oberon_split_intel_enabled`

**Implementation**:
```typescript
// In role-config.ts validation
const intelModes = [
  config.merlin_decoy_enabled,
  config.merlin_split_intel_enabled,
  config.oberon_split_intel_enabled,
].filter(Boolean).length;

if (intelModes > 1) {
  errors.push('Only one intel mode can be active: Merlin Decoy, Split Intel, or Oberon Split Intel');
}
```

**Rationale**: Clear user guidance; avoids complex combined visibility logic.

### 4. Oberon Detection for Mixed Group

**Decision**: Find Oberon by querying player_roles with `special_role = 'oberon_standard'`

**Findings**:
When distributing groups, we need to:
1. Find Oberon's player ID from assignments
2. Place Oberon in mixed group (fixed, not random)
3. Place all other visible evil in Certain group

We don't need to store Oberon's ID separately because:
- Oberon is ALWAYS the evil player in mixed group for this mode
- We can always find Oberon from `player_roles` table
- Reduces schema changes

**Query Pattern**:
```typescript
const oberon = assignments.find(a => a.specialRole === 'oberon_standard');
```

**Rationale**: Simpler schema; Oberon is deterministic in this mode.

### 5. Edge Case: Only Oberon Visible (Mordred + Oberon)

**Decision**: Allow mode to work with empty Certain group

**Findings**:
Scenario: Room has Mordred (hidden) + Oberon Standard

Result:
- Certain Evil Group: **Empty** (no visible evil except Oberon)
- Mixed Intel Group: Oberon + random good player

This is valid and creates interesting gameplay:
- Merlin knows one of two players is Oberon
- Merlin has no certain evil information
- Mordred remains completely hidden

**UI Handling**:
- Show empty Certain group with message: "No certain evil players visible"
- Mixed group displays normally

**Rationale**: Edge case is rare but valid; provides unique gameplay variant.

### 6. Auto-Disable on Oberon Removal

**Decision**: Automatically disable Oberon Split Intel when Oberon Standard is removed

**Findings**:
User flow to handle:
1. User enables Oberon Standard
2. User enables Oberon Split Intel Mode
3. User disables Oberon Standard (or switches to Chaos)

Expected behavior:
- Oberon Split Intel should auto-disable
- Show notification: "Oberon Split Intel Mode disabled - requires Oberon (Standard)"

**Implementation**:
```typescript
// In RoleConfigPanel.tsx onChange handler for Oberon toggle
const handleOberonChange = (newOberonMode: OberonMode | undefined) => {
  const newConfig = { ...roleConfig, oberon: newOberonMode };

  // Auto-disable oberon split intel if Oberon Standard removed
  if (newOberonMode !== 'standard' && roleConfig.oberon_split_intel_enabled) {
    newConfig.oberon_split_intel_enabled = false;
    showNotification('Oberon Split Intel Mode disabled - requires Oberon (Standard)');
  }

  setRoleConfig(newConfig);
};
```

**Rationale**: Prevents invalid state; clear user feedback.

## Alternatives Considered

### Alternative 1: Store Oberon ID Separately
Store `oberon_split_intel_oberon_id` in games table.

**Rejected because**: Redundant - Oberon is always findable from player_roles and is deterministic in this mode.

### Alternative 2: Combine with Standard Split Intel
Add a "use Oberon" checkbox to standard Split Intel mode.

**Rejected because**: More complex UX; separate toggle is clearer.

### Alternative 3: Allow with Oberon Chaos
Show Oberon Chaos in mixed group even though hidden from Merlin.

**Rejected because**: Contradicts Oberon Chaos's core mechanic (hidden from Merlin). Would be confusing.

### Alternative 4: Block Mode When Only Oberon Visible
Require at least one other visible evil (Morgana/Assassin) for Certain group.

**Rejected because**: Edge case is valid gameplay; empty Certain group is acceptable.
