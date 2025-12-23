# Research: Player Indicators UI Improvement

**Feature**: 012-player-indicators-ui
**Date**: 2025-12-23

## Overview

This document captures research decisions for the player indicators UI refactor. Since this is a straightforward CSS/styling change within an existing component, the research scope is minimal.

---

## Decision 1: Color-Based State Indication

**Context**: Need to show team selection state without external badges.

**Decision**: Use avatar inner fill color to indicate team states.

**Rationale**:
- Colors are processed faster than shapes by human visual system
- Fill color change is more visible than small badge additions
- Eliminates overlap issues entirely for team states
- Consistent with modern UI patterns (Slack, Discord, Figma)

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Multiple badges | Causes overlap (current problem) |
| Border-only indication | Border already used for identity states |
| Gradient fills | Too complex, may reduce readability |
| Animated indicators | Distracting, accessibility concerns |

---

## Decision 2: Border for Identity States

**Context**: Need to show "You" (current player) and "Disconnected" states.

**Decision**: Use border color and thickness for identity states.

**Rationale**:
- Border is always visible regardless of fill color
- Thick amber border stands out among thin gray borders
- Red border for disconnect is universally understood
- Doesn't conflict with fill colors (orthogonal properties)

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Name highlight | Less visible at a glance |
| Avatar glow/shadow | May conflict with selection states |
| Badge on avatar | Adds to clutter, defeats purpose |

---

## Decision 3: Badge Position Strategy

**Context**: Need positions for Crown, Lady, and Vote badges that don't overlap.

**Decision**: Use 3 positions - top-center, bottom-right, bottom-left.

**Rationale**:
- Top-center crown is isolated, works well
- Bottom-right and bottom-left are on opposite sides
- Adjacent players' bottom badges don't face each other
- Mathematical verification: 50px gap between avatar edges, 12px badge extension = no overlap

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| All badges on one side | Stacking creates vertical clutter |
| Badges inside avatar | Obscures the letter initial |
| Rotating badge positions per player | Inconsistent, confusing |

---

## Decision 4: Color Palette Selection

**Context**: Need colors that are distinguishable and colorblind-friendly.

**Decision**: Use existing theme colors from `tailwind.config.ts`.

**Colors selected**:
- Sky blue (`bg-sky-700`, `#0369a1`) - Selected state
- Emerald green (`bg-emerald-700`, `#047857`) - Proposed team
- Amber gold (`border-amber-400`, `#fbbf24`) - Current player
- Red (`border-red-500`, `#ef4444`) - Disconnected
- Slate gray (`bg-slate-700`, `#334155`) - Default

**Rationale**:
- Theme already designed for colorblind accessibility (blue/orange primary contrast)
- Sky blue and emerald are distinguishable for deuteranopia/protanopia
- Amber and red have sufficient luminance contrast
- Consistent with existing UI language

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Purple for Lady holder | Adding color meanings increases cognitive load |
| Cyan for selected (current) | Sky blue provides better contrast |
| Orange for disconnect | Red is more universally understood for errors/warnings |

---

## Decision 5: Transition Animation

**Context**: State changes should feel smooth, not jarring.

**Decision**: Add `transition-all duration-300` to avatar container.

**Rationale**:
- 300ms is perceptible but not sluggish
- `transition-all` covers fill, border, and opacity changes
- Consistent with existing transition durations in codebase
- CSS-only, no JavaScript animation library needed

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| No transition | Jarring state changes |
| Framer Motion | Overkill for simple color transitions |
| Longer duration (500ms+) | Feels sluggish during rapid interactions |

---

## Technical Findings

### Current Implementation Analysis

**File**: `src/components/game/PlayerSeats.tsx`

**Current badge positions** (lines 247-294):
1. Crown 👑 - `-top-4 left-1/2` (top center) ✅ Keep
2. Disconnect ❌ - `-top-2 -left-2` (top left) ❌ Remove
3. Shield 🛡️ - `-top-2 -right-2` (top right) ❌ Remove
4. Checkmark ✓ - `-top-2 -right-2` (top right) ❌ Remove
5. Lady 🌊 - `-bottom-2 -left-3` (bottom left) → Move to bottom-right
6. Vote ✓ - `-bottom-2 -right-2` (bottom right) → Move to bottom-left

**Current fill colors** (lines 235-240):
```tsx
${isMe ? 'border-yellow-400 bg-yellow-900 text-yellow-200' : 'border-slate-400 bg-slate-700 text-slate-200'}
${player.is_leader ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-avalon-midnight' : ''}
${isProposed ? 'border-green-400 bg-green-800 text-green-200' : ''}
${inDraftSelection ? 'border-cyan-400 bg-cyan-900/30 text-cyan-100 animate-pulse shadow-lg shadow-cyan-400/50' : ''}
${selected ? 'border-cyan-300 bg-cyan-700 text-cyan-100 shadow-lg shadow-cyan-400/50' : ''}
```

**Observations**:
- Current code mixes fill and border in same conditional (needs separation)
- Leader ring already works well, keep as-is
- `animate-pulse` on draft selection can stay for leader's view
- `shadow-lg` effects are decorative, can remove for cleaner look

---

## Conclusion

All research questions resolved. Implementation can proceed with:
1. Separated fill/border color logic
2. Three strategic badge positions
3. Existing theme colors
4. Smooth CSS transitions

No external dependencies or complex patterns required.
