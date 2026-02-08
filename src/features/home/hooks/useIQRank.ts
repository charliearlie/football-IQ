/**
 * Rank definitions based on games played.
 */
export const IQ_RANKS = [
  { min: 0, title: 'Bench Warmer' },
  { min: 10, title: 'Academy Prospect' },
  { min: 25, title: 'Squad Player' },
  { min: 50, title: 'Starting XI' },
  { min: 100, title: 'Captain' },
  { min: 250, title: 'Club Legend' },
  { min: 500, title: 'Hall of Famer' },
] as const;

export type IQRankTitle = typeof IQ_RANKS[number]['title'];

/**
 * Hook to determine the user's Football IQ Rank.
 * 
 * @param totalGamesPlayed - Total number of games completed by the user
 * @returns The rank title corresponding to the games played
 */
export function useIQRank(totalGamesPlayed: number): IQRankTitle {
  // Find the highest rank where min <= totalGamesPlayed
  // We iterate in reverse order or use findLast/find logic
  // Since the array is sorted by min ascending, we can find the last one that matches
  
  const rank = [...IQ_RANKS].reverse().find(r => totalGamesPlayed >= r.min);
  
  return rank ? rank.title : IQ_RANKS[0].title;
}
