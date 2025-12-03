/**
 * API Route: POST /api/rooms/[code]/join
 * Join an existing room by code
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId, getPlayerCurrentRoom } from '@/lib/supabase/players';
import {
  findRoomByCode,
  addPlayerToRoom,
  getRoomPlayerCount,
  isPlayerInRoom,
} from '@/lib/supabase/rooms';
import { validateRoomCode, canJoinRoom } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/[code]/join
 * Join a room by its code
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    // Validate player ID
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return errors.unauthorized();
    }

    // Validate room code format
    const codeValidation = validateRoomCode(code);
    if (!codeValidation.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_ROOM_CODE', message: codeValidation.error } },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get player record
    const player = await findPlayerByPlayerId(supabase, playerId);
    if (!player) {
      return errors.playerNotFound();
    }

    // Find the room
    const room = await findRoomByCode(supabase, code);
    if (!room) {
      return errors.roomNotFound();
    }

    // Check if player is already in this room (rejoin)
    const alreadyInRoom = await isPlayerInRoom(supabase, room.id, player.id);
    if (alreadyInRoom) {
      // Update connection status for rejoin
      await supabase
        .from('room_players')
        .update({
          is_connected: true,
          disconnected_at: null,
        })
        .eq('room_id', room.id)
        .eq('player_id', player.id);

      return NextResponse.json({
        data: {
          room_id: room.id,
          player_id: player.id,
          joined_at: new Date().toISOString(),
          is_rejoin: true,
        },
      });
    }

    // Check if player is in another room
    const currentRoom = await getPlayerCurrentRoom(supabase, playerId);
    if (currentRoom) {
      return errors.playerAlreadyInRoom();
    }

    // Get current player count
    const currentPlayerCount = await getRoomPlayerCount(supabase, room.id);

    // Validate room can accept more players
    const joinValidation = canJoinRoom(room.status, currentPlayerCount, room.expected_players);
    if (!joinValidation.valid) {
      if (joinValidation.error?.includes('full')) {
        return errors.roomFull();
      }
      return errors.roomNotWaiting();
    }

    // Check for nickname collision in room
    const { data: existingPlayers } = await supabase
      .from('room_players')
      .select(`
        player_id,
        players!inner (
          nickname
        )
      `)
      .eq('room_id', room.id);

    const nicknameExists = existingPlayers?.some(
      (rp: { players: { nickname: string }[] }) =>
        rp.players[0]?.nickname.toLowerCase() === player.nickname.toLowerCase()
    );

    if (nicknameExists) {
      return NextResponse.json(
        {
          error: {
            code: 'NICKNAME_TAKEN',
            message: 'Another player in this room has the same nickname',
          },
        },
        { status: 409 }
      );
    }

    // Add player to room
    const roomPlayer = await addPlayerToRoom(supabase, room.id, player.id);

    return NextResponse.json({
      data: {
        room_id: room.id,
        player_id: player.id,
        joined_at: roomPlayer.joined_at,
        is_rejoin: false,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
