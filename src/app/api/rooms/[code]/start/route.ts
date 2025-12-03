/**
 * API Route: POST /api/rooms/[code]/start
 * Start the game (manager only, after all confirmations)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, updateRoomStatus } from '@/lib/supabase/rooms';
import { allPlayersConfirmed } from '@/lib/supabase/roles';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/[code]/start
 * Start the game (manager only)
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

    // Check if player is manager
    if (room.manager_id !== player.id) {
      return errors.notRoomManager();
    }

    // Check current status
    if (room.status === 'started') {
      return errors.alreadyStarted();
    }

    if (room.status === 'waiting') {
      return errors.rolesNotDistributed();
    }

    // Check if all players confirmed
    const confirmed = await allPlayersConfirmed(supabase, room.id);
    if (!confirmed) {
      return errors.notAllConfirmed();
    }

    // Start the game
    await updateRoomStatus(supabase, room.id, 'started');

    return NextResponse.json({
      data: {
        started: true,
        room_code: code,
        status: 'started',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
