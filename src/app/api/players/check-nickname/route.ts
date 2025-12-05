/**
 * GET /api/players/check-nickname
 * Check if a nickname is available
 * Phase 6: Player Recovery & Reconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkNicknameAvailable } from '@/lib/supabase/players';
import { validateNickname } from '@/lib/domain/nickname-validation';
import type { CheckNicknameResponse } from '@/types/player';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json(
        {
          nickname: '',
          available: false,
          message: 'Nickname parameter is required'
        } as CheckNicknameResponse,
        { status: 400 }
      );
    }

    // Validate nickname format
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      return NextResponse.json(
        {
          nickname,
          available: false,
          message: validation.errors[0]
        } as CheckNicknameResponse,
        { status: 200 } // Return 200 - availability is false
      );
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const available = await checkNicknameAvailable(supabase, nickname);

    const response: CheckNicknameResponse = {
      nickname,
      available,
      message: available ? undefined : 'This nickname is already taken',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error checking nickname availability:', error);
    return NextResponse.json(
      {
        nickname: '',
        available: false,
        message: 'Failed to check nickname availability'
      } as CheckNicknameResponse,
      { status: 500 }
    );
  }
}
