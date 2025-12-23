# Quickstart: Player Indicators UI Improvement

**Feature**: 012-player-indicators-ui
**Time Estimate**: 1-2 hours

## Prerequisites

- Development environment running (`npm run dev`)
- Game with 5+ players available for testing
- Understanding of current `PlayerSeats.tsx` structure

## Implementation Steps

### Step 1: Refactor Fill Color Logic

**File**: `src/components/game/PlayerSeats.tsx`

Replace the current mixed fill/border logic with separated concerns:

```tsx
// Before (lines 235-240) - Mixed logic
${isMe ? 'border-yellow-400 bg-yellow-900 text-yellow-200' : 'border-slate-400 bg-slate-700 text-slate-200'}
${isProposed ? 'border-green-400 bg-green-800 text-green-200' : ''}
${selected ? 'border-cyan-300 bg-cyan-700 text-cyan-100 shadow-lg shadow-cyan-400/50' : ''}

// After - Separated fill color (team state)
const getFillColor = () => {
  if (isDisconnected) return 'bg-slate-800';
  if (selected || inDraftSelection) return 'bg-sky-700';
  if (isProposed) return 'bg-emerald-700';
  return 'bg-slate-700';
};

// After - Separated border color (identity state)
const getBorderColor = () => {
  if (isDisconnected) return 'border-red-500';
  if (isMe) return 'border-amber-400 border-4';
  if (selected || inDraftSelection) return 'border-sky-400';
  if (isProposed) return 'border-emerald-400';
  return 'border-slate-400';
};

// After - Text color based on fill
const getTextColor = () => {
  if (selected || inDraftSelection) return 'text-sky-100';
  if (isProposed) return 'text-emerald-100';
  if (isMe) return 'text-amber-200';
  return 'text-slate-200';
};
```

### Step 2: Update Avatar className

Replace the current className template:

```tsx
// After refactor
<div
  className={`
    w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold
    transition-all duration-300
    ${getFillColor()}
    ${getBorderColor()}
    ${getTextColor()}
    ${player.is_leader ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-avalon-midnight' : ''}
    ${isDisconnected ? 'grayscale opacity-60' : ''}
    ${inDraftSelection && selectable ? 'animate-pulse shadow-lg shadow-cyan-400/50' : ''}
  `}
  style={{ borderWidth: isMe ? '4px' : '3px' }}
>
```

### Step 3: Remove Obsolete Badges

Delete these badge sections (approximately lines 261-294):

```tsx
// DELETE: Disconnect badge (top-left)
{isDisconnected && (
  <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full ...">
    ...
  </div>
)}

// DELETE: Shield badge (top-right)
{isProposed && !selected && !inDraftSelection && (
  <div className="absolute -top-2 -right-2 text-xl">🛡️</div>
)}

// DELETE: Checkmark badge (top-right)
{(selected || inDraftSelection) && (
  <div className="absolute -top-2 -right-2 w-7 h-7 ...">✓</div>
)}
```

### Step 4: Add New Badge Positions

Add updated Lady and Vote badges:

```tsx
// KEEP: Crown for leader (unchanged position)
{player.is_leader && (
  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">
    👑
  </div>
)}

// UPDATED: Lady of the Lake - bottom RIGHT
{hasLady && (
  <div
    className="absolute -bottom-2 -right-3 text-xl"
    title="Lady of the Lake"
  >
    🌊
  </div>
)}

// UPDATED: Vote indicator - bottom LEFT
{player.has_voted && (
  <div
    className="absolute -bottom-2 -left-3 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold"
    title="Has voted"
  >
    ✓
  </div>
)}
```

### Step 5: Update Name Styling

Simplify name color logic:

```tsx
// Before
<span className={`
  mt-3 text-base font-semibold whitespace-nowrap
  ${isMe ? 'text-yellow-300 font-bold' : 'text-slate-100'}
  ${isDisconnected ? 'text-red-400' : ''}
  ${inDraftSelection ? 'text-cyan-300' : ''}
  ${isProposed && !inDraftSelection ? 'text-green-300' : ''}
`}>

// After
<span className={`
  mt-3 text-base font-semibold whitespace-nowrap
  ${isDisconnected ? 'text-red-400' : isMe ? 'text-amber-300 font-bold' : 'text-slate-100'}
`}>
```

## Testing Checklist

### Visual Verification

1. **Default state**: Gray fill, gray border
2. **Current player (You)**: Gray fill, thick amber border
3. **Selected by leader**: Blue fill, blue border
4. **On proposed team**: Green fill, green border
5. **Leader**: Gray fill + amber ring + crown
6. **Lady holder**: Badge at bottom-right
7. **Has voted**: Badge at bottom-left
8. **Disconnected**: Dark gray + red border + grayscale

### Combination States

Test these multi-state scenarios:
- [ ] You + Leader + On Team → Green fill, amber border, crown
- [ ] You + Lady + Selected → Blue fill, amber border, Lady badge
- [ ] Disconnected + On Team → Should show disconnected (priority)
- [ ] Leader + Lady + Voted → Crown, Lady badge, Vote badge (all 3)

### 10-Player Game

- [ ] Load a 10-player game
- [ ] Verify no badge overlap between adjacent players
- [ ] Test with Lady holder next to Voted player

### Mobile Viewport

- [ ] Test at 375px width
- [ ] Verify badges are still visible
- [ ] Verify colors are distinguishable

## Common Issues

### Issue: Fill color not changing
**Solution**: Check state priority order - `selected` should override `isProposed`

### Issue: Border too thin for "You"
**Solution**: Add `border-4` class or use inline style `borderWidth: '4px'`

### Issue: Badges still overlapping
**Solution**: Verify positions are `-right-3` and `-left-3` (not `-right-2`/`-left-2`)

### Issue: Grayscale not applying to disconnected
**Solution**: Ensure `grayscale` class is in the same className template as fill color

## Files Modified

| File | Changes |
|------|---------|
| `src/components/game/PlayerSeats.tsx` | Refactor indicator system |

## Rollback

If issues arise, revert the single file:
```bash
git checkout HEAD~1 -- src/components/game/PlayerSeats.tsx
```
