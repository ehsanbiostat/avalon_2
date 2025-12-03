/**
 * API Route: GET /api/rooms/[code]/role
 * Get current player's role with special character information
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, isPlayerInRoom } from '@/lib/supabase/rooms';
import { 
  getPlayerRole, 
  getEvilTeammates,
  getPlayersVisibleToMerlin,
  getPlayersVisibleToPercival 
} from '@/lib/supabase/roles';
import { getRoleInfo } from '@/lib/domain/roles';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/role
 * Get current player's role with special character info
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

    // Get role info with special character details
    const roleInfo = getRoleInfo(playerRole.role, playerRole.special_role);

    // Get visibility information based on special role
    let knownPlayers: string[] | undefined;
    let knownPlayersLabel: string | undefined;

    // Evil players see their teammates (except Oberon)
    if (playerRole.role === 'evil' && playerRole.special_role !== 'oberon') {
      knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
      knownPlayersLabel = 'Your Fellow Minions';
    }

    // Merlin sees evil players (except Mordred)
    if (playerRole.special_role === 'merlin') {
      knownPlayers = await getPlayersVisibleToMerlin(supabase, room.id);
      knownPlayersLabel = 'The Evil Among You';
    }

    // Percival sees Merlin candidates (Merlin + Morgana)
    if (playerRole.special_role === 'percival') {
      knownPlayers = await getPlayersVisibleToPercival(supabase, room.id);
      knownPlayersLabel = 'Merlin (or Morgana?)';
    }

    return NextResponse.json({
      data: {
        role: playerRole.role,
        special_role: playerRole.special_role,
        role_name: roleInfo.role_name,
        role_description: roleInfo.role_description,
        is_confirmed: playerRole.is_confirmed,
        known_players: knownPlayers,
        known_players_label: knownPlayersLabel,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
