/**
 * Leaderboard Service
 *
 * Service layer for fetching leaderboard data from Supabase RPCs.
 */

import { supabase } from '@/lib/supabase';
import { getTierForPoints, getTierColor } from '@/features/stats/utils/tierProgression';
import {
  LeaderboardEntry,
  LeaderboardType,
  UserRank,
  DailyLeaderboardOptions,
  YearlyLeaderboardOptions,
  AlltimeLeaderboardOptions,
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
 * Response from get_alltime_leaderboard RPC.
 */
interface AlltimeLeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_iq: number;
  total_games: number;
}

/**
 * Response from get_yearly_leaderboard RPC.
 */
interface YearlyLeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  yearly_score: number;
  games_played: number;
  last_completed_at: string;
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
 * Transform alltime leaderboard RPC response to LeaderboardEntry.
 * Enriches with tier name and color from the tier progression system.
 */
function transformAlltimeEntry(row: AlltimeLeaderboardRow): LeaderboardEntry {
  const tier = getTierForPoints(row.total_iq);
  return {
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    score: row.total_iq,
    gamesPlayed: row.total_games,
    tierName: tier.name,
    tierColor: getTierColor(tier.tier),
  };
}

/**
 * Transform yearly leaderboard RPC response to LeaderboardEntry.
 */
function transformYearlyEntry(row: YearlyLeaderboardRow): LeaderboardEntry {
  return {
    rank: row.rank,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    score: row.yearly_score,
    gamesPlayed: row.games_played,
    lastCompletedAt: row.last_completed_at,
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
 * Fetch the all-time leaderboard.
 *
 * Returns top users ranked by cumulative total IQ points.
 *
 * @param options - Optional limit configuration
 * @returns Array of leaderboard entries with tier information
 */
export async function getGlobalIQLeaderboard(
  options: AlltimeLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const { limit = 100 } = options;

  const { data, error } = await supabase.rpc('get_alltime_leaderboard', {
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching alltime leaderboard:', error);
    throw new Error(`Failed to fetch alltime leaderboard: ${error.message}`);
  }

  return (data as AlltimeLeaderboardRow[]).map(transformAlltimeEntry);
}

/**
 * Fetch the yearly leaderboard.
 *
 * Returns top users ranked by total score accumulated during the given year.
 *
 * @param options - Optional year and limit configuration
 * @returns Array of leaderboard entries
 */
export async function getYearlyLeaderboard(
  options: YearlyLeaderboardOptions = {}
): Promise<LeaderboardEntry[]> {
  const { year = new Date().getFullYear(), limit = 100 } = options;

  const { data, error } = await supabase.rpc('get_yearly_leaderboard', {
    for_year: year,
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching yearly leaderboard:', error);
    throw new Error(`Failed to fetch yearly leaderboard: ${error.message}`);
  }

  return (data as YearlyLeaderboardRow[]).map(transformYearlyEntry);
}

/**
 * Fetch a specific user's rank on any leaderboard.
 *
 * Used for the sticky "Me" bar when user is outside top 100.
 *
 * @param userId - User ID to look up
 * @param type - Leaderboard type
 * @param date - Optional date for daily leaderboard
 * @returns User's rank info or null if not found
 */
export async function getUserRank(
  userId: string,
  type: LeaderboardType = 'daily',
  date?: string
): Promise<UserRank | null> {
  // The RPC expects 'alltime' for the global/all-time leaderboard
  const rpcType = type === 'global' ? 'alltime' : type;

  const { data, error } = await supabase.rpc('get_user_rank', {
    target_user_id: userId,
    leaderboard_type: rpcType,
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
 * @param type - Leaderboard type
 * @param options - Leaderboard options
 * @returns Object with entries and userRank
 */
export async function getLeaderboardWithUserRank(
  userId: string,
  type: LeaderboardType,
  options: DailyLeaderboardOptions | YearlyLeaderboardOptions | AlltimeLeaderboardOptions = {}
): Promise<{
  entries: LeaderboardEntry[];
  userRank: UserRank | null;
}> {
  const date = type === 'daily' ? (options as DailyLeaderboardOptions).date : undefined;

  const getEntries = (): Promise<LeaderboardEntry[]> => {
    switch (type) {
      case 'daily':
        return getDailyLeaderboard(options as DailyLeaderboardOptions);
      case 'yearly':
        return getYearlyLeaderboard(options as YearlyLeaderboardOptions);
      case 'global':
        return getGlobalIQLeaderboard(options as AlltimeLeaderboardOptions);
    }
  };

  // Fetch both in parallel
  const [entries, userRank] = await Promise.all([
    getEntries(),
    getUserRank(userId, type, date),
  ]);

  return { entries, userRank };
}
