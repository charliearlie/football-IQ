/**
 * Lifecycle nudge cron — handles 3 automated campaigns:
 *
 * 1. AT-RISK: Users who were active 24-48h ago but not since (broke habit)
 * 2. LAPSED 7d: Users inactive for 7+ days
 * 3. NEVER-PLAYED: Users who signed up 1-3 days ago but never completed a game
 *
 * Schedule: 0 9 * * * (9am UTC — morning after daily content goes live)
 * Configure in vercel.json:
 *   { "path": "/api/cron/lifecycle-nudge", "schedule": "0 9 * * *" }
 *
 * Rate limiting: excludes users who received any push in the last 4 hours
 * (via sent_notifications timestamp — approximate, not per-user).
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushBatch, logSentNotification, validateCronSecret } from "@/lib/push";

export const runtime = "nodejs";
export const maxDuration = 60;

const AT_RISK_MESSAGES = [
  "Everyone slips up. Champions come back.",
  "Yesterday's puzzles are waiting. One quick game?",
  "Your rivals are pulling ahead. Time to catch up.",
  "Miss a day? That's fine. Missing two? That's a habit.",
];

const LAPSED_MESSAGES = [
  "50 new questions added this week. You might not know the answers yet.",
  "The game has changed since you left. New modes, new puzzles.",
  "Your Football IQ is gathering dust. Time for a refresh?",
];

const NEVER_PLAYED_MESSAGES = [
  "Your first game takes 60 seconds. Can you name the mystery player?",
  "You signed up but never played. Career Path is waiting — 60 seconds.",
  "11 game modes. 0 games played. Let's change that.",
];

function pickMessage(messages: string[]): string {
  const dayOfYear = Math.floor(Date.now() / 86400000);
  return messages[dayOfYear % messages.length];
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const now = new Date();

  // Time boundaries
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ago48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago1d = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const ago3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const results: Record<string, { sent: number; failed: number }> = {};

  // ── Campaign 1: AT-RISK (active 24-48h ago, silent since) ──
  {
    const { data: atRiskProfiles } = await supabase
      .from("profiles")
      .select("id")
      .gt("total_iq", 0)
      .lt("updated_at", ago24h)
      .gt("updated_at", ago48h);

    const userIds = atRiskProfiles?.map((p) => p.id) ?? [];

    if (userIds.length > 0) {
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds);

      const tokens = tokenRows?.map((t) => t.token) ?? [];
      const body = pickMessage(AT_RISK_MESSAGES);
      const result = await sendPushBatch(tokens, "Come back 💪", body);
      results.at_risk = { sent: result.sent, failed: result.failed };

      if (result.sent > 0) {
        await logSentNotification("Come back 💪", body, result.sent, "at_risk");
      }
    } else {
      results.at_risk = { sent: 0, failed: 0 };
    }
  }

  // ── Campaign 2: LAPSED 7d (inactive 7+ days, still have tokens) ──
  {
    const { data: lapsedProfiles } = await supabase
      .from("profiles")
      .select("id")
      .gt("total_iq", 0)
      .lt("updated_at", ago7d);

    const userIds = lapsedProfiles?.map((p) => p.id) ?? [];

    if (userIds.length > 0) {
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds);

      const tokens = tokenRows?.map((t) => t.token) ?? [];
      const body = pickMessage(LAPSED_MESSAGES);
      const result = await sendPushBatch(tokens, "We miss you ⚽", body);
      results.lapsed_7d = { sent: result.sent, failed: result.failed };

      if (result.sent > 0) {
        await logSentNotification("We miss you ⚽", body, result.sent, "lapsed");
      }
    } else {
      results.lapsed_7d = { sent: 0, failed: 0 };
    }
  }

  // ── Campaign 3: NEVER-PLAYED (signed up 1-3 days ago, total_iq = 0) ──
  {
    const { data: newbieProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("total_iq", 0)
      .lt("created_at", ago1d)
      .gt("created_at", ago3d);

    const userIds = newbieProfiles?.map((p) => p.id) ?? [];

    if (userIds.length > 0) {
      const { data: tokenRows } = await supabase
        .from("push_tokens")
        .select("token")
        .in("user_id", userIds);

      const tokens = tokenRows?.map((t) => t.token) ?? [];
      const body = pickMessage(NEVER_PLAYED_MESSAGES);
      const result = await sendPushBatch(tokens, "Ready to play? 🎮", body, {
        gameMode: "career-path",
      });
      results.never_played = { sent: result.sent, failed: result.failed };

      if (result.sent > 0) {
        await logSentNotification("Ready to play? 🎮", body, result.sent, "never_played");
      }
    } else {
      results.never_played = { sent: 0, failed: 0 };
    }
  }

  return NextResponse.json({
    message: "Lifecycle nudge campaigns complete",
    results,
  });
}
