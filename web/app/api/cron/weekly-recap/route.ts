/**
 * Weekly Recap push notification.
 *
 * Sends a personalised weekly summary to active users:
 * "This week: 4/7 days played, +340 IQ. You're a Scout. Keep going."
 *
 * Schedule: 0 18 * * 0 (Sunday 6pm UTC)
 * Configure in vercel.json:
 *   { "path": "/api/cron/weekly-recap", "schedule": "0 18 * * 0" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushBatch, logSentNotification, validateCronSecret } from "@/lib/push";
import { IQ_TIERS } from "@/lib/tiers";

export const runtime = "nodejs";
export const maxDuration = 120;

function getTierName(totalIq: number): string {
  for (let i = IQ_TIERS.length - 1; i >= 0; i--) {
    if (totalIq >= IQ_TIERS[i].minPoints) return IQ_TIERS[i].name;
  }
  return "Intern";
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find users who were active in the last 7 days (updated_at on profiles)
  const { data: activeProfiles } = await supabase
    .from("profiles")
    .select("id, total_iq")
    .gt("updated_at", weekAgo)
    .gt("total_iq", 0);

  if (!activeProfiles || activeProfiles.length === 0) {
    return NextResponse.json({ message: "No active users this week", sent: 0 });
  }

  const userIds = activeProfiles.map((p) => p.id);

  // Count distinct days played this week per user
  const { data: attempts } = await supabase
    .from("puzzle_attempts")
    .select("user_id, completed_at")
    .in("user_id", userIds)
    .eq("completed", true)
    .gt("completed_at", weekAgo);

  // Calculate days played per user
  const daysPlayedMap = new Map<string, Set<string>>();
  for (const attempt of attempts ?? []) {
    if (!attempt.user_id || !attempt.completed_at) continue;
    const day = attempt.completed_at.split("T")[0];
    const existing = daysPlayedMap.get(attempt.user_id) ?? new Set();
    existing.add(day);
    daysPlayedMap.set(attempt.user_id, existing);
  }

  // Get push tokens
  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("token, user_id")
    .in("user_id", userIds);

  if (!tokenRows || tokenRows.length === 0) {
    return NextResponse.json({ message: "No push tokens for active users", sent: 0 });
  }

  // Group tokens by user
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows) {
    const existing = tokensByUser.get(row.user_id) ?? [];
    existing.push(row.token);
    tokensByUser.set(row.user_id, existing);
  }

  // Build profile lookup
  const profileMap = new Map(activeProfiles.map((p) => [p.id, p]));

  // Send personalised messages per user
  let totalSent = 0;
  let totalFailed = 0;

  // Batch users into groups to avoid sending thousands of individual requests.
  // Group by (daysPlayed, tierName) for efficiency.
  const messageGroups = new Map<string, string[]>();

  for (const [userId, tokens] of tokensByUser) {
    const profile = profileMap.get(userId);
    if (!profile) continue;

    const daysPlayed = daysPlayedMap.get(userId)?.size ?? 0;
    if (daysPlayed === 0) continue; // Skip users with no completed games this week

    const tierName = getTierName(profile.total_iq);
    const key = `${daysPlayed}|${tierName}`;

    const existing = messageGroups.get(key) ?? [];
    existing.push(...tokens);
    messageGroups.set(key, existing);
  }

  for (const [key, tokens] of messageGroups) {
    const [daysStr, tierName] = key.split("|");
    const days = parseInt(daysStr, 10);

    const body = `This week: ${days}/7 days played. You're a ${tierName}. ${days >= 5 ? "Incredible consistency!" : "Keep going!"}`;

    const result = await sendPushBatch(tokens, "📊 Your Weekly Recap", body);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  if (totalSent > 0) {
    await logSentNotification(
      "📊 Your Weekly Recap",
      "Personalised weekly recap",
      totalSent,
      "weekly_recap",
    );
  }

  return NextResponse.json({
    message: "Weekly recap notifications sent",
    sent: totalSent,
    failed: totalFailed,
    activeUsers: activeProfiles.length,
  });
}
