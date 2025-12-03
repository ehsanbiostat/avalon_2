# Research: Avalon Online – MVP Lobby & Role Distribution

**Branch**: `001-avalon-mvp-lobby`
**Date**: 2025-12-02

This document captures technology decisions and research findings for the MVP implementation.

---

## 1. Authentication Approach

### Decision: Anonymous Players with localStorage UUID

**Rationale**:
- MVP requires minimal friction for players to join games
- No email/password flow needed for social gaming with friends
- localStorage UUID provides sufficient identity for:
  - Recognizing returning players within a session
  - Enabling rejoin after browser close (within grace period)
  - Preventing duplicate joins

**Alternatives Considered**:

| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Supabase Auth (email) | Persistent identity, security | High friction for casual play | Overkill for MVP; friends sharing room codes don't need accounts |
| Supabase Auth (anonymous) | Built-in, upgradeable | Requires Supabase Auth setup | Adds complexity; localStorage simpler for MVP |
| Session cookies only | Simple | Lost on browser close | Cannot support rejoin feature |

**Future Migration Path**:
- Add optional Supabase Auth in future phase
- Link localStorage UUID to authenticated account when user signs up
- Preserve game history across devices

---

## 2. Real-Time Technology

### Decision: Supabase Realtime with Postgres Changes

**Rationale**:
- Native integration with Supabase Postgres
- Row-level subscriptions fit room-scoped updates perfectly
- No additional infrastructure needed
- Built-in reconnection handling

**Implementation Pattern**:
```typescript
// Subscribe to room-specific changes
supabase
  .channel(`room:${roomCode}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  }, callback)
  .subscribe();
```

**Alternatives Considered**:

| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Polling (setInterval) | Simple, works everywhere | High latency, server load | Doesn't meet <2s requirement efficiently |
| WebSocket (custom) | Full control | Complex to implement, maintain | Reinventing wheel when Supabase provides it |
| Pusher/Ably | Proven reliability | Additional cost, vendor | Unnecessary with Supabase included |

**Fallback Strategy**:
- If Realtime subscriptions fail, fall back to polling every 2 seconds
- Monitor subscription health, reconnect on disconnect

---

## 3. Room Code Generation

### Decision: 6-Character Alphanumeric (Uppercase + Digits)

**Rationale**:
- Short enough to share verbally or via text
- Large enough keyspace: 36^6 = 2.1 billion combinations
- Excludes confusing characters (0/O, 1/I/L)
- Case-insensitive for user convenience

**Character Set**: `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 chars, excludes ambiguous)

**Collision Handling**:
- Generate code
- Check uniqueness against active rooms
- Retry if collision (extremely rare with 2B+ combinations)

**Alternatives Considered**:

| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| UUID | No collisions | Too long to share verbally | UX requirement for shareable codes |
| Sequential IDs | Simple | Guessable, security risk | Constitution requires non-guessable |
| 4-char codes | Very short | Only 1M combinations | Risk of collisions at scale |
| Words (e.g., "blue-cat-7") | Memorable | Longer, localization issues | Complexity; 6-char is sufficient |

---

## 4. State Management (Client)

### Decision: React Hooks + Supabase Subscriptions (No Global State Library)

**Rationale**:
- App state is primarily server-driven (Supabase is source of truth)
- Custom hooks (`useRoom`, `useLobby`, `usePlayer`) encapsulate data fetching + subscriptions
- Avoid unnecessary complexity of Redux/Zustand for MVP
- React Context only for truly global state (current player identity)

**Pattern**:
```typescript
// useRoom hook manages room data + subscription
function useRoom(roomCode: string) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchRoom(roomCode).then(setRoom);

    // Subscribe to changes
    const subscription = subscribeToRoom(roomCode, setRoom);
    return () => subscription.unsubscribe();
  }, [roomCode]);

  return room;
}
```

**Alternatives Considered**:

| Option | Pros | Cons | Rejected Because |
|--------|------|------|------------------|
| Redux | Predictable, devtools | Boilerplate, overkill | Server is source of truth; local state minimal |
| Zustand | Simple, lightweight | Another dependency | Hooks sufficient for MVP scope |
| React Query | Caching, refetch | Complexity for realtime | Supabase subscriptions handle updates |

---

## 5. Role Distribution Algorithm

### Decision: Fisher-Yates Shuffle + Predefined Ratios

**Rationale**:
- Fisher-Yates provides uniform random distribution
- Server-side execution ensures fairness (no client manipulation)
- Predefined ratios per player count match official Avalon rules

**Algorithm**:
```typescript
function distributeRoles(playerIds: string[], playerCount: number): RoleAssignment[] {
  const ratio = ROLE_RATIOS[playerCount]; // e.g., { good: 4, evil: 3 }

  // Create role array
  const roles = [
    ...Array(ratio.good).fill('good'),
    ...Array(ratio.evil).fill('evil')
  ];

  // Shuffle roles (Fisher-Yates)
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Assign to players
  return playerIds.map((id, i) => ({ playerId: id, role: roles[i] }));
}
```

**Role Ratios (from spec)**:
| Players | Good | Evil |
|---------|------|------|
| 5 | 3 | 2 |
| 6 | 4 | 2 |
| 7 | 4 | 3 |
| 8 | 5 | 3 |
| 9 | 6 | 3 |
| 10 | 6 | 4 |

---

## 6. Database Choice

### Decision: Supabase Postgres with RLS

**Rationale**:
- Constitution mandates Supabase
- Postgres provides ACID transactions for game state integrity
- RLS enforces security at database level (defense in depth)
- Realtime integration built-in

**RLS Strategy**:
- Players can only read their own role
- Room data readable by members only (except public listing of waiting rooms)
- Write operations go through API routes with service key for validation

---

## 7. Styling Approach

### Decision: Tailwind CSS with Minimal Custom Components

**Rationale**:
- Utility-first speeds up development
- No design system overhead for MVP
- Easy responsive design
- Constitution emphasizes "minimal, clean UI"

**Component Library**: None (custom components only)
- Avoids dependency bloat
- Full control over aesthetics
- Matches "clarity over flair" principle

---

## 8. Testing Strategy

### Decision: Vitest (Unit) + Playwright (E2E)

**Rationale**:
- Vitest: Fast, TypeScript-native, works with Next.js
- Playwright: Reliable browser automation, good for real-time testing
- Focus on critical paths per constitution

**Test Priorities**:
1. Unit: Role distribution logic (pure function, easy to test)
2. Unit: Room state transitions (pure function)
3. E2E: Create room → join → distribute → confirm → start

**Test Environment**:
- Unit tests: Mock Supabase client
- E2E tests: Use Supabase test project or local Supabase

---

## 9. Error Handling Strategy

### Decision: Centralized Error Types + User-Friendly Messages

**Rationale**:
- Constitution requires clear, non-technical user errors
- Technical errors logged server-side
- Consistent error shape across API

**Error Response Shape**:
```typescript
interface ApiError {
  error: {
    code: string;        // e.g., "ROOM_FULL"
    message: string;     // User-friendly: "This room is full."
    details?: unknown;   // Technical details (logged, not shown)
  }
}
```

**Error Codes**:
| Code | User Message |
|------|--------------|
| `ROOM_NOT_FOUND` | "Room not found. Please check the code." |
| `ROOM_FULL` | "This room is full." |
| `ROOM_NOT_WAITING` | "This room is no longer accepting players." |
| `NOT_ROOM_MEMBER` | "You are not a member of this room." |
| `NOT_ROOM_MANAGER` | "Only the room manager can do this." |
| `NICKNAME_TAKEN` | "This nickname is already taken in this room." |
| `ROLES_ALREADY_DISTRIBUTED` | "Roles have already been distributed." |
| `NOT_ALL_CONFIRMED` | "Not all players have confirmed their roles." |

---

## 10. Deployment Strategy

### Decision: Vercel + Supabase Cloud

**Rationale**:
- Constitution mandates Vercel for Next.js
- Supabase Cloud provides managed Postgres + Realtime
- Zero-config deployment with Git integration

**Environment Separation**:
- Development: Local Next.js + Supabase project (dev)
- Preview: Vercel preview deployments + Supabase project (staging)
- Production: Vercel production + Supabase project (prod)

**CI/CD**:
- Push to feature branch → Vercel preview
- Merge to main → Vercel production
- Database migrations: Manual for MVP (Supabase dashboard or CLI)
