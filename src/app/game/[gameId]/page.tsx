'use client';

/**
 * Game Page
 * Main game play screen
 */

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { getPlayerId } from '@/lib/utils/player-id';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;

  // Redirect to home if not registered
  useEffect(() => {
    const id = getPlayerId();
    if (!id) {
      router.push('/');
    }
  }, [router]);

  // GameBoard handles all loading states internally
  return (
    <main className="min-h-screen bg-avalon-navy py-8 px-4">
      <GameBoard gameId={gameId} />
    </main>
  );
}
