/**
 * Wraps the `claim_play_history` Supabase RPC.
 *
 * Call this once after a previously-anonymous user upgrades to an
 * email-backed account so their server-side puzzle_attempts move with
 * them. Stash the previous anon user id in localStorage during anonymous
 * play (`fiq.anonUserId`) and pass it here post-sign-in. Idempotent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const ANON_USER_ID_KEY = "fiq.anonUserId";
const CLAIM_DONE_KEY = "fiq.anonClaimDone";

export interface ClaimHistoryResult {
  moved: number;
  skipped: number;
}

export function getStoredAnonUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ANON_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function rememberAnonUserId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANON_USER_ID_KEY, id);
  } catch {
    // localStorage may be unavailable — bridging just won't fire later.
  }
}

export function hasAlreadyClaimed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLAIM_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markClaimComplete(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAIM_DONE_KEY, "1");
    window.localStorage.removeItem(ANON_USER_ID_KEY);
  } catch {
    // best-effort
  }
}

export async function claimPlayHistory(
  supabase: SupabaseClient,
  anonymousId: string,
): Promise<ClaimHistoryResult> {
  const { data, error } = await supabase.rpc("claim_play_history", {
    p_anonymous_id: anonymousId,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    moved: Number(row?.moved_count ?? 0),
    skipped: Number(row?.skipped_count ?? 0),
  };
}
