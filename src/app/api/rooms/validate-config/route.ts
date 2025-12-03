/**
 * API Route: Validate Role Configuration
 * POST /api/rooms/validate-config
 * T024: Validates a role configuration without creating a room
 */

import { NextResponse } from 'next/server';
import { validateRoleConfig, computeRolesInPlay, getRoleRatioForCount } from '@/lib/domain/role-config';
import { handleError } from '@/lib/utils/errors';
import type { RoleConfig } from '@/types/role-config';

interface ValidateConfigRequest {
  expected_players: number;
  role_config: RoleConfig;
}

interface ValidateConfigResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
  roles_in_play: string[];
  good_count: number;
  evil_count: number;
}

/**
 * POST /api/rooms/validate-config
 * Validates a role configuration against player count constraints
 * Does not require authentication (preview feature)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as ValidateConfigRequest;

    // Validate required fields
    if (typeof body.expected_players !== 'number') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: 'expected_players is required and must be a number',
          },
        },
        { status: 400 }
      );
    }

    const roleConfig: RoleConfig = body.role_config || {};

    // Validate configuration
    const validation = validateRoleConfig(roleConfig, body.expected_players);

    // Get role ratio for response
    const ratio = getRoleRatioForCount(body.expected_players);

    // Compute roles in play (even if invalid, for preview)
    let rolesInPlay: string[] = [];
    try {
      rolesInPlay = computeRolesInPlay(roleConfig);
    } catch {
      // If computation fails, leave empty
    }

    const response: ValidateConfigResponse = {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      roles_in_play: validation.valid ? rolesInPlay : [],
      good_count: ratio?.good ?? 0,
      evil_count: ratio?.evil ?? 0,
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    return handleError(error);
  }
}

