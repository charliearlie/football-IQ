/**
 * Server-side push notification utilities.
 *
 * Shared by lifecycle cron jobs and admin notification actions.
 * Uses Expo Push API with batching (100 per request).
 */

import { createAdminClient } from "@/lib/supabase/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data?: Record<string, string>;
}

interface PushResult {
  sent: number;
  failed: number;
  total: number;
}

/**
 * Send push notifications to a list of Expo push tokens.
 * Batches in groups of 100 per Expo API limits.
 */
export async function sendPushBatch(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<PushResult> {
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const messages: PushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: "default" as const,
    ...(data && Object.keys(data).length > 0 && { data }),
  }));

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.EXPO_PUSH_ACCESS_TOKEN && {
            Authorization: `Bearer ${process.env.EXPO_PUSH_ACCESS_TOKEN}`,
          }),
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        failed += batch.length;
        continue;
      }

      const result = await response.json();
      for (const ticket of result.data ?? []) {
        if (ticket.status === "ok") sent++;
        else failed++;
      }
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed, total: tokens.length };
}

/** Segment query — returns push tokens for users matching a segment. */
export type NotificationSegment =
  | "all"
  | "free"
  | "premium"
  | "at_risk"
  | "lapsed_7d"
  | "lapsed_14d"
  | "never_played";

/**
 * Fetch push tokens for a given user segment.
 * Uses admin client to bypass RLS.
 */
export async function getTokensForSegment(
  segment: NotificationSegment,
): Promise<{ tokens: string[]; count: number }> {
  const supabase = await createAdminClient();

  // Base: all tokens joined with profiles
  // We build the query based on segment
  switch (segment) {
    case "all": {
      const { data } = await supabase.from("push_tokens").select("token");
      const tokens = data?.map((t) => t.token) ?? [];
      return { tokens, count: tokens.length };
    }

    case "free": {
      const { data } = await supabase
        .from("push_tokens")
        .select("token, user_id")
        .returns<{ token: string; user_id: string }[]>();

      if (!data) return { tokens: [], count: 0 };

      const userIds = data.map((t) => t.user_id);
      const { data: premiumUsers } = await supabase
        .from("profiles")
        .select("id")
        .in("id", userIds)
        .eq("is_premium", true);

      const premiumIds = new Set(premiumUsers?.map((p) => p.id) ?? []);
      const tokens = data
        .filter((t) => !premiumIds.has(t.user_id))
        .map((t) => t.token);
      return { tokens, count: tokens.length };
    }

    case "premium": {
      const { data } = await supabase
        .from("push_tokens")
        .select("token, user_id")
        .returns<{ token: string; user_id: string }[]>();

      if (!data) return { tokens: [], count: 0 };

      const userIds = data.map((t) => t.user_id);
      const { data: premiumUsers } = await supabase
        .from("profiles")
        .select("id")
        .in("id", userIds)
        .eq("is_premium", true);

      const premiumIds = new Set(premiumUsers?.map((p) => p.id) ?? []);
      const tokens = data
        .filter((t) => premiumIds.has(t.user_id))
        .map((t) => t.token);
      return { tokens, count: tokens.length };
    }

    case "never_played": {
      const { data } = await supabase
        .from("push_tokens")
        .select("token, user_id")
        .returns<{ token: string; user_id: string }[]>();

      if (!data) return { tokens: [], count: 0 };

      const userIds = data.map((t) => t.user_id);
      const { data: playedUsers } = await supabase
        .from("profiles")
        .select("id")
        .in("id", userIds)
        .gt("total_iq", 0);

      const playedIds = new Set(playedUsers?.map((p) => p.id) ?? []);
      const tokens = data
        .filter((t) => !playedIds.has(t.user_id))
        .map((t) => t.token);
      return { tokens, count: tokens.length };
    }

    default:
      // For at_risk, lapsed_7d, lapsed_14d — handled by specific cron logic
      // that queries more complex conditions
      return { tokens: [], count: 0 };
  }
}

/**
 * Log a sent notification to the database.
 */
export async function logSentNotification(
  title: string,
  body: string,
  recipientCount: number,
  campaignType: string,
  data?: Record<string, string>,
) {
  const supabase = await createAdminClient();
  await supabase.from("sent_notifications").insert({
    title,
    body,
    data: (data ?? {}) as unknown as Record<string, string>,
    sent_by: null, // Automated — no user
    recipient_count: recipientCount,
  });
}

/**
 * Validate CRON_SECRET from request headers.
 * Returns true if valid, false otherwise.
 */
export function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}
