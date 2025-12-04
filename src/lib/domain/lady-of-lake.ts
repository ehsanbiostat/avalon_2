/**
 * Lady of the Lake Domain Logic
 * Handles investigation phase mechanics
 */

/**
 * Check if Lady phase should trigger after quest result
 * Lady phase occurs after Quest 2, 3, and 4 if enabled and valid targets exist
 */
export function shouldTriggerLadyPhase(
  questNumber: number,
  ladyEnabled: boolean,
  investigatedPlayerIds: string[],
  allPlayerIds: string[],
  ladyHolderId: string | null
): boolean {
  // Only after Quest 2, 3, 4
  if (questNumber < 2 || questNumber > 4) return false;
  
  // Lady must be enabled
  if (!ladyEnabled) return false;
  
  // Must have a Lady holder
  if (!ladyHolderId) return false;
  
  // Must have valid targets (at least 1 uninvestigated player besides holder)
  const validTargets = getValidTargets(allPlayerIds, investigatedPlayerIds, ladyHolderId);
  return validTargets.length > 0;
}

/**
 * Get valid investigation targets
 * Excludes the Lady holder and already investigated players
 */
export function getValidTargets(
  allPlayerIds: string[],
  investigatedPlayerIds: string[],
  holderId: string
): string[] {
  return allPlayerIds.filter(
    (id) => id !== holderId && !investigatedPlayerIds.includes(id)
  );
}

/**
 * Validate investigation target
 * Returns error message if invalid, null if valid
 */
export function validateInvestigationTarget(
  targetId: string,
  holderId: string,
  investigatedPlayerIds: string[],
  allPlayerIds: string[]
): string | null {
  if (targetId === holderId) {
    return 'Cannot investigate yourself';
  }
  if (investigatedPlayerIds.includes(targetId)) {
    return 'This player has already been investigated';
  }
  if (!allPlayerIds.includes(targetId)) {
    return 'Invalid player';
  }
  return null; // Valid
}

/**
 * Determine investigation result based on player's role
 * Returns 'good' or 'evil' (NOT the special role)
 */
export function getInvestigationResult(role: 'good' | 'evil'): 'good' | 'evil' {
  return role;
}

/**
 * Check if player is the Lady holder
 */
export function isLadyHolder(playerId: string, ladyHolderId: string | null): boolean {
  return ladyHolderId !== null && playerId === ladyHolderId;
}

/**
 * Check if player has been investigated
 */
export function hasBeenInvestigated(
  playerId: string,
  investigatedPlayerIds: string[]
): boolean {
  return investigatedPlayerIds.includes(playerId);
}

/**
 * Get quests that have Lady phase
 * Lady phase occurs after Quest 2, 3, and 4
 */
export function getQuestsWithLadyPhase(): number[] {
  return [2, 3, 4];
}

/**
 * Check if a quest number has Lady phase
 */
export function questHasLadyPhase(questNumber: number): boolean {
  return questNumber >= 2 && questNumber <= 4;
}

