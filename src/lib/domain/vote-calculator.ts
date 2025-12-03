/**
 * Vote Calculator
 * Determines vote outcomes (approval/rejection)
 */

import type { ProposalStatus } from '@/types/game';

/**
 * Vote result details
 */
export interface VoteResult {
  status: ProposalStatus;
  approveCount: number;
  rejectCount: number;
  isApproved: boolean;
}

/**
 * Calculate vote result
 * Majority approve = approved, tie or majority reject = rejected
 * 
 * @param approveCount Number of approve votes
 * @param rejectCount Number of reject votes
 * @param totalPlayers Total players who should vote
 */
export function calculateVoteResult(
  approveCount: number,
  rejectCount: number,
  totalPlayers: number
): VoteResult {
  const totalVotes = approveCount + rejectCount;
  
  // Should not calculate until all votes are in
  if (totalVotes !== totalPlayers) {
    throw new Error(`Incomplete voting: ${totalVotes}/${totalPlayers} votes`);
  }
  
  // Majority required to approve (more than half)
  // Tie goes to rejection
  const isApproved = approveCount > rejectCount;
  
  return {
    status: isApproved ? 'approved' : 'rejected',
    approveCount,
    rejectCount,
    isApproved,
  };
}

/**
 * Check if all players have voted
 */
export function allVotesReceived(
  votesSubmitted: number,
  totalPlayers: number
): boolean {
  return votesSubmitted === totalPlayers;
}

/**
 * Check if vote track has reached 5 (Evil wins)
 */
export function isFiveRejections(voteTrack: number): boolean {
  return voteTrack >= 5;
}

/**
 * Get updated vote track after rejection
 * @param currentVoteTrack Current rejection count
 * @returns New vote track value
 */
export function incrementVoteTrack(currentVoteTrack: number): number {
  return currentVoteTrack + 1;
}

/**
 * Check if this rejection would be the 5th
 * @param currentVoteTrack Current rejection count (before this rejection)
 */
export function wouldBeFifthRejection(currentVoteTrack: number): boolean {
  return currentVoteTrack === 4; // 4 + 1 = 5
}

/**
 * Calculate vote percentage
 */
export function getVotePercentage(
  approveCount: number,
  totalVotes: number
): number {
  if (totalVotes === 0) return 0;
  return Math.round((approveCount / totalVotes) * 100);
}

