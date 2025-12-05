'use client';

/**
 * Game Page
 * Main game play screen
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { getPlayerId, hasPlayerId } from '@/lib/utils/player-id';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  const [isReady, setIsReady] = useState(false);

  // Redirect to home if not registered
  useEffect(() => {
    const id = getPlayerId();
    if (!id) {
      router.push('/');
    } else {
      setIsReady(true);
    }
  }, [router]);

  // T036: Activity heartbeat for disconnect detection
  useHeartbeat({ enabled: isReady && hasPlayerId() });

  // GameBoard handles all loading states internally
  return (
    <main className="min-h-screen bg-avalon-navy py-8 px-4">
      <GameBoard gameId={gameId} />
    </main>
  );
}
