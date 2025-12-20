# Quickstart: Endgame Merlin Quiz

**Feature**: 010-endgame-merlin-quiz
**Date**: 2025-12-20

## Overview

This guide provides a quick reference for implementing the Endgame Merlin Quiz feature. Follow the phases in order for best results.

## Prerequisites

- [ ] Feature 003 (Quest System) complete
- [ ] Feature 008 (Assassin Phase) complete
- [ ] Local Supabase running or access to project
- [ ] Branch `010-endgame-merlin-quiz` checked out

## Phase 1: Database Setup

### 1.1 Create Migration

Create `supabase/migrations/013_merlin_quiz.sql`:

```sql
-- See data-model.md for complete migration SQL
CREATE TABLE merlin_quiz_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  voter_player_id UUID NOT NULL REFERENCES players(id),
  suspected_player_id UUID REFERENCES players(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, voter_player_id)
);

CREATE INDEX idx_quiz_votes_game_id ON merlin_quiz_votes(game_id);

ALTER TABLE merlin_quiz_votes ENABLE ROW LEVEL SECURITY;
-- Add RLS policies (see data-model.md)
ALTER PUBLICATION supabase_realtime ADD TABLE merlin_quiz_votes;
```

### 1.2 Run Migration

```bash
# Local
npx supabase migration up

# Or via Supabase dashboard
# SQL Editor → Run migration SQL
```

### 1.3 Update Types

Add to `src/types/game.ts`:

```typescript
export interface MerlinQuizVote {
  id: string;
  game_id: string;
  voter_player_id: string;
  suspected_player_id: string | null;
  submitted_at: string;
}

export interface MerlinQuizState {
  quiz_enabled: boolean;
  quiz_active: boolean;
  quiz_complete: boolean;
  my_vote: string | null;
  has_voted: boolean;
  votes_submitted: number;
  total_players: number;
  connected_players: number;
  quiz_started_at: string | null;
  timeout_seconds: number;
}

export interface MerlinQuizResultEntry {
  player_id: string;
  nickname: string;
  vote_count: number;
  is_most_voted: boolean;
  is_actual_merlin: boolean;
}
```

## Phase 2: Domain Logic

### 2.1 Create Quiz Logic

Create `src/lib/domain/merlin-quiz.ts`:

```typescript
import type { MerlinQuizVote, MerlinQuizResultEntry } from '@/types/game';

export const QUIZ_TIMEOUT_SECONDS = 60;

export function canShowQuiz(hasMerlin: boolean): boolean {
  return hasMerlin;
}

export function isQuizComplete(
  votesSubmitted: number,
  connectedPlayers: number,
  quizStartedAt: string | null
): boolean {
  if (!quizStartedAt) return false;
  
  // All connected players voted
  if (votesSubmitted >= connectedPlayers) return true;
  
  // Timeout reached
  const startTime = new Date(quizStartedAt).getTime();
  const elapsed = (Date.now() - startTime) / 1000;
  return elapsed >= QUIZ_TIMEOUT_SECONDS;
}

export function calculateQuizResults(
  votes: MerlinQuizVote[],
  players: { id: string; nickname: string }[],
  merlinId: string
): MerlinQuizResultEntry[] {
  // Count votes per player
  const voteCounts = new Map<string, number>();
  players.forEach(p => voteCounts.set(p.id, 0));
  
  votes.forEach(vote => {
    if (vote.suspected_player_id) {
      const current = voteCounts.get(vote.suspected_player_id) || 0;
      voteCounts.set(vote.suspected_player_id, current + 1);
    }
  });
  
  // Find max vote count
  const maxVotes = Math.max(...voteCounts.values());
  
  return players.map(player => ({
    player_id: player.id,
    nickname: player.nickname,
    vote_count: voteCounts.get(player.id) || 0,
    is_most_voted: voteCounts.get(player.id) === maxVotes && maxVotes > 0,
    is_actual_merlin: player.id === merlinId
  })).sort((a, b) => b.vote_count - a.vote_count);
}
```

### 2.2 Create Database Functions

Create `src/lib/supabase/merlin-quiz.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MerlinQuizVote } from '@/types/game';

export async function submitQuizVote(
  client: SupabaseClient,
  gameId: string,
  voterId: string,
  suspectedId: string | null
): Promise<MerlinQuizVote> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .insert({
      game_id: gameId,
      voter_player_id: voterId,
      suspected_player_id: suspectedId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getQuizVotes(
  client: SupabaseClient,
  gameId: string
): Promise<MerlinQuizVote[]> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .select('*')
    .eq('game_id', gameId);

  if (error) throw error;
  return data || [];
}

export async function getPlayerQuizVote(
  client: SupabaseClient,
  gameId: string,
  playerId: string
): Promise<MerlinQuizVote | null> {
  const { data, error } = await client
    .from('merlin_quiz_votes')
    .select('*')
    .eq('game_id', gameId)
    .eq('voter_player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
```

## Phase 3: API Endpoints

### 3.1 Create Quiz Vote Endpoint

Create `src/app/api/games/[gameId]/merlin-quiz/route.ts`:

```typescript
// POST: Submit vote
// GET: Get quiz state
// See contracts/api.md for full implementation
```

### 3.2 Create Results Endpoint

Create `src/app/api/games/[gameId]/merlin-quiz/results/route.ts`:

```typescript
// GET: Get quiz results
// See contracts/api.md for full implementation
```

## Phase 4: UI Components

### 4.1 Create Quiz Component

Create `src/components/game/MerlinQuiz.tsx`:

```typescript
interface MerlinQuizProps {
  gameId: string;
  players: { id: string; nickname: string }[];
  currentPlayerId: string;
  onQuizComplete: () => void;
}

// Player selection grid
// Submit/Skip buttons
// Vote progress counter
// Timeout countdown
```

### 4.2 Create Results Component

Create `src/components/game/MerlinQuizResults.tsx`:

```typescript
interface MerlinQuizResultsProps {
  results: MerlinQuizResultEntry[];
  actualMerlinNickname: string;
  onProceed: () => void;
}

// Results table with vote counts
// Highlight most-voted and actual Merlin
// "Show Roles" button
```

### 4.3 Update GameOver Component

Update `src/components/game/GameOver.tsx`:

1. Check if Merlin was in game
2. Add quiz state: `'quiz_active' | 'quiz_complete' | 'no_quiz'`
3. Show MerlinQuiz when active
4. Show MerlinQuizResults when complete
5. Show Role Reveal after quiz (or directly if no quiz)

## Phase 5: Testing

### 5.1 Unit Tests

Create `tests/unit/domain/merlin-quiz.test.ts`:

```typescript
describe('merlin-quiz', () => {
  describe('canShowQuiz', () => {
    it('returns true when Merlin exists', () => {});
    it('returns false when no Merlin', () => {});
  });

  describe('isQuizComplete', () => {
    it('returns true when all connected voted', () => {});
    it('returns true when timeout reached', () => {});
    it('returns false when votes pending and no timeout', () => {});
  });

  describe('calculateQuizResults', () => {
    it('counts votes correctly', () => {});
    it('identifies most-voted player', () => {});
    it('handles ties', () => {});
    it('marks actual Merlin', () => {});
  });
});
```

### 5.2 Integration Test Scenarios

1. **Happy Path**: Game ends → Quiz appears → All vote → Results → Role reveal
2. **Timeout Path**: Game ends → Quiz appears → Timeout → Results → Role reveal
3. **No Merlin**: Game ends without Merlin → No quiz → Direct role reveal
4. **Skip Path**: Game ends → Some skip → Complete → Results show skipped count

## Verification Checklist

- [ ] Migration runs without errors
- [ ] Types compile correctly
- [ ] Domain logic has unit tests
- [ ] API endpoints return correct responses
- [ ] Quiz appears only at game_over phase
- [ ] Quiz never appears during Assassin phase
- [ ] Self-voting is prevented
- [ ] Timeout works correctly
- [ ] Results display vote counts
- [ ] Real-time updates work
- [ ] Mobile responsive

## Common Issues

### Quiz not appearing
- Check `has_merlin` flag in game state API
- Verify player_roles has entry with `special_role = 'merlin'`

### Duplicate vote error
- Unique constraint violation - check if player already voted
- Show "already voted" state in UI

### Timeout not triggering
- Verify `quiz_started_at` is being set
- Check client-side timer logic

### Real-time not updating
- Verify `supabase_realtime` publication includes `merlin_quiz_votes`
- Check channel subscription filter

