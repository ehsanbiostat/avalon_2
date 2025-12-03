/**
 * API Routes for Rooms
 * POST /api/rooms - Create a new room
 * GET /api/rooms - List waiting rooms
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId, getPlayerCurrentRoom } from '@/lib/supabase/players';
import { createRoom, addPlayerToRoom, getWaitingRooms } from '@/lib/supabase/rooms';
import { validatePlayerCount } from '@/lib/domain/validation';
import { generateSecureRoomCode } from '@/lib/utils/room-code';
import { errors, handleError } from '@/lib/utils/errors';
import type { CreateRoomPayload, CreateRoomResponse } from '@/types/room';

/**
 * POST /api/rooms - Create a new room
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

    const supabase = createServerClient();

    // Get player record
    const player = await findPlayerByPlayerId(supabase, playerId);
    if (!player) {
      return errors.playerNotFound();
    }

    // Check if player is already in a room
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

    // Create room
    const room = await createRoom(supabase, {
      code,
      manager_id: player.id,
      expected_players: body.expected_players,
      status: 'waiting',
    });

    // Add creator to room
    await addPlayerToRoom(supabase, room.id, player.id);

    const response: CreateRoomResponse = {
      id: room.id,
      code: room.code,
      manager_id: room.manager_id,
      expected_players: room.expected_players,
      status: room.status,
      created_at: room.created_at,
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
