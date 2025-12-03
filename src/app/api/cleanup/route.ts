/**
 * API Route: POST /api/cleanup
 * Triggers room cleanup for stale rooms
 *
 * This endpoint can be called by:
 * - Vercel Cron Jobs (recommended for production)
 * - Supabase Edge Functions
 * - External cron service
 *
 * For Vercel, add to vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cleanup",
 *       "schedule": "0 * * * *"  // Every hour
 *     }
 *   ]
 * }
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getRoomsToCleanup, getCleanupReason, type RoomForCleanup } from '@/lib/domain/room-cleanup';
import { logger } from '@/lib/utils/logger';

/**
 * Verify the request is authorized
 * In production, use a secret key or Vercel's built-in cron authentication
 */
function isAuthorized(request: Request): boolean {
  // In development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for Vercel Cron secret (automatically set by Vercel)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // Check for custom API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.CLEANUP_API_KEY) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  try {
    // Verify authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Fetch all rooms
    const { data: rooms, error: fetchError } = await supabase
      .from('rooms')
      .select('id, code, status, last_activity_at');

    if (fetchError) {
      throw fetchError;
    }

    // Determine which rooms to cleanup
    const roomsToCleanup = getRoomsToCleanup(rooms as RoomForCleanup[]);

    if (roomsToCleanup.length === 0) {
      logger.info('cleanup.complete', {
        action: 'cleanup',
        roomsChecked: rooms?.length || 0,
        roomsDeleted: 0,
      });

      return NextResponse.json({
        data: {
          roomsChecked: rooms?.length || 0,
          roomsDeleted: 0,
          deletedRoomCodes: [],
        },
      });
    }

    // Delete stale rooms
    const deletedRoomCodes: string[] = [];
    const errors: Array<{ roomCode: string; error: string }> = [];

    for (const room of roomsToCleanup) {
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (deleteError) {
        errors.push({ roomCode: room.code, error: deleteError.message });
        logger.error('cleanup.error', {
          roomCode: room.code,
          error: deleteError.message,
        });
      } else {
        deletedRoomCodes.push(room.code);
        logger.roomDeleted(room.code, getCleanupReason(room.status));
      }
    }

    logger.cleanupRun(deletedRoomCodes.length, 'scheduled');

    return NextResponse.json({
      data: {
        roomsChecked: rooms?.length || 0,
        roomsDeleted: deletedRoomCodes.length,
        deletedRoomCodes,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('cleanup.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Cleanup failed' } },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing via browser
export async function GET(request: Request) {
  return POST(request);
}
