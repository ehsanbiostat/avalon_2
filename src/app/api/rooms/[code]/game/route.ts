/**
 * API Route: GET /api/rooms/[code]/game
 * Get the game for a room (convenience endpoint for lobby -> game transition)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, isPlayerInRoom } from '@/lib/supabase/rooms';
import { getGameByRoomId } from '@/lib/supabase/games';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/game
 * Get game ID for a room
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    // Check if player is in this room
    const isMember = await isPlayerInRoom(supabase, room.id, player.id);
    if (!isMember) {
      return errors.notRoomMember();
    }

    // Get game for room
    const game = await getGameByRoomId(supabase, room.id);
    
    if (!game) {
      return NextResponse.json({
        data: {
          has_game: false,
          game_id: null,
          phase: null,
        },
      });
    }

    return NextResponse.json({
      data: {
        has_game: true,
        game_id: game.id,
        phase: game.phase,
        current_quest: game.current_quest,
        current_leader_id: game.current_leader_id,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

