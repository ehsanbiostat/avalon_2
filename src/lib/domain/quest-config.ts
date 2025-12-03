/**
 * Quest Configuration
 * Defines quest requirements (team sizes, fails needed) per player count
 */

import type { QuestRequirement } from '@/types/game';

/**
 * Quest requirements by player count
 * Each array index is quest number - 1 (0-indexed)
 * 
 * Standard Avalon rules:
 * - Quest 4 in 7+ player games requires 2 fails
 */
export const QUEST_CONFIG: Record<number, QuestRequirement[]> = {
  5: [
    { size: 2, fails: 1 },  // Quest 1
    { size: 3, fails: 1 },  // Quest 2
    { size: 2, fails: 1 },  // Quest 3
    { size: 3, fails: 1 },  // Quest 4
    { size: 3, fails: 1 },  // Quest 5
  ],
  6: [
    { size: 2, fails: 1 },
    { size: 3, fails: 1 },
    { size: 4, fails: 1 },
    { size: 3, fails: 1 },
    { size: 4, fails: 1 },
  ],
  7: [
    { size: 2, fails: 1 },
    { size: 3, fails: 1 },
    { size: 3, fails: 1 },
    { size: 4, fails: 2 },  // 2 fails required!
    { size: 4, fails: 1 },
  ],
  8: [
    { size: 3, fails: 1 },
    { size: 4, fails: 1 },
    { size: 4, fails: 1 },
    { size: 5, fails: 2 },  // 2 fails required!
    { size: 5, fails: 1 },
  ],
  9: [
    { size: 3, fails: 1 },
    { size: 4, fails: 1 },
    { size: 4, fails: 1 },
    { size: 5, fails: 2 },  // 2 fails required!
    { size: 5, fails: 1 },
  ],
  10: [
    { size: 3, fails: 1 },
    { size: 4, fails: 1 },
    { size: 4, fails: 1 },
    { size: 5, fails: 2 },  // 2 fails required!
    { size: 5, fails: 1 },
  ],
};

/**
 * Get quest requirement for a specific quest
 * @param playerCount Number of players in game (5-10)
 * @param questNumber Quest number (1-5)
 */
export function getQuestRequirement(
  playerCount: number,
  questNumber: number
): QuestRequirement {
  const config = QUEST_CONFIG[playerCount];
  if (!config) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
  }

  if (questNumber < 1 || questNumber > 5) {
    throw new Error(`Invalid quest number: ${questNumber}. Must be 1-5.`);
  }

  return config[questNumber - 1];
}

/**
 * Get all quest requirements for a game
 * @param playerCount Number of players in game (5-10)
 */
export function getAllQuestRequirements(
  playerCount: number
): QuestRequirement[] {
  const config = QUEST_CONFIG[playerCount];
  if (!config) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 5-10.`);
  }
  return config;
}

/**
 * Get quest requirements as a map (for API responses)
 */
export function getQuestRequirementsMap(
  playerCount: number
): Record<number, QuestRequirement> {
  const requirements = getAllQuestRequirements(playerCount);
  return {
    1: requirements[0],
    2: requirements[1],
    3: requirements[2],
    4: requirements[3],
    5: requirements[4],
  };
}

/**
 * Check if a quest requires 2 fails
 */
export function requiresTwoFails(
  playerCount: number,
  questNumber: number
): boolean {
  const req = getQuestRequirement(playerCount, questNumber);
  return req.fails === 2;
}

/**
 * Validate player count for quest configuration
 */
export function isValidPlayerCount(playerCount: number): boolean {
  return playerCount >= 5 && playerCount <= 10;
}

