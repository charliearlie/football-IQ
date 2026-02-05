/**
 * Server-side Grid cell validation using Supabase.
 *
 * Port of the mobile checkCategoryMatch() from
 * src/features/the-grid/utils/validation.ts, adapted to query
 * Supabase instead of local SQLite.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { GridCategory, CellValidationResult } from "./types";
import { COUNTRY_NAME_TO_CODE } from "./types";
import { checkTrophyMatch, checkStatMatch } from "./achievementMapping";

/**
 * Check if a player satisfies two criteria simultaneously (the "Relational Triangle").
 *
 * @param supabase - Supabase admin client
 * @param playerQid - Wikidata QID of the player
 * @param criteriaA - First category (e.g., row)
 * @param criteriaB - Second category (e.g., column)
 */
export async function checkGridCell(
  supabase: SupabaseClient | { from: (table: string) => unknown },
  playerQid: string,
  criteriaA: GridCategory,
  criteriaB: GridCategory
): Promise<CellValidationResult> {
  const matchedA = await checkCategoryMatchSupabase(
    supabase,
    playerQid,
    criteriaA
  );
  const matchedB = await checkCategoryMatchSupabase(
    supabase,
    playerQid,
    criteriaB
  );

  return {
    isValid: matchedA && matchedB,
    matchedA,
    matchedB,
  };
}

/**
 * Check if a player matches a single category criterion using Supabase.
 *
 * @param supabase - Supabase client (admin or mock)
 * @param playerQid - Wikidata QID of the player
 * @param category - Grid category to check
 */
export async function checkCategoryMatchSupabase(
  supabase: SupabaseClient | { from: (table: string) => unknown },
  playerQid: string,
  category: GridCategory
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;

  switch (category.type) {
    case "club": {
      const { data } = await client
        .from("player_appearances")
        .select("club_id, clubs!inner(name)")
        .eq("player_id", playerQid)
        .ilike("clubs.name", category.value)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }

    case "nation": {
      const code = COUNTRY_NAME_TO_CODE[category.value];
      if (!code) {
        return false;
      }
      const { data } = await client
        .from("players")
        .select("id")
        .eq("id", playerQid)
        .eq("nationality_code", code)
        .limit(1);
      return (data?.length ?? 0) > 0;
    }

    case "trophy": {
      const { data } = await client
        .from("players")
        .select("stats_cache")
        .eq("id", playerQid)
        .single();
      if (!data?.stats_cache) return false;
      return checkTrophyMatch(
        category.value,
        data.stats_cache as Record<string, number>
      );
    }

    case "stat": {
      const { data } = await client
        .from("players")
        .select("stats_cache")
        .eq("id", playerQid)
        .single();
      if (!data?.stats_cache) return false;
      return checkStatMatch(
        category.value,
        data.stats_cache as Record<string, number>
      );
    }

    default:
      return false;
  }
}
