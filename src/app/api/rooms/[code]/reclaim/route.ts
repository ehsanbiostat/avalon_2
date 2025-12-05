/**
 * POST /api/rooms/[code]/reclaim
 * Reclaim a seat in a room after disconnect
 * Phase 6: Player Recovery & Reconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { reclaimSeat, findPlayerByPlayerId, findPlayerByNickname } from '@/lib/supabase/players';
import { findRoomByCode } from '@/lib/supabase/rooms';
import { getGameByRoomId } from '@/lib/supabase/games';
import { getConnectionStatus, RECLAIM_AFTER_SECONDS, DISCONNECT_AFTER_SECONDS } from '@/lib/domain/connection-status';
import { validateNickname } from '@/lib/domain/nickname-validation';
import type { ReclaimRequest, ReclaimSuccessResponse, ReclaimErrorResponse } from '@/types/player';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const playerId = request.headers.get('x-player-id');

    if (!playerId) {
      const response: ReclaimErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'Player ID is required',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json() as ReclaimRequest;
    const { nickname } = body;

    // Validate nickname
    if (!nickname) {
      const response: ReclaimErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'Nickname is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validation = validateNickname(nickname);
    if (!validation.valid) {
      const response: ReclaimErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: validation.errors[0],
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify room exists
    const room = await findRoomByCode(supabase, code);
    if (!room) {
      const response: ReclaimErrorResponse = {
        success: false,
        error: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Get the new player record (the one trying to reclaim)
    const newPlayer = await findPlayerByPlayerId(supabase, playerId);
    if (!newPlayer) {
      const response: ReclaimErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'Please register first',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Find the old player by nickname to check status before reclaim
    const oldPlayer = await findPlayerByNickname(supabase, nickname);
    if (oldPlayer) {
      const status = getConnectionStatus(oldPlayer.last_activity_at);

      // T055: Check if player is still active
      if (status.is_connected) {
        const response: ReclaimErrorResponse = {
          success: false,
          error: 'PLAYER_ACTIVE',
          message: 'This player is still active in the game',
          player_last_activity: oldPlayer.last_activity_at,
        };
        return NextResponse.json(response, { status: 409 });
      }

      // T056, T057: Check grace period
      if (status.grace_period_remaining !== null && status.grace_period_remaining > 0) {
        const response: ReclaimErrorResponse = {
          success: false,
          error: 'GRACE_PERIOD',
          message: `Please wait ${Math.ceil(status.grace_period_remaining)} seconds before reclaiming`,
          grace_period_remaining: Math.ceil(status.grace_period_remaining),
          player_last_activity: oldPlayer.last_activity_at,
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    // Attempt reclaim
    const result = await reclaimSeat(supabase, code, nickname.trim(), playerId);

    if (!result.success) {
      let message = 'Failed to reclaim seat';
      let gracePeriodRemaining: number | undefined;

      switch (result.error_code) {
        case 'PLAYER_NOT_FOUND':
          message = 'No player with this nickname found in this room';
          break;
        case 'PLAYER_ACTIVE':
          message = 'This player is still active in the game';
          break;
        case 'GRACE_PERIOD':
          message = 'Please wait a moment before reclaiming this seat';
          // Compute remaining grace period from the info we have
          if (oldPlayer) {
            const status = getConnectionStatus(oldPlayer.last_activity_at);
            gracePeriodRemaining = status.grace_period_remaining ?? 0;
          }
          break;
      }

      const response: ReclaimErrorResponse = {
        success: false,
        error: result.error_code || 'PLAYER_NOT_FOUND',
        message,
        grace_period_remaining: gracePeriodRemaining,
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Get game info if room has an active game
    let gameId: string | undefined;
    try {
      const game = await getGameByRoomId(supabase, room.id);
      if (game) {
        gameId = game.id;
      }
    } catch {
      // No game exists yet, that's OK
    }

    // Determine if new player is now the manager
    const isManager = result.old_player_id && room.manager_id === result.old_player_id;

    const response: ReclaimSuccessResponse = {
      success: true,
      room_id: result.room_id!,
      room_code: code.toUpperCase(),
      player: {
        id: newPlayer.id,
        nickname: newPlayer.nickname,
        is_manager: isManager || false,
      },
      game_id: gameId,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error reclaiming seat:', error);
    const response: ReclaimErrorResponse = {
      success: false,
      error: 'PLAYER_NOT_FOUND',
      message: 'Failed to reclaim seat. Please try again.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
