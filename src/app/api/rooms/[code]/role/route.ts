/**
 * API Route: GET /api/rooms/[code]/role
 * Get current player's role with special character information
 * Phases 6-10: Updated for all special role reveals (US4-US8)
 */

import { NextResponse } from 'next/server';
import { createServerClient, getPlayerIdFromRequest } from '@/lib/supabase/server';
import { findPlayerByPlayerId } from '@/lib/supabase/players';
import { findRoomByCode, isPlayerInRoom } from '@/lib/supabase/rooms';
import { 
  getPlayerRole, 
  getEvilTeammates,
  getPlayersVisibleToMerlin,
  getPlayersVisibleToPercival 
} from '@/lib/supabase/roles';
import { getRoleInfo } from '@/lib/domain/roles';
import { countHiddenEvilFromMerlin } from '@/lib/domain/visibility';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';
import type { RoleConfig } from '@/types/role-config';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/rooms/[code]/role
 * Get current player's role with character-specific visibility
 * US4: Percival sees Merlin candidates
 * US5: Morgana knows her disguise ability
 * US6: Mordred knows he's hidden from Merlin
 * US7: Oberon sees mode-specific info
 * US8: Merlin sees evil with hidden count warning
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    // Check if player is in this room
    const isMember = await isPlayerInRoom(supabase, room.id, player.id);
    if (!isMember) {
      return errors.notRoomMember();
    }

    // Check if roles have been distributed
    if (room.status === 'waiting') {
      return errors.rolesNotDistributed();
    }

    // Get player's role
    const playerRole = await getPlayerRole(supabase, room.id, player.id);
    if (!playerRole) {
      return errors.rolesNotDistributed();
    }

    // Get role config for visibility calculations
    const roleConfig: RoleConfig = room.role_config || {};

    // Get role info with special character details
    const roleInfo = getRoleInfo(playerRole.role, playerRole.special_role);

    // Get visibility information based on special role
    let knownPlayers: string[] | undefined;
    let knownPlayersLabel: string | undefined;
    let hiddenEvilCount: number | undefined;
    let abilityNote: string | undefined;

    switch (playerRole.special_role) {
      // T064-T068: US8 - Merlin visibility with hidden count
      case 'merlin':
        knownPlayers = await getPlayersVisibleToMerlin(supabase, room.id);
        knownPlayersLabel = 'The Evil Among You';
        hiddenEvilCount = countHiddenEvilFromMerlin(roleConfig);
        if (hiddenEvilCount > 0) {
          abilityNote = `${hiddenEvilCount} evil ${hiddenEvilCount === 1 ? 'player is' : 'players are'} hidden from you!`;
        }
        break;

      // T047-T051: US4 - Percival sees Merlin candidates
      case 'percival':
        knownPlayers = await getPlayersVisibleToPercival(supabase, room.id);
        // T051: Edge case - Percival without Morgana sees only Merlin
        if (knownPlayers.length === 1) {
          knownPlayersLabel = 'This is Merlin';
          abilityNote = 'Protect Merlin at all costs!';
        } else {
          knownPlayersLabel = 'One of These is Merlin';
          abilityNote = 'Protect Merlin, but beware — Morgana appears the same to you!';
        }
        break;

      // T052-T055: US5 - Morgana knows her disguise
      case 'morgana':
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        // T055: Edge case - Morgana without Percival
        if (roleConfig.percival) {
          abilityNote = 'You appear as Merlin to Percival. Use this to confuse and deceive!';
        } else {
          abilityNote = 'Percival is not in this game, so your disguise ability has no effect.';
        }
        break;

      // T056-T058: US6 - Mordred knows he's hidden
      case 'mordred':
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        abilityNote = 'Merlin does not know you are evil. Lead from the shadows!';
        break;

      // T059-T063: US7 - Oberon Standard
      case 'oberon_standard':
        // Oberon doesn't see teammates
        knownPlayers = [];
        knownPlayersLabel = undefined;
        abilityNote = "You work alone. Your teammates don't know you, and you don't know them. Merlin can see you.";
        break;

      // T059-T063: US7 - Oberon Chaos
      case 'oberon_chaos':
        // Oberon Chaos doesn't see teammates and is hidden from Merlin
        knownPlayers = [];
        knownPlayersLabel = undefined;
        abilityNote = 'Complete isolation! No one knows you are evil — not even Merlin!';
        break;

      // Regular evil (Assassin, Minion)
      case 'assassin':
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        abilityNote = 'If the good team wins 3 quests, you have one chance to identify Merlin!';
        break;

      case 'minion':
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        abilityNote = 'Work with your fellow minions to sabotage the quests!';
        break;

      // Regular good (Servant)
      case 'servant':
      default:
        knownPlayers = undefined;
        knownPlayersLabel = undefined;
        abilityNote = 'Stay vigilant! Work with your fellow knights to identify the traitors.';
        break;
    }

    return NextResponse.json({
      data: {
        role: playerRole.role,
        special_role: playerRole.special_role,
        role_name: roleInfo.role_name,
        role_description: roleInfo.role_description,
        is_confirmed: playerRole.is_confirmed,
        has_lady_of_lake: playerRole.has_lady_of_lake || false,
        known_players: knownPlayers,
        known_players_label: knownPlayersLabel,
        hidden_evil_count: hiddenEvilCount,
        ability_note: abilityNote,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
