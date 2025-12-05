/**
 * POST /api/players - Register or update player
 * Updated for Phase 6: Uses unique nickname validation
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  findPlayerByPlayerId,
  registerPlayer,
  checkNicknameAvailable,
  updatePlayerNickname
} from '@/lib/supabase/players';
import { validateNickname, validateUUID } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';
import type { RegisterPlayerPayload, RegisterPlayerResponse } from '@/types/player';

export async function POST(request: Request) {
  try {
    const body = await request.json() as RegisterPlayerPayload;

    // Validate player_id
    const playerIdValidation = validateUUID(body.player_id);
    if (!playerIdValidation.valid) {
      return errors.invalidPlayerId();
    }

    // Validate nickname
    const nicknameValidation = validateNickname(body.nickname);
    if (!nicknameValidation.valid) {
      return errors.invalidNickname();
    }

    // Create server client (bypasses RLS for registration)
    const supabase = createServerClient();

    const trimmedNickname = body.nickname.trim();

    // Check if player already exists
    const existingPlayer = await findPlayerByPlayerId(supabase, body.player_id);

    if (existingPlayer) {
      // Player exists - check if they're trying to change nickname
      if (existingPlayer.nickname.toLowerCase() === trimmedNickname.toLowerCase()) {
        // Same nickname (case-insensitive) - just return existing player
        const response: RegisterPlayerResponse = {
          id: existingPlayer.id,
          player_id: existingPlayer.player_id,
          nickname: existingPlayer.nickname,
          created_at: existingPlayer.created_at,
        };
        return NextResponse.json({ data: response });
      }

      // Different nickname - check if new nickname is available
      const available = await checkNicknameAvailable(supabase, trimmedNickname);
      if (!available) {
        return NextResponse.json(
          { error: { message: 'This nickname is already taken', code: 'NICKNAME_TAKEN' } },
          { status: 409 }
        );
      }

      // Update to new nickname
      const updatedPlayer = await updatePlayerNickname(supabase, body.player_id, trimmedNickname);

      const response: RegisterPlayerResponse = {
        id: updatedPlayer.id,
        player_id: updatedPlayer.player_id,
        nickname: updatedPlayer.nickname,
        created_at: updatedPlayer.created_at,
      };
      return NextResponse.json({ data: response });
    }

    // New player - register with unique nickname
    try {
      const player = await registerPlayer(supabase, body.player_id, trimmedNickname);

      const response: RegisterPlayerResponse = {
        id: player.id,
        player_id: player.player_id,
        nickname: player.nickname,
        created_at: player.created_at,
      };
      return NextResponse.json({ data: response });
    } catch (regError) {
      const error = regError as Error & { code?: string };
      if (error.code === 'NICKNAME_TAKEN') {
        return NextResponse.json(
          { error: { message: 'This nickname is already taken', code: 'NICKNAME_TAKEN' } },
          { status: 409 }
        );
      }
      throw regError;
    }
  } catch (error) {
    return handleError(error);
  }
}
