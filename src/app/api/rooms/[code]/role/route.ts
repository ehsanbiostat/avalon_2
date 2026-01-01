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
  getPlayersVisibleToPercival,
  getRoleAssignments
} from '@/lib/supabase/roles';
import { getGameByRoomId } from '@/lib/supabase/games';
import { getRoleInfo } from '@/lib/domain/roles';
import { countHiddenEvilFromMerlin, generateDecoyWarning, getSplitIntelVisibility, getOberonSplitIntelVisibility, getEvilRingVisibility, type RoleAssignment } from '@/lib/domain/visibility';
import { shuffleArray } from '@/lib/domain/decoy-selection';
import { validateRoomCode } from '@/lib/domain/validation';
import { errors, handleError } from '@/lib/utils/errors';
import type { RoleConfig } from '@/types/role-config';
import type { SplitIntelGroups, SplitIntelVisibility, OberonSplitIntelGroups, OberonSplitIntelVisibility, EvilRingAssignments, EvilRingVisibility } from '@/types/game';

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
    // Feature 009: Merlin Decoy fields
    let hasDecoy: boolean | undefined;
    let decoyWarning: string | undefined;
    // Feature 011: Merlin Split Intel fields
    let splitIntel: SplitIntelVisibility | undefined;
    // Feature 018: Oberon Split Intel fields
    let oberonSplitIntel: OberonSplitIntelVisibility | undefined;
    // Feature 019: Evil Ring Visibility fields
    let evilRingVisibility: EvilRingVisibility | undefined;

    switch (playerRole.special_role) {
      // T064-T068: US8 - Merlin visibility with hidden count
      // Feature 009: Updated for Merlin Decoy Mode
      // Feature 011: Updated for Merlin Split Intel Mode
      case 'merlin': {
        hiddenEvilCount = countHiddenEvilFromMerlin(roleConfig);

        // Feature 018: Handle Oberon Split Intel Mode (takes precedence)
        if (roleConfig.oberon_split_intel_enabled) {
          // Check for oberon split intel data - first from role_config (pre-game), then from game
          let oberonSplitIntelGroups: OberonSplitIntelGroups | null = null;

          // Try role_config first (works before game is created)
          const rcData = roleConfig as Record<string, unknown>;
          if (rcData._oberon_split_intel_oberon_id && rcData._oberon_split_intel_mixed_good_id) {
            oberonSplitIntelGroups = {
              certainEvilIds: (rcData._oberon_split_intel_certain_evil_ids as string[]) || [],
              oberonId: rcData._oberon_split_intel_oberon_id as string,
              mixedGoodId: rcData._oberon_split_intel_mixed_good_id as string,
            };
          } else {
            // Fall back to game (for after game is created)
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.oberon_split_intel_mixed_good_id) {
              // Find Oberon's player ID from role assignments
              const roleAssignmentsData = await getRoleAssignments(supabase, room.id);
              const oberon = roleAssignmentsData.find(a => a.special_role === 'oberon_standard');
              if (oberon) {
                oberonSplitIntelGroups = {
                  certainEvilIds: game.oberon_split_intel_certain_evil_ids || [],
                  oberonId: oberon.player_id,
                  mixedGoodId: game.oberon_split_intel_mixed_good_id,
                };
              }
            }
          }

          if (oberonSplitIntelGroups) {
            // Get all role assignments for player names
            const roleAssignmentsData = await getRoleAssignments(supabase, room.id);

            // Get player nicknames
            const { data: playerData } = await supabase
              .from('players')
              .select('id, nickname')
              .in('id', roleAssignmentsData.map(a => a.player_id));

            const nicknameMap = new Map(
              (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
            );

            // Convert to RoleAssignment format
            const visibilityAssignments: RoleAssignment[] = roleAssignmentsData.map(a => ({
              playerId: a.player_id,
              playerName: nicknameMap.get(a.player_id) || 'Unknown',
              role: a.role as 'good' | 'evil',
              specialRole: a.special_role,
            }));

            // Get oberon split intel visibility
            oberonSplitIntel = getOberonSplitIntelVisibility(visibilityAssignments, roleConfig, oberonSplitIntelGroups);

            // Set known players to empty (oberon split intel uses separate groups)
            knownPlayers = [];
            knownPlayersLabel = '';
            abilityNote = 'You see evil players divided: coordinated evil are certain, but Oberon is mixed with a good player.';

            // Update hidden count for Oberon Split Intel (only Mordred is hidden)
            hiddenEvilCount = roleConfig.mordred ? 1 : 0;
          }
        }
        // Feature 011: Handle Merlin Split Intel Mode (takes precedence over standard visibility)
        else if (roleConfig.merlin_split_intel_enabled) {
          // Check for split intel data - first from role_config (pre-game), then from game
          let splitIntelGroups: SplitIntelGroups | null = null;

          // Try role_config first (works before game is created)
          const rcData = roleConfig as Record<string, unknown>;
          if (rcData._split_intel_certain_evil_ids && rcData._split_intel_mixed_evil_id && rcData._split_intel_mixed_good_id) {
            splitIntelGroups = {
              certainEvilIds: rcData._split_intel_certain_evil_ids as string[],
              mixedEvilId: rcData._split_intel_mixed_evil_id as string,
              mixedGoodId: rcData._split_intel_mixed_good_id as string,
            };
          } else {
            // Fall back to game (for after game is created)
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.split_intel_certain_evil_ids && game?.split_intel_mixed_evil_id && game?.split_intel_mixed_good_id) {
              splitIntelGroups = {
                certainEvilIds: game.split_intel_certain_evil_ids,
                mixedEvilId: game.split_intel_mixed_evil_id,
                mixedGoodId: game.split_intel_mixed_good_id,
              };
            }
          }

          if (splitIntelGroups) {
            // Get all role assignments for player names
            const roleAssignmentsData = await getRoleAssignments(supabase, room.id);

            // Get player nicknames
            const { data: playerData } = await supabase
              .from('players')
              .select('id, nickname')
              .in('id', roleAssignmentsData.map(a => a.player_id));

            const nicknameMap = new Map(
              (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
            );

            // Convert to RoleAssignment format
            const visibilityAssignments: RoleAssignment[] = roleAssignmentsData.map(a => ({
              playerId: a.player_id,
              playerName: nicknameMap.get(a.player_id) || 'Unknown',
              role: a.role as 'good' | 'evil',
              specialRole: a.special_role,
            }));

            // Get split intel visibility
            splitIntel = getSplitIntelVisibility(visibilityAssignments, roleConfig, splitIntelGroups);

            // Set known players to empty (split intel uses separate groups)
            knownPlayers = [];
            knownPlayersLabel = '';
            abilityNote = 'You see players divided into two groups with different certainty levels.';
          }
        }
        // Feature 009: Handle Merlin Decoy Mode (only if split intel not active)
        else if (roleConfig.merlin_decoy_enabled) {
          knownPlayers = await getPlayersVisibleToMerlin(supabase, room.id);

          // Check for decoy player ID - first from role_config (pre-game), then from game
          // The decoy ID is stored in role_config during distribution (before game exists)
          // and copied to the game when the game starts
          let decoyPlayerId: string | null = null;

          // Try role_config first (works before game is created)
          if ((roleConfig as Record<string, unknown>)._merlin_decoy_player_id) {
            decoyPlayerId = (roleConfig as Record<string, unknown>)._merlin_decoy_player_id as string;
          } else {
            // Fall back to game (for after game is created)
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.merlin_decoy_player_id) {
              decoyPlayerId = game.merlin_decoy_player_id;
            }
          }

          if (decoyPlayerId) {
            // Get decoy player's nickname
            const { data: decoyPlayer } = await supabase
              .from('players')
              .select('nickname')
              .eq('id', decoyPlayerId)
              .single();

            if (decoyPlayer) {
              // Add decoy to known players list
              knownPlayers = [...knownPlayers, decoyPlayer.nickname];
              // Shuffle to prevent position-based detection
              knownPlayers = shuffleArray(knownPlayers);
              // Set decoy flags
              hasDecoy = true;
              decoyWarning = generateDecoyWarning(hiddenEvilCount || 0);
            }
          }

          // Set label based on whether decoy mode is active
          if (hasDecoy) {
            // When decoy is active, the list contains evil + 1 good, so use a cautious label
            knownPlayersLabel = 'Suspected Evil Players';
          } else {
            knownPlayersLabel = 'The Evil Among You';
          }

          // Standard ability note (only if no decoy)
          if (!hasDecoy && hiddenEvilCount && hiddenEvilCount > 0) {
            abilityNote = `${hiddenEvilCount} evil ${hiddenEvilCount === 1 ? 'player is' : 'players are'} hidden from you!`;
          }
        }
        // Standard Merlin visibility (no decoy, no split intel)
        else {
          knownPlayers = await getPlayersVisibleToMerlin(supabase, room.id);
          knownPlayersLabel = 'The Evil Among You';
          if (hiddenEvilCount && hiddenEvilCount > 0) {
            abilityNote = `${hiddenEvilCount} evil ${hiddenEvilCount === 1 ? 'player is' : 'players are'} hidden from you!`;
          }
        }
        break;
      }

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
      case 'morgana': {
        // Feature 019: Handle Evil Ring Visibility Mode
        if (roleConfig.evil_ring_visibility_enabled) {
          // Get ring assignments from role_config (pre-game) or game
          let ringAssignments: EvilRingAssignments | null = null;

          const rcData = roleConfig as Record<string, unknown>;
          if (rcData._evil_ring_assignments) {
            ringAssignments = rcData._evil_ring_assignments as EvilRingAssignments;
          } else {
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.evil_ring_assignments) {
              ringAssignments = game.evil_ring_assignments;
            }
          }

          if (ringAssignments && ringAssignments[player.id]) {
            // Get all role assignments for visibility calculation
            const roleAssignmentsData = await getRoleAssignments(supabase, room.id);

            // Get player nicknames
            const { data: playerData } = await supabase
              .from('players')
              .select('id, nickname')
              .in('id', roleAssignmentsData.map(a => a.player_id));

            const nicknameMap = new Map(
              (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
            );

            // Convert to RoleAssignment format
            const visibilityAssignments: RoleAssignment[] = roleAssignmentsData.map(a => ({
              playerId: a.player_id,
              playerName: nicknameMap.get(a.player_id) || 'Unknown',
              role: a.role as 'good' | 'evil',
              specialRole: a.special_role,
            }));

            // Get ring visibility
            evilRingVisibility = getEvilRingVisibility(
              player.id,
              visibilityAssignments,
              ringAssignments,
              roleConfig
            ) ?? undefined;

            if (evilRingVisibility) {
              // Ring mode: show only one teammate's name
              knownPlayers = [evilRingVisibility.knownTeammate.name];
              knownPlayersLabel = 'Your Known Teammate';
              abilityNote = roleConfig.percival
                ? 'Ring Visibility: You only know one teammate. You appear as Merlin to Percival!'
                : 'Ring Visibility: You only know one teammate. Percival is not in this game.';
              break;
            }
          }
        }

        // Standard visibility
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        // T055: Edge case - Morgana without Percival
        if (roleConfig.percival) {
          abilityNote = 'You appear as Merlin to Percival. Use this to confuse and deceive!';
        } else {
          abilityNote = 'Percival is not in this game, so your disguise ability has no effect.';
        }
        break;
      }

      // T056-T058: US6 - Mordred knows he's hidden
      case 'mordred': {
        // Feature 019: Handle Evil Ring Visibility Mode
        if (roleConfig.evil_ring_visibility_enabled) {
          // Get ring assignments from role_config (pre-game) or game
          let ringAssignments: EvilRingAssignments | null = null;

          const rcData = roleConfig as Record<string, unknown>;
          if (rcData._evil_ring_assignments) {
            ringAssignments = rcData._evil_ring_assignments as EvilRingAssignments;
          } else {
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.evil_ring_assignments) {
              ringAssignments = game.evil_ring_assignments;
            }
          }

          if (ringAssignments && ringAssignments[player.id]) {
            // Get all role assignments for visibility calculation
            const roleAssignmentsData = await getRoleAssignments(supabase, room.id);

            // Get player nicknames
            const { data: playerData } = await supabase
              .from('players')
              .select('id, nickname')
              .in('id', roleAssignmentsData.map(a => a.player_id));

            const nicknameMap = new Map(
              (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
            );

            // Convert to RoleAssignment format
            const visibilityAssignments: RoleAssignment[] = roleAssignmentsData.map(a => ({
              playerId: a.player_id,
              playerName: nicknameMap.get(a.player_id) || 'Unknown',
              role: a.role as 'good' | 'evil',
              specialRole: a.special_role,
            }));

            // Get ring visibility
            evilRingVisibility = getEvilRingVisibility(
              player.id,
              visibilityAssignments,
              ringAssignments,
              roleConfig
            ) ?? undefined;

            if (evilRingVisibility) {
              // Ring mode: show only one teammate's name
              knownPlayers = [evilRingVisibility.knownTeammate.name];
              knownPlayersLabel = 'Your Known Teammate';
              abilityNote = 'Ring Visibility: You only know one teammate. Merlin does not know you are evil!';
              break;
            }
          }
        }

        // Standard visibility
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        abilityNote = 'Merlin does not know you are evil. Lead from the shadows!';
        break;
      }

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
      case 'minion': {
        // Feature 019: Handle Evil Ring Visibility Mode
        if (roleConfig.evil_ring_visibility_enabled) {
          // Get ring assignments from role_config (pre-game) or game
          let ringAssignments: EvilRingAssignments | null = null;

          const rcData = roleConfig as Record<string, unknown>;
          if (rcData._evil_ring_assignments) {
            ringAssignments = rcData._evil_ring_assignments as EvilRingAssignments;
          } else {
            const game = await getGameByRoomId(supabase, room.id);
            if (game?.evil_ring_assignments) {
              ringAssignments = game.evil_ring_assignments;
            }
          }

          if (ringAssignments && ringAssignments[player.id]) {
            // Get all role assignments for visibility calculation
            const roleAssignmentsData = await getRoleAssignments(supabase, room.id);

            // Get player nicknames
            const { data: playerData } = await supabase
              .from('players')
              .select('id, nickname')
              .in('id', roleAssignmentsData.map(a => a.player_id));

            const nicknameMap = new Map(
              (playerData || []).map((p: { id: string; nickname: string }) => [p.id, p.nickname])
            );

            // Convert to RoleAssignment format
            const visibilityAssignments: RoleAssignment[] = roleAssignmentsData.map(a => ({
              playerId: a.player_id,
              playerName: nicknameMap.get(a.player_id) || 'Unknown',
              role: a.role as 'good' | 'evil',
              specialRole: a.special_role,
            }));

            // Get ring visibility
            evilRingVisibility = getEvilRingVisibility(
              player.id,
              visibilityAssignments,
              ringAssignments,
              roleConfig
            ) ?? undefined;

            if (evilRingVisibility) {
              // Ring mode: show only one teammate's name
              knownPlayers = [evilRingVisibility.knownTeammate.name];
              knownPlayersLabel = 'Your Known Teammate';
              abilityNote = playerRole.special_role === 'assassin'
                ? 'Ring Visibility: You only know one teammate. If the good team wins 3 quests, you have one chance to identify Merlin!'
                : 'Ring Visibility: You only know one teammate. Work in the shadows!';
              break;
            }
          }
        }

        // Standard visibility (ring not enabled or player not in ring)
        knownPlayers = await getEvilTeammates(supabase, room.id, player.id);
        knownPlayersLabel = 'Your Evil Teammates';
        abilityNote = playerRole.special_role === 'assassin'
          ? 'If the good team wins 3 quests, you have one chance to identify Merlin!'
          : 'Work with your fellow minions to sabotage the quests!';
        break;
      }

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
        // Feature 009: Merlin Decoy fields
        has_decoy: hasDecoy,
        decoy_warning: decoyWarning,
        // Feature 011: Merlin Split Intel fields
        split_intel: splitIntel,
        // Feature 018: Oberon Split Intel fields
        oberon_split_intel: oberonSplitIntel,
        // Feature 019: Evil Ring Visibility fields
        evil_ring_visibility: evilRingVisibility,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
