/**
 * API Route: POST /api/rooms/[code]/distribute
 * Distribute roles to all players (manager only)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, getRoomPlayerCount, updateRoomStatus } from '@/lib/supabase/rooms';
import { insertRoleAssignments, rolesDistributed } from '@/lib/supabase/roles';
import { distributeRoles, getRoleRatio } from '@/lib/domain/roles';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/rooms/[code]/distribute
 * Distribute roles (manager only)
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

    // Check if roles already distributed
    if (room.status !== 'waiting') {
      return errors.rolesAlreadyDistributed();
    }

    const alreadyDistributed = await rolesDistributed(supabase, room.id);
    if (alreadyDistributed) {
      return errors.rolesAlreadyDistributed();
    }

    // Check if room is full
    const playerCount = await getRoomPlayerCount(supabase, room.id);
    if (playerCount !== room.expected_players) {
      return errors.roomNotFull();
    }

    // Get all player IDs in the room
    const { data: roomPlayers, error: rpError } = await supabase
      .from('room_players')
      .select('player_id')
      .eq('room_id', room.id);

    if (rpError) {
      throw rpError;
    }

    const playerIds = (roomPlayers || []).map((rp: { player_id: string }) => rp.player_id);

    // Distribute roles
    const assignments = distributeRoles(playerIds);

    // Insert role assignments
    await insertRoleAssignments(supabase, room.id, assignments);

    // Update room status
    await updateRoomStatus(supabase, room.id, 'roles_distributed');

    // Get role counts
    const ratio = getRoleRatio(playerCount);

    return NextResponse.json({
      data: {
        distributed: true,
        player_count: playerCount,
        good_count: ratio.good,
        evil_count: ratio.evil,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
