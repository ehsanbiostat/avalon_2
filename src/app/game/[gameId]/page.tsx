'use client';

/**
 * Game Page
 * Main game play screen
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameBoard } from '@/components/game/GameBoard';
import { getPlayerId } from '@/lib/utils/player-id';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

interface PlayerRoleInfo {
  role: 'good' | 'evil';
  special_role?: string;
  player_db_id: string;
}

export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();
  const { gameId } = use(params);
  
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
        // First, get the game to find the room_id
        const gameResponse = await fetch(`/api/games/${gameId}`, {
          headers: { 'X-Player-ID': id },
        });
        
        if (!gameResponse.ok) {
          throw new Error('Failed to fetch game');
        }
        
        const { data: gameData } = await gameResponse.json();
        
        // Find current player
        const currentPlayer = gameData.players.find((p: { id: string }) => {
          // The game state includes players array
          return true; // We'll use the first match
        });

        // For now, we'll get role from the game state
        // The role info should come from the room's player_roles
        // This is a simplified approach - in a full implementation,
        // we'd have an endpoint to get the current player's role
        setPlayerRole({
          role: 'good', // Default - will be updated with actual role
          player_db_id: gameData.players[0]?.id || '',
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
        playerId={playerRole?.player_db_id || null}
        playerRole={playerRole?.role}
        specialRole={playerRole?.special_role}
      />
    </main>
  );
}

