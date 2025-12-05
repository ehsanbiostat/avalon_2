/**
 * POST /api/players/register
 * Register a new player with a globally unique nickname
 * Phase 6: Player Recovery & Reconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { registerPlayer } from '@/lib/supabase/players';
import { validateNickname, NICKNAME_ERROR_MESSAGES } from '@/lib/domain/nickname-validation';
import type { RegisterRequest, RegisterResponse, RegisterErrorResponse } from '@/types/player';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RegisterRequest;
    const { nickname, player_id } = body;

    // Validate required fields
    if (!player_id) {
      const response: RegisterErrorResponse = {
        success: false,
        error: 'INVALID_NICKNAME',
        message: 'Player ID is required',
        validation_errors: [{ field: 'player_id', message: 'Player ID is required' }],
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!nickname) {
      const response: RegisterErrorResponse = {
        success: false,
        error: 'INVALID_NICKNAME',
        message: NICKNAME_ERROR_MESSAGES.empty,
        validation_errors: [{ field: 'nickname', message: NICKNAME_ERROR_MESSAGES.empty }],
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate nickname format
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      const response: RegisterErrorResponse = {
        success: false,
        error: 'INVALID_NICKNAME',
        message: validation.errors[0],
        validation_errors: validation.errors.map(msg => ({ field: 'nickname', message: msg })),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
      const player = await registerPlayer(supabase, player_id, nickname.trim());

      const response: RegisterResponse = {
        success: true,
        player: {
          id: player.id,
          nickname: player.nickname,
          player_id: player.player_id,
          created_at: player.created_at,
        },
      };

      return NextResponse.json(response, { status: 201 });

    } catch (regError) {
      // Handle nickname taken error
      const error = regError as Error & { code?: string };
      if (error.code === 'NICKNAME_TAKEN') {
        const response: RegisterErrorResponse = {
          success: false,
          error: 'NICKNAME_TAKEN',
          message: NICKNAME_ERROR_MESSAGES.taken,
        };
        return NextResponse.json(response, { status: 409 });
      }
      throw regError;
    }

  } catch (error) {
    console.error('Error registering player:', error);
    const response: RegisterErrorResponse = {
      success: false,
      error: 'INVALID_NICKNAME',
      message: 'Failed to register player. Please try again.',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
