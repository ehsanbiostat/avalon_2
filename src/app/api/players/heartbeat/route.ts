/**
 * POST /api/players/heartbeat
 * Update player's last_activity_at timestamp
 * Phase 6: Player Recovery & Reconnection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updatePlayerActivity } from '@/lib/supabase/players';
import type { HeartbeatResponse } from '@/types/player';

export async function POST(request: NextRequest) {
  try {
    const playerId = request.headers.get('x-player-id');

    if (!playerId) {
      const response: HeartbeatResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updated = await updatePlayerActivity(supabase, playerId);

    if (!updated) {
      const response: HeartbeatResponse = {
        success: false,
        error: 'PLAYER_NOT_FOUND',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: HeartbeatResponse = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating player heartbeat:', error);
    const response: HeartbeatResponse = {
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
