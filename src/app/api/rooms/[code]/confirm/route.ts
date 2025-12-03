/**
 * API Route: POST /api/rooms/[code]/confirm
 * Confirm that player has seen their role
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, isPlayerInRoom, updateRoomActivity } from '@/lib/supabase/rooms';
import { getPlayerRole, confirmPlayerRole, getRoomConfirmations } from '@/lib/supabase/roles';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/[code]/confirm
 * Confirm role
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

    // Check if already confirmed
    if (playerRole.is_confirmed) {
      return errors.alreadyConfirmed();
    }

    // Confirm the role
    await confirmPlayerRole(supabase, room.id, player.id);

    // Update room activity
    await updateRoomActivity(supabase, room.id);

    // Get confirmation status
    const confirmations = await getRoomConfirmations(supabase, room.id);
    const allConfirmed = confirmations.total === confirmations.confirmed;

    return NextResponse.json({
      data: {
        confirmed: true,
        confirmations,
        all_confirmed: allConfirmed,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
