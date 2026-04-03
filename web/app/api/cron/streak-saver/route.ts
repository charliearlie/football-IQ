/**
 * Server-side Streak Saver cron.
 *
 * Replaces the client-side local notification that only fires if the
 * user has already opened the app that day. This ensures users with
 * active streaks who haven't played today get a push notification.
 *
 * Schedule: 0 19 * * * (7pm UTC — evening for UK/EU users)
 * Configure in vercel.json:
 *   { "path": "/api/cron/streak-saver", "schedule": "0 19 * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushBatch, logSentNotification, validateCronSecret } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Rotating streak saver messages — personalised with streak count. */
const MESSAGES = [
  (days: number) => `Your ${days}-day streak ends at midnight. Today's challenge takes 90 seconds.`,
  (days: number) => `${days} days and counting. Don't let it slip — one game keeps it alive.`,
  (days: number) => `Your ${days}-day streak is on the line. Quick game before bed?`,
  (days: number) => `${days} days strong. Keep the momentum — play before midnight.`,
  (days: number) => `Don't break a ${days}-day streak. One puzzle is all it takes.`,
];

function getMessageForDay(streakDays: number): { title: string; body: string } {
  const dayOfYear = Math.floor(Date.now() / 86400000);
  const message = MESSAGES[dayOfYear % MESSAGES.length];
  return {
    title: "🔥 Streak at Risk",
    body: message(streakDays),
  };
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Find users with active streaks who haven't played today.
  // user_streaks tracks per-game-mode streaks. We want users where ANY
  // mode has current_streak > 0 but last_played_date < today.
  //
  // Strategy: find all user_ids with at-risk streaks, deduplicate,
  // then get their push tokens.
  const { data: atRiskStreaks, error: streakError } = await supabase
    .from("user_streaks")
    .select("user_id, current_streak")
    .gt("current_streak", 0)
    .lt("last_played_date", today);

  if (streakError) {
    console.error("[streak-saver] Failed to query streaks:", streakError.message);
    return NextResponse.json({ error: streakError.message }, { status: 500 });
  }

  if (!atRiskStreaks || atRiskStreaks.length === 0) {
    return NextResponse.json({ message: "No at-risk streaks", sent: 0 });
  }

  // Deduplicate by user_id, keeping the highest streak count
  const userStreakMap = new Map<string, number>();
  for (const row of atRiskStreaks) {
    if (!row.user_id) continue;
    const existing = userStreakMap.get(row.user_id) ?? 0;
    if ((row.current_streak ?? 0) > existing) {
      userStreakMap.set(row.user_id, row.current_streak ?? 0);
    }
  }

  const userIds = Array.from(userStreakMap.keys());

  // Exclude premium users (they have unlimited streak freezes)
  const { data: premiumUsers } = await supabase
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .eq("is_premium", true);

  const premiumIds = new Set(premiumUsers?.map((p) => p.id) ?? []);
  const eligibleUserIds = userIds.filter((id) => !premiumIds.has(id));

  if (eligibleUserIds.length === 0) {
    return NextResponse.json({ message: "All at-risk users are premium", sent: 0 });
  }

  // Get push tokens for eligible users
  const { data: tokenRows } = await supabase
    .from("push_tokens")
    .select("token, user_id")
    .in("user_id", eligibleUserIds);

  if (!tokenRows || tokenRows.length === 0) {
    return NextResponse.json({ message: "No push tokens for at-risk users", sent: 0 });
  }

  // Group tokens by user to send personalised messages
  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows) {
    const existing = tokensByUser.get(row.user_id) ?? [];
    existing.push(row.token);
    tokensByUser.set(row.user_id, existing);
  }

  // Send personalised notifications per user (grouped by streak count for efficiency)
  let totalSent = 0;
  let totalFailed = 0;

  // Group users by streak count to batch similar messages
  const streakGroups = new Map<number, string[]>();
  for (const [userId, streak] of userStreakMap) {
    if (!tokensByUser.has(userId)) continue;
    const existing = streakGroups.get(streak) ?? [];
    existing.push(userId);
    streakGroups.set(streak, existing);
  }

  for (const [streakDays, groupUserIds] of streakGroups) {
    const { title, body } = getMessageForDay(streakDays);
    const tokens = groupUserIds.flatMap((uid) => tokensByUser.get(uid) ?? []);

    const result = await sendPushBatch(tokens, title, body);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  // Log the campaign
  const representativeStreak = Math.max(...Array.from(userStreakMap.values()));
  const { body } = getMessageForDay(representativeStreak);
  await logSentNotification(
    "🔥 Streak at Risk",
    body,
    totalSent,
    "streak_saver",
  );

  return NextResponse.json({
    message: "Streak saver notifications sent",
    sent: totalSent,
    failed: totalFailed,
    eligibleUsers: eligibleUserIds.length,
    premiumExcluded: premiumIds.size,
  });
}
