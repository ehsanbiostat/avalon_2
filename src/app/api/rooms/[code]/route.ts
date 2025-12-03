/**
 * API Route: GET /api/rooms/[code]
 * Get room details including players
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, getRoomDetails, isPlayerInRoom } from '@/lib/supabase/rooms';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]
 * Get room details with player list
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

    // Get room details with players
    const details = await getRoomDetails(supabase, room.id, player.id);
    if (!details) {
      return errors.roomNotFound();
    }

    return NextResponse.json({ data: details });
  } catch (error) {
    return handleError(error);
  }
}
