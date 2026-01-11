/**
 * Player service exports.
 * Provides local-first search functionality for the player database.
 */

// Search service
export {
  searchPlayers,
  getPlayerById,
  didPlayerPlayFor,
  hasNationality,
  findPlayersMatchingCriteria,
} from './playerSearch';

// Utility functions
export {
  normalizeSearchName,
  levenshteinDistance,
  countryCodeToEmoji,
  calculateRelevance,
  clubsMatch,
} from './playerUtils';

// Re-export types for convenience
export type {
  LocalPlayer,
  ParsedPlayer,
  PlayerSearchResult,
} from '@/types/database';
