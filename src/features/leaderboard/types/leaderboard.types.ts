/**
 * Leaderboard Type Definitions
 *
 * Types for leaderboard data, entries, and related functionality.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';

/**
 * Type of leaderboard view.
 */
export type LeaderboardType = 'daily' | 'global';

/**
 * A single entry in the leaderboard.
 */
export interface LeaderboardEntry {
  /** User's rank position (dense ranking) */
  rank: number;
  /** User ID (UUID) */
  userId: string;
  /** Display name shown on leaderboard */
  displayName: string;
  /** Avatar URL (optional) */
  avatarUrl: string | null;
  /** Score value (daily_score 0-500 or global_iq 0-100) */
  score: number;
  /** Number of games played (daily leaderboard only) */
  gamesPlayed?: number;
  /** Timestamp of last completed puzzle (for tie-breaking display) */
  lastCompletedAt?: string;
}

/**
 * Current user's rank information.
 */
export interface UserRank {
  /** User's rank position */
  rank: number;
  /** User's score */
  score: number;
  /** Total number of users on leaderboard */
  totalUsers: number;
}

/**
 * Result from useLeaderboard hook.
 */
export interface UseLeaderboardResult {
  /** List of leaderboard entries (top 100) */
  entries: LeaderboardEntry[];
  /** Current user's rank (may be outside top 100) */
  userRank: UserRank | null;
  /** Loading state */
  isLoading: boolean;
  /** Refreshing state (pull-to-refresh) */
  isRefreshing: boolean;
  /** Error state */
  error: Error | null;
  /** Manual refresh function */
  refresh: () => Promise<void>;
}

/**
 * Options for fetching daily leaderboard.
 */
export interface DailyLeaderboardOptions {
  /** Date to fetch leaderboard for (defaults to today) */
  date?: string;
  /** Maximum entries to return (defaults to 100) */
  limit?: number;
}

/**
 * Options for fetching global IQ leaderboard.
 */
export interface GlobalLeaderboardOptions {
  /** Maximum entries to return (defaults to 100) */
  limit?: number;
}

/**
 * Score normalization result for a single game mode attempt.
 */
export interface NormalizedScore {
  /** Game mode */
  gameMode: GameMode;
  /** Normalized score (0-100) */
  normalizedScore: number;
  /** Whether attempt was completed */
  completed: boolean;
}

/**
 * Daily score calculation result.
 */
export interface DailyScoreResult {
  /** Total normalized score (0-500 max) */
  totalScore: number;
  /** Number of game modes completed today */
  gamesPlayed: number;
  /** Breakdown by game mode */
  breakdown: NormalizedScore[];
}

/**
 * Configuration for sticky "Me" bar visibility.
 */
export interface StickyMeConfig {
  /** Whether the current user is visible in the list */
  isUserVisible: boolean;
  /** Index of current user in entries (-1 if not in top 100) */
  userIndex: number;
  /** Whether to show the sticky bar */
  shouldShowStickyBar: boolean;
}
