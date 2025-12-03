/**
 * API Route: GET /api/rooms/[code]
 * Get room details including players
 * T031, T032: Updated for Phase 2 to include roles_in_play and role_config
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, getRoomDetails, isPlayerInRoom } from '@/lib/supabase/rooms';
import { validateRoomCode } from '@/lib/domain/validation';
import { computeRolesInPlay } from '@/lib/domain/role-config';
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

    // T031, T032: Compute roles in play from room configuration
    const roleConfig = room.role_config || {};
    const rolesInPlay = computeRolesInPlay(roleConfig);

    // Get Lady of Lake holder info if applicable
    let ladyOfLakeHolder = null;
    if (room.lady_of_lake_holder_id) {
      const holder = details.players.find(p => p.id === room.lady_of_lake_holder_id);
      if (holder) {
        ladyOfLakeHolder = { id: holder.id, nickname: holder.nickname };
      }
    }

    return NextResponse.json({
      data: {
        ...details,
        roles_in_play: rolesInPlay,
        lady_of_lake_holder: ladyOfLakeHolder,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
