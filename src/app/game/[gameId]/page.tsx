'use client';

/**
 * Game Page
 * Main game play screen
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { getPlayerId } from '@/lib/utils/player-id';

interface PlayerRoleInfo {
  role: 'good' | 'evil';
  special_role?: string;
  player_db_id: string;
}

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRoleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = getPlayerId();
    if (!id) {
      router.push('/');
      return;
    }
    setPlayerId(id);
    
    // Fetch player's role info
    const fetchRoleInfo = async () => {
      try {
        const gameResponse = await fetch(`/api/games/${gameId}`, {
          headers: { 'X-Player-ID': id },
        });
        
        if (!gameResponse.ok) {
          throw new Error('Failed to fetch game');
        }
        
        const responseData = await gameResponse.json();
        const { current_player_id } = responseData;

        // Use the current_player_id from the API response
        setPlayerRole({
          role: 'good', // Default - will be updated with actual role
          player_db_id: current_player_id,
        });
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setLoading(false);
      }
    };
    
    fetchRoleInfo();
  }, [gameId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-avalon-navy flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-avalon-gold border-t-transparent mx-auto mb-4" />
          <p className="text-avalon-silver/80">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-avalon-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-avalon-gold text-avalon-navy rounded-lg font-bold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-avalon-navy py-8 px-4">
      <GameBoard
        gameId={gameId}
        playerRole={playerRole?.role}
        specialRole={playerRole?.special_role}
      />
    </main>
  );
}

