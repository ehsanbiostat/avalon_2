/**
 * API Route: POST /api/rooms/[code]/distribute
 * Distribute roles to all players (manager only)
 * T038, T039: Updated for Phase 2 to use role_config and Lady of Lake
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, getRoomPlayerCount, updateRoomStatus, updateLadyOfLakeHolder } from '@/lib/supabase/rooms';
import { insertRoleAssignments, rolesDistributed, setLadyOfLakeForPlayer, getRoleAssignments } from '@/lib/supabase/roles';
import { getGameByRoomId, setMerlinDecoyPlayer } from '@/lib/supabase/games';
import { distributeRoles, getRoleRatio } from '@/lib/domain/roles';
import { computeRolesInPlay, designateLadyOfLakeHolder } from '@/lib/domain/role-config';
import { selectDecoyPlayer } from '@/lib/domain/decoy-selection';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';
import type { RoleConfig } from '@/types/role-config';
import type { RoleAssignment } from '@/lib/domain/visibility';

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

    // Get all player IDs in the room (ordered by join time for Lady of Lake)
    const { data: roomPlayers, error: rpError } = await supabase
      .from('room_players')
      .select('player_id')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    if (rpError) {
      throw rpError;
    }

    const playerIds = (roomPlayers || []).map((rp: { player_id: string }) => rp.player_id);

    // T038: Get role configuration from room
    const roleConfig: RoleConfig = room.role_config || {};

    // Distribute roles using role configuration
    const assignments = distributeRoles(playerIds, roleConfig);

    // Insert role assignments
    await insertRoleAssignments(supabase, room.id, assignments);

    // T039: Handle Lady of the Lake designation
    let ladyOfLakeHolderId: string | null = null;
    if (roleConfig.ladyOfLake || room.lady_of_lake_enabled) {
      // Designate holder (player to the left of manager)
      ladyOfLakeHolderId = designateLadyOfLakeHolder(playerIds, room.manager_id);

      // Update room with holder
      await updateLadyOfLakeHolder(supabase, room.id, ladyOfLakeHolderId);

      // Update player_roles to mark holder
      await setLadyOfLakeForPlayer(supabase, room.id, ladyOfLakeHolderId, true);
    }

    // Feature 009: Handle Merlin Decoy selection
    let merlinDecoyPlayerId: string | null = null;
    if (roleConfig.merlin_decoy_enabled) {
      // Get role assignments for decoy selection
      const roleAssignments = await getRoleAssignments(supabase, room.id);

      // Get player nicknames for the role assignments
      const { data: playerData } = await supabase
        .from('players')
        .select('id, nickname')
        .in('id', roleAssignments.map(a => a.player_id));

      const nicknameMap = new Map(
        (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
      );

      // Convert to RoleAssignment format for decoy selection
      const visibilityAssignments: RoleAssignment[] = roleAssignments.map(a => ({
        playerId: a.player_id,
        playerName: nicknameMap.get(a.player_id) || 'Unknown',
        role: a.role as 'good' | 'evil',
        specialRole: a.special_role,
      }));

      // Select decoy player
      const decoyResult = selectDecoyPlayer(visibilityAssignments);
      merlinDecoyPlayerId = decoyResult.playerId;

      // Update game with decoy player
      const game = await getGameByRoomId(supabase, room.id);
      if (game) {
        await setMerlinDecoyPlayer(supabase, game.id, merlinDecoyPlayerId);
      }
    }

    // Update room status
    await updateRoomStatus(supabase, room.id, 'roles_distributed');

    // Get role counts and roles in play
    const ratio = getRoleRatio(playerCount);
    const rolesInPlay = computeRolesInPlay(roleConfig);

    return NextResponse.json({
      data: {
        distributed: true,
        player_count: playerCount,
        good_count: ratio.good,
        evil_count: ratio.evil,
        roles_in_play: rolesInPlay,
        lady_of_lake_holder_id: ladyOfLakeHolderId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
