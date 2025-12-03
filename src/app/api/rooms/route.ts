/**
 * API Routes for Rooms
 * POST /api/rooms - Create a new room
 * GET /api/rooms - List waiting rooms
 * Updated for Phase 2: Special Roles & Configurations
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId, getPlayerCurrentRoom, cleanupPlayerStartedRooms } from '@/lib/supabase/players';
import { createRoom, addPlayerToRoom, getWaitingRooms } from '@/lib/supabase/rooms';
import { validatePlayerCount } from '@/lib/domain/validation';
import { validateRoleConfig, computeRolesInPlay, getDefaultConfig } from '@/lib/domain/role-config';
import { generateSecureRoomCode } from '@/lib/utils/room-code';
import { errors, handleError } from '@/lib/utils/errors';
import type { CreateRoomPayload, CreateRoomResponse } from '@/types/room';
import type { RoleConfig } from '@/types/role-config';

/**
 * POST /api/rooms - Create a new room (T021, T022, T023)
 */
export async function POST(request: Request) {
  try {
    // Validate player ID
    const playerId = getPlayerIdFromRequest(request);
    if (!playerId) {
      return errors.unauthorized();
    }

    // Parse body
    const body = await request.json() as CreateRoomPayload;

    // Validate player count
    const countValidation = validatePlayerCount(body.expected_players);
    if (!countValidation.valid) {
      return errors.invalidPlayerCount();
    }

    // T022: Validate role configuration if provided
    const roleConfig: RoleConfig = body.role_config || getDefaultConfig();
    const configValidation = validateRoleConfig(roleConfig, body.expected_players);
    if (!configValidation.valid) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_ROLE_CONFIG', 
            message: configValidation.errors.join('; ')
          } 
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get player record
    const player = await findPlayerByPlayerId(supabase, playerId);
    if (!player) {
      return errors.playerNotFound();
    }

    // Cleanup any stale room memberships (from 'started' games)
    await cleanupPlayerStartedRooms(supabase, playerId);

    // Check if player is already in an active room (waiting or roles_distributed)
    const currentRoom = await getPlayerCurrentRoom(supabase, playerId);
    if (currentRoom) {
      return errors.playerAlreadyInRoom();
    }

    // Generate unique room code
    let code = generateSecureRoomCode();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure code is unique (retry if collision)
    while (attempts < maxAttempts) {
      const { count } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('code', code);

      if (count === 0) break;
      code = generateSecureRoomCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return errors.internalError('Failed to generate unique room code');
    }

    // T023: Create room with role_config
    const room = await createRoom(supabase, {
      code,
      manager_id: player.id,
      expected_players: body.expected_players,
      status: 'waiting',
      // Phase 2: Include role configuration
      role_config: roleConfig,
      lady_of_lake_enabled: roleConfig.ladyOfLake || false,
    });

    // Add creator to room
    await addPlayerToRoom(supabase, room.id, player.id);

    // Compute roles in play for response
    const rolesInPlay = computeRolesInPlay(roleConfig);

    const response: CreateRoomResponse = {
      id: room.id,
      code: room.code,
      manager_id: room.manager_id,
      expected_players: room.expected_players,
      status: room.status,
      created_at: room.created_at,
      // Phase 2 additions
      role_config: room.role_config,
      lady_of_lake_enabled: room.lady_of_lake_enabled,
      roles_in_play: rolesInPlay,
    };

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/rooms - List all waiting rooms
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    const rooms = await getWaitingRooms(supabase);

    return NextResponse.json({ data: rooms });
  } catch (error) {
    return handleError(error);
  }
}
