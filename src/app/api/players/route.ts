/**
 * POST /api/players - Register or update player
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { upsertPlayer } from '@/lib/supabase/players';
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

    // Upsert player
    const player = await upsertPlayer(supabase, {
      player_id: body.player_id,
      nickname: body.nickname.trim(),
    });

    const response: RegisterPlayerResponse = {
      id: player.id,
      player_id: player.player_id,
      nickname: player.nickname,
      created_at: player.created_at,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}
