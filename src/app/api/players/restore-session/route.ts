/**
 * POST /api/players/restore-session
 * Restore a session for a disconnected player without requiring prior registration.
 * Phase 6: Player Recovery & Reconnection
 *
 * This endpoint allows a player on a new device/browser to reclaim their
 * existing identity by returning their original player ID for localStorage storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateNickname } from '@/lib/domain/nickname-validation';
import { getConnectionStatus, DISCONNECT_AFTER_SECONDS, RECLAIM_AFTER_SECONDS } from '@/lib/domain/connection-status';

interface RestoreSessionRequest {
  nickname: string;
  room_code: string;
}

interface RestoreSuccessResponse {
  success: true;
  player_id: string;
  nickname: string;
  room_code: string;
  room_id: string;
  game_id?: string;
  is_manager: boolean;
}

interface RestoreErrorResponse {
  success: false;
  error: 'INVALID_INPUT' | 'PLAYER_NOT_FOUND' | 'PLAYER_ACTIVE' | 'GRACE_PERIOD' | 'SERVER_ERROR';
  message: string;
  grace_period_remaining?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RestoreSessionRequest;
    const { nickname, room_code } = body;

    // Validate inputs
    if (!nickname || !room_code) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'INVALID_INPUT',
        message: 'Nickname and room code are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const validation = validateNickname(nickname.trim());
    if (!validation.valid) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'INVALID_INPUT',
        message: validation.errors[0],
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, code, manager_id, status')
      .eq('code', room_code.toUpperCase())
      .single();

    if (roomError || !room) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'Room not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check room is not expired/finished
    if (room.status === 'expired' || room.status === 'finished') {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'This room is no longer active',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Find the player by nickname in this room
    const { data: roomPlayer, error: rpError } = await supabase
      .from('room_players')
      .select(`
        id,
        player_id,
        players!inner (
          id,
          player_id,
          nickname,
          last_activity_at
        )
      `)
      .eq('room_id', room.id)
      .ilike('players.nickname', nickname.trim())
      .single();

    if (rpError || !roomPlayer) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
        message: 'No player with this nickname found in this room',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Type assertion for the joined player data
    const player = roomPlayer.players as unknown as {
      id: string;
      player_id: string;
      nickname: string;
      last_activity_at: string | null;
    };

    // Check connection status
    const status = getConnectionStatus(player.last_activity_at || new Date(0).toISOString());

    // If player is still active, they should use their original session
    if (status.is_connected) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'PLAYER_ACTIVE',
        message: `This player is still active. If this is you, please wait ${DISCONNECT_AFTER_SECONDS} seconds and try again.`,
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Check grace period
    if (status.grace_period_remaining !== null && status.grace_period_remaining > 0) {
      const response: RestoreErrorResponse = {
        success: false,
        error: 'GRACE_PERIOD',
        message: `Please wait ${Math.ceil(status.grace_period_remaining)} seconds before restoring`,
        grace_period_remaining: Math.ceil(status.grace_period_remaining),
      };
      return NextResponse.json(response, { status: 409 });
    }

    // Update player's last_activity_at to mark them as reconnected
    const { error: updateError } = await supabase
      .from('players')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', player.id);

    if (updateError) {
      console.error('Error updating player activity:', updateError);
      const response: RestoreErrorResponse = {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Failed to restore session. Please try again.',
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Check if there's an active game for this room
    let gameId: string | undefined;
    try {
      const { data: game } = await supabase
        .from('games')
        .select('id')
        .eq('room_id', room.id)
        .in('status', ['in_progress', 'team_building', 'voting', 'quest', 'quest_result', 'lady_of_lake', 'assassin'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (game) {
        gameId = game.id;
      }
    } catch {
      // No active game, that's OK
    }

    // Return the player's ID for localStorage storage
    const response: RestoreSuccessResponse = {
      success: true,
      player_id: player.player_id, // This is the localStorage UUID
      nickname: player.nickname,
      room_code: room.code,
      room_id: room.id,
      game_id: gameId,
      is_manager: room.manager_id === player.id,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error restoring session:', error);
    const response: RestoreErrorResponse = {
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to restore session. Please try again.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

