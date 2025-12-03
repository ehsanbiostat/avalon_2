/**
 * API Route: GET /api/rooms/[code]/role
 * Get current player's role
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, isPlayerInRoom } from '@/lib/supabase/rooms';
import { getPlayerRole, getEvilTeammates } from '@/lib/supabase/roles';
import { getRoleInfo } from '@/lib/domain/roles';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/role
 * Get current player's role
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

    // Check if roles have been distributed
    if (room.status === 'waiting') {
      return errors.rolesNotDistributed();
    }

    // Get player's role
    const playerRole = await getPlayerRole(supabase, room.id, player.id);
    if (!playerRole) {
      return errors.rolesNotDistributed();
    }

    // Get role info
    const roleInfo = getRoleInfo(playerRole.role);

    // Get evil teammates if player is evil
    let evilTeammates: string[] | undefined;
    if (playerRole.role === 'evil') {
      evilTeammates = await getEvilTeammates(supabase, room.id, player.id);
    }

    return NextResponse.json({
      data: {
        role: playerRole.role,
        role_name: roleInfo.role_name,
        role_description: roleInfo.role_description,
        is_confirmed: playerRole.is_confirmed,
        evil_teammates: evilTeammates,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
