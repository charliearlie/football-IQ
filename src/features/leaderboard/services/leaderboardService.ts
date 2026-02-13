/**
 * Leaderboard Service
 *
 * Service layer for fetching leaderboard data from Supabase RPCs.
 */

import { supabase } from '@/lib/supabase';
import {
  LeaderboardEntry,
  UserRank,
  DailyLeaderboardOptions,
  GlobalLeaderboardOptions,
} from '../types/leaderboard.types';

/**
 * Response from get_daily_leaderboard RPC.
 */
interface DailyLeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  daily_score: number;
  games_played: number;
  last_completed_at: string;
}

/**
 * Response from get_global_iq_leaderboard RPC.
 */
interface GlobalLeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  global_iq: number;
  total_games: number;
}

/**
 * Response from get_user_rank RPC.
 */
interface UserRankRow {
  rank: number;
  score: number;
  total_users: number;
}

/**
 * Transform daily leaderboard RPC response to LeaderboardEntry.
 */
function transformDailyEntry(row: DailyLeaderboardRow): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    score: row.daily_score,
    gamesPlayed: row.games_played,
    lastCompletedAt: row.last_completed_at,
  };
}

/**
 * Transform global IQ leaderboard RPC response to LeaderboardEntry.
 */
function transformGlobalEntry(row: GlobalLeaderboardRow): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    score: row.global_iq,
    gamesPlayed: row.total_games,
  };
}

/**
 * Fetch the daily leaderboard.
 *
 * Returns top users ranked by normalized daily score (0-500).
 *
 * @param options - Optional date and limit configuration
 * @returns Array of leaderboard entries
 */
export async function getDailyLeaderboard(
  options: DailyLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const { date, limit = 100 } = options;

  const { data, error } = await supabase.rpc('get_daily_leaderboard', {
    for_date: date ?? new Date().toISOString().split('T')[0],
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching daily leaderboard:', error);
    throw new Error(`Failed to fetch daily leaderboard: ${error.message}`);
  }

  return (data as DailyLeaderboardRow[]).map(transformDailyEntry);
}

/**
 * Fetch the global IQ leaderboard.
 *
 * Returns top users ranked by weighted global IQ (0-100).
 *
 * @param options - Optional limit configuration
 * @returns Array of leaderboard entries
 */
export async function getGlobalIQLeaderboard(
  options: GlobalLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const { limit = 100 } = options;

  const { data, error } = await supabase.rpc('get_global_iq_leaderboard', {
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching global IQ leaderboard:', error);
    throw new Error(`Failed to fetch global IQ leaderboard: ${error.message}`);
  }

  return (data as GlobalLeaderboardRow[]).map(transformGlobalEntry);
}

/**
 * Fetch a specific user's rank on either leaderboard.
 *
 * Used for the sticky "Me" bar when user is outside top 100.
 *
 * @param userId - User ID to look up
 * @param type - 'daily' or 'global'
 * @param date - Optional date for daily leaderboard
 * @returns User's rank info or null if not found
 */
export async function getUserRank(
  userId: string,
  type: 'daily' | 'global' = 'daily',
  date?: string
): Promise<UserRank | null> {
  const { data, error } = await supabase.rpc('get_user_rank', {
    target_user_id: userId,
    leaderboard_type: type,
    for_date: date ?? new Date().toISOString().split('T')[0],
  });

  if (error) {
    console.error('Error fetching user rank:', error);
    throw new Error(`Failed to fetch user rank: ${error.message}`);
  }

  const rows = data as UserRankRow[];

  // If user has no completed puzzles, they won't be in the leaderboard
  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    rank: row.rank,
    score: row.score,
    totalUsers: row.total_users,
  };
}

/**
 * Fetch both leaderboard entries and current user's rank.
 *
 * Optimized for the leaderboard screen to make both calls in parallel.
 *
 * @param userId - Current user's ID
 * @param type - 'daily' or 'global'
 * @param options - Leaderboard options
 * @returns Object with entries and userRank
 */
export async function getLeaderboardWithUserRank(
  userId: string,
  type: 'daily' | 'global',
  options: DailyLeaderboardOptions | GlobalLeaderboardOptions = {}
): Promise<{
  entries: LeaderboardEntry[];
  userRank: UserRank | null;
}> {
  const date = 'date' in options ? options.date : undefined;

  // Fetch both in parallel
  const [entries, userRank] = await Promise.all([
    type === 'daily'
      ? getDailyLeaderboard(options as DailyLeaderboardOptions)
      : getGlobalIQLeaderboard(options as GlobalLeaderboardOptions),
    getUserRank(userId, type, date),
  ]);

  return { entries, userRank };
}
