/**
 * Team Validation
 * Validate team proposals
 */

/**
 * Team validation result
 */
export interface TeamValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Validate a team proposal
 * 
 * @param teamMemberIds Proposed team member IDs
 * @param requiredSize Required team size for this quest
 * @param validPlayerIds All valid player IDs in the game
 */
export function validateTeamProposal(
  teamMemberIds: string[],
  requiredSize: number,
  validPlayerIds: string[]
): TeamValidationResult {
  // Check team size
  if (teamMemberIds.length !== requiredSize) {
    return {
      valid: false,
      error: `Team must have exactly ${requiredSize} members, got ${teamMemberIds.length}`,
    };
  }
  
  // Check for duplicates
  const uniqueIds = new Set(teamMemberIds);
  if (uniqueIds.size !== teamMemberIds.length) {
    return {
      valid: false,
      error: 'Team cannot have duplicate members',
    };
  }
  
  // Check all members are valid players in the game
  const validSet = new Set(validPlayerIds);
  const invalidMembers = teamMemberIds.filter((id) => !validSet.has(id));
  
  if (invalidMembers.length > 0) {
    return {
      valid: false,
      error: 'Team contains invalid player IDs',
    };
  }
  
  return {
    valid: true,
    error: null,
  };
}

/**
 * Check if a player is on the team
 */
export function isPlayerOnTeam(
  teamMemberIds: string[],
  playerId: string
): boolean {
  return teamMemberIds.includes(playerId);
}

/**
 * Check if leader is proposing themselves on the team
 * (This is allowed in Avalon)
 */
export function isLeaderOnTeam(
  teamMemberIds: string[],
  leaderId: string
): boolean {
  return teamMemberIds.includes(leaderId);
}

/**
 * Get team member count
 */
export function getTeamSize(teamMemberIds: string[]): number {
  return teamMemberIds.length;
}

/**
 * Check if team proposal has the required size
 */
export function hasCorrectTeamSize(
  teamMemberIds: string[],
  requiredSize: number
): boolean {
  return teamMemberIds.length === requiredSize;
}

/**
 * Validate that proposer is the current leader
 */
export function validateProposer(
  proposerId: string,
  currentLeaderId: string
): TeamValidationResult {
  if (proposerId !== currentLeaderId) {
    return {
      valid: false,
      error: 'Only the current leader can propose a team',
    };
  }
  
  return {
    valid: true,
    error: null,
  };
}

