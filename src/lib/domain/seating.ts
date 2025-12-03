/**
 * Seating Order & Leader Rotation
 * Handles randomization and clockwise rotation
 */

/**
 * Fisher-Yates shuffle algorithm
 * Creates a new shuffled array (does not mutate original)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Randomize player seating order
 * @param playerIds Array of player IDs
 * @returns New array with randomized order
 */
export function randomizeSeating(playerIds: string[]): string[] {
  if (playerIds.length < 2) {
    return [...playerIds];
  }
  return shuffleArray(playerIds);
}

/**
 * Select random first leader from seating order
 * @param seatingOrder Randomized player IDs
 * @returns Index of first leader (0 to length-1)
 */
export function selectRandomLeaderIndex(seatingOrder: string[]): number {
  if (seatingOrder.length === 0) {
    throw new Error('Cannot select leader from empty seating order');
  }
  return Math.floor(Math.random() * seatingOrder.length);
}

/**
 * Get next leader index (clockwise rotation)
 * @param currentIndex Current leader index
 * @param totalPlayers Total number of players
 * @returns Next leader index (wraps around)
 */
export function getNextLeaderIndex(
  currentIndex: number,
  totalPlayers: number
): number {
  return (currentIndex + 1) % totalPlayers;
}

/**
 * Get leader ID from seating order
 * @param seatingOrder Array of player IDs in seat order
 * @param leaderIndex Current leader index
 */
export function getLeaderId(
  seatingOrder: string[],
  leaderIndex: number
): string {
  if (leaderIndex < 0 || leaderIndex >= seatingOrder.length) {
    throw new Error(`Invalid leader index: ${leaderIndex}`);
  }
  return seatingOrder[leaderIndex];
}

/**
 * Get seat position for a player
 * @param seatingOrder Array of player IDs in seat order
 * @param playerId Player to find
 * @returns Seat position (0-indexed) or -1 if not found
 */
export function getSeatPosition(
  seatingOrder: string[],
  playerId: string
): number {
  return seatingOrder.indexOf(playerId);
}

/**
 * Check if player is current leader
 */
export function isCurrentLeader(
  seatingOrder: string[],
  leaderIndex: number,
  playerId: string
): boolean {
  return seatingOrder[leaderIndex] === playerId;
}

/**
 * Get players in seating order with positions
 */
export function getSeatingWithPositions(
  seatingOrder: string[],
  leaderIndex: number
): Array<{ playerId: string; position: number; isLeader: boolean }> {
  return seatingOrder.map((playerId, position) => ({
    playerId,
    position,
    isLeader: position === leaderIndex,
  }));
}

/**
 * Initialize game seating
 * @param playerIds Array of player IDs (from room_players)
 * @returns Seating setup with randomized order and first leader
 */
export function initializeSeating(playerIds: string[]): {
  seatingOrder: string[];
  leaderIndex: number;
  leaderId: string;
} {
  const seatingOrder = randomizeSeating(playerIds);
  const leaderIndex = selectRandomLeaderIndex(seatingOrder);
  const leaderId = seatingOrder[leaderIndex];
  
  return {
    seatingOrder,
    leaderIndex,
    leaderId,
  };
}

