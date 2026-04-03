"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Get paywall conversion metrics grouped by trigger source.
 */
export async function getPaywallMetrics() {
  const supabase = await createAdminClient();

  // Total premium users
  const { count: totalPremium } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_premium", true);

  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Users who played at least once
  const { count: activePlayers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_iq", 0);

  return {
    totalUsers: totalUsers ?? 0,
    totalPremium: totalPremium ?? 0,
    activePlayers: activePlayers ?? 0,
    conversionRate: totalUsers ? ((totalPremium ?? 0) / totalUsers * 100).toFixed(1) : "0",
    activeConversionRate: activePlayers ? ((totalPremium ?? 0) / activePlayers * 100).toFixed(1) : "0",
  };
}

/**
 * Get retention cohort data.
 * Returns how many users from each signup week are still active at D1, D7, D30.
 */
export async function getRetentionMetrics() {
  const supabase = await createAdminClient();
  const now = new Date();

  // Users who signed up in the last 30 days with activity data
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago1d = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, created_at, updated_at, total_iq")
    .gt("total_iq", 0);

  if (!allProfiles) return { d1: 0, d7: 0, d30: 0, total: 0 };

  // D1: users who were active in the last 24h
  const d1Active = allProfiles.filter(p => p.updated_at && p.updated_at > ago1d).length;
  // D7: users active in the last 7 days
  const d7Active = allProfiles.filter(p => p.updated_at && p.updated_at > ago7d).length;
  // D30: users active in the last 30 days
  const d30Active = allProfiles.filter(p => p.updated_at && p.updated_at > ago30d).length;

  return {
    d1: allProfiles.length > 0 ? (d1Active / allProfiles.length * 100).toFixed(1) : "0",
    d7: allProfiles.length > 0 ? (d7Active / allProfiles.length * 100).toFixed(1) : "0",
    d30: allProfiles.length > 0 ? (d30Active / allProfiles.length * 100).toFixed(1) : "0",
    totalActive: allProfiles.length,
    d1Active,
    d7Active,
    d30Active,
  };
}

/**
 * Get referral funnel metrics.
 */
export async function getReferralMetrics() {
  const supabase = await createAdminClient();

  // Users with referral codes (generated a code)
  const { count: codesGenerated } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("referral_code", "is", null);

  // Challenge metrics
  const { count: challengesCreated } = await supabase
    .from("challenges")
    .select("*", { count: "exact", head: true });

  const { count: challengeResponses } = await supabase
    .from("challenge_responses")
    .select("*", { count: "exact", head: true });

  return {
    referralCodesGenerated: codesGenerated ?? 0,
    challengesCreated: challengesCreated ?? 0,
    challengeResponses: challengeResponses ?? 0,
    challengeConversionRate: challengesCreated
      ? ((challengeResponses ?? 0) / challengesCreated * 100).toFixed(1)
      : "0",
  };
}

/**
 * Get push notification metrics.
 */
export async function getPushMetrics() {
  const supabase = await createAdminClient();

  // Total push tokens
  const { count: totalTokens } = await supabase
    .from("push_tokens")
    .select("*", { count: "exact", head: true });

  // Recent notifications (last 30 days)
  const ago30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentNotifications } = await supabase
    .from("sent_notifications")
    .select("id, title, recipient_count, sent_at")
    .gt("sent_at", ago30d)
    .order("sent_at", { ascending: false })
    .limit(20);

  // Notification opens
  const { data: openCounts } = await supabase
    .from("notification_opens")
    .select("notification_id")
    .gt("opened_at", ago30d);

  // Calculate open rates per notification
  const openCountMap = new Map<string, number>();
  for (const open of openCounts ?? []) {
    if (!open.notification_id) continue;
    openCountMap.set(open.notification_id, (openCountMap.get(open.notification_id) ?? 0) + 1);
  }

  const notificationsWithOpenRate = (recentNotifications ?? []).map(n => ({
    ...n,
    opens: openCountMap.get(n.id) ?? 0,
    openRate: n.recipient_count
      ? (((openCountMap.get(n.id) ?? 0) / n.recipient_count) * 100).toFixed(1)
      : "0",
  }));

  return {
    totalTokens: totalTokens ?? 0,
    recentNotifications: notificationsWithOpenRate,
    totalOpens: openCounts?.length ?? 0,
  };
}

/**
 * Get key headline metrics.
 */
export async function getHeadlineMetrics() {
  const supabase = await createAdminClient();

  // Total games played
  const { count: totalGames } = await supabase
    .from("puzzle_attempts")
    .select("*", { count: "exact", head: true })
    .eq("completed", true);

  // Games today
  const today = new Date().toISOString().split("T")[0];
  const { count: gamesToday } = await supabase
    .from("puzzle_attempts")
    .select("*", { count: "exact", head: true })
    .eq("completed", true)
    .gte("completed_at", today);

  // Average IQ
  const { data: avgData } = await supabase
    .from("profiles")
    .select("total_iq")
    .gt("total_iq", 0);

  const avgIQ = avgData && avgData.length > 0
    ? Math.round(avgData.reduce((sum, p) => sum + p.total_iq, 0) / avgData.length)
    : 0;

  return {
    totalGames: totalGames ?? 0,
    gamesToday: gamesToday ?? 0,
    avgIQ,
  };
}
