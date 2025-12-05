/**
 * GET /api/players/find-game
 * Find active game by nickname
 * Phase 6: Player Recovery & Reconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findActiveGameByNickname, findPlayerByNickname } from '@/lib/supabase/players';
import { getConnectionStatus } from '@/lib/domain/connection-status';
import { validateNickname } from '@/lib/domain/nickname-validation';
import type { FindGameResponse } from '@/types/player';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      const response: FindGameResponse = {
        found: false,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate nickname format
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      const response: FindGameResponse = {
        found: false,
      };
      return NextResponse.json(response);
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find active game
    const gameInfo = await findActiveGameByNickname(supabase, nickname.trim());

    if (!gameInfo) {
      const response: FindGameResponse = {
        found: false,
      };
      return NextResponse.json(response);
    }

    // Get player's connection status
    const player = await findPlayerByNickname(supabase, nickname.trim());
    let canReclaim = false;
    let gracePeriodRemaining: number | undefined;

    if (player) {
      const status = getConnectionStatus(player.last_activity_at);
      canReclaim = status.can_be_reclaimed;
      if (!status.is_connected && status.grace_period_remaining !== null) {
        gracePeriodRemaining = Math.ceil(status.grace_period_remaining);
      }
    }

    const response: FindGameResponse = {
      found: true,
      game: {
        room_code: gameInfo.room_code,
        room_id: gameInfo.room_id,
        status: gameInfo.status as 'waiting' | 'roles_distributed' | 'started',
        player_count: gameInfo.player_count,
        expected_players: gameInfo.expected_players,
        is_manager: gameInfo.is_manager,
        can_reclaim: canReclaim,
        grace_period_remaining: gracePeriodRemaining,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error finding game:', error);
    const response: FindGameResponse = {
      found: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
