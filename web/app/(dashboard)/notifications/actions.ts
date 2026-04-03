"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { type GameMode, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";

// Expo Push API endpoint
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type NotificationSegment = "all" | "free" | "premium" | "at_risk" | "lapsed_7d" | "never_played";

interface SendNotificationInput {
  title: string;
  body: string;
  gameMode?: GameMode | "";
  puzzleId?: string;
  segment?: NotificationSegment;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data?: Record<string, string>;
}

interface ExpoPushResult {
  data: Array<{
    status: "ok" | "error";
    message?: string;
    details?: { error?: string };
  }>;
}

/**
 * Game mode to Expo Router route path mapping.
 * Must match the mobile app's route structure.
 */
const GAME_MODE_ROUTE_MAP: Record<GameMode, string> = {
  career_path: "career-path",
  career_path_pro: "career-path-pro",
  the_grid: "the-grid",
  the_chain: "the-chain",
  the_thread: "the-thread",
  guess_the_transfer: "transfer-guess",
  guess_the_goalscorers: "goalscorer-recall",
  topical_quiz: "topical-quiz",
  top_tens: "top-tens",
  starting_xi: "starting-xi",
  connections: "connections",
  timeline: "timeline",
  who_am_i: "who-am-i",
  balldle: "balldle",
  higher_lower: "higher-lower",
};

/**
 * Send a push notification to all registered devices.
 */
export async function sendPushNotification(input: SendNotificationInput) {
  const supabase = await createAdminClient();

  // Fetch tokens based on segment
  const segment = input.segment ?? "all";
  let tokens: { token: string }[] = [];

  if (segment === "all") {
    const { data, error: fetchError } = await supabase
      .from("push_tokens")
      .select("token");
    if (fetchError) {
      return { success: false, error: `Failed to fetch tokens: ${fetchError.message}` };
    }
    tokens = data ?? [];
  } else {
    // Fetch tokens joined with user filtering
    const { data: allTokens } = await supabase
      .from("push_tokens")
      .select("token, user_id");

    if (!allTokens || allTokens.length === 0) {
      return { success: false, error: "No registered devices found" };
    }

    const userIds = allTokens.map((t) => t.user_id);
    let eligibleUserIds: Set<string>;

    if (segment === "free") {
      const { data: premiumUsers } = await supabase
        .from("profiles").select("id").in("id", userIds).eq("is_premium", true);
      const premiumIds = new Set(premiumUsers?.map((p) => p.id) ?? []);
      eligibleUserIds = new Set(userIds.filter((id) => !premiumIds.has(id)));
    } else if (segment === "premium") {
      const { data: premiumUsers } = await supabase
        .from("profiles").select("id").in("id", userIds).eq("is_premium", true);
      eligibleUserIds = new Set(premiumUsers?.map((p) => p.id) ?? []);
    } else if (segment === "never_played") {
      const { data: playedUsers } = await supabase
        .from("profiles").select("id").in("id", userIds).gt("total_iq", 0);
      const playedIds = new Set(playedUsers?.map((p) => p.id) ?? []);
      eligibleUserIds = new Set(userIds.filter((id) => !playedIds.has(id)));
    } else if (segment === "lapsed_7d") {
      const ago7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: lapsedUsers } = await supabase
        .from("profiles").select("id").in("id", userIds).gt("total_iq", 0).lt("updated_at", ago7d);
      eligibleUserIds = new Set(lapsedUsers?.map((p) => p.id) ?? []);
    } else if (segment === "at_risk") {
      const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const ago48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: atRiskUsers } = await supabase
        .from("profiles").select("id").in("id", userIds).gt("total_iq", 0)
        .lt("updated_at", ago24h).gt("updated_at", ago48h);
      eligibleUserIds = new Set(atRiskUsers?.map((p) => p.id) ?? []);
    } else {
      eligibleUserIds = new Set(userIds);
    }

    tokens = allTokens
      .filter((t) => eligibleUserIds.has(t.user_id))
      .map((t) => ({ token: t.token }));
  }

  if (!tokens || tokens.length === 0) {
    return { success: false, error: `No devices found for segment "${segment}"` };
  }

  // Build notification data payload for deep linking
  const data: Record<string, string> = {};
  if (input.gameMode) {
    data.gameMode = GAME_MODE_ROUTE_MAP[input.gameMode] ?? input.gameMode;
    if (input.puzzleId) {
      data.puzzleId = input.puzzleId;
    }
  }

  // Build Expo push messages (batch in groups of 100)
  const messages: ExpoPushMessage[] = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: input.title,
    body: input.body,
    sound: "default" as const,
    ...(Object.keys(data).length > 0 && { data }),
  }));

  let successCount = 0;
  let errorCount = 0;

  // Send in batches of 100 (Expo API limit)
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
        errorCount += batch.length;
        continue;
      }

      const result: ExpoPushResult = await response.json();
      for (const ticket of result.data) {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          errorCount++;
        }
      }
    } catch {
      errorCount += batch.length;
    }
  }

  // Log to sent_notifications table
  const { data: authData } = await supabase.auth.getUser();
  await supabase.from("sent_notifications").insert({
    title: input.title,
    body: input.body,
    data: data as unknown as Record<string, string>,
    sent_by: authData.user?.id ?? null,
    recipient_count: successCount,
  });

  return {
    success: true,
    sent: successCount,
    failed: errorCount,
    total: tokens.length,
  };
}

/**
 * Fetch sent notification history.
 */
export async function getSentNotifications() {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("sent_notifications")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(50);

  if (error) {
    return { notifications: [], error: error.message };
  }

  return { notifications: data ?? [] };
}

/**
 * Get count of registered push tokens.
 */
export async function getTokenCount() {
  const supabase = await createAdminClient();

  const { count, error } = await supabase
    .from("push_tokens")
    .select("*", { count: "exact", head: true });

  if (error) return 0;
  return count ?? 0;
}

/**
 * Get estimated audience count for a notification segment.
 */
export async function getSegmentCount(segment: NotificationSegment): Promise<number> {
  const supabase = await createAdminClient();

  if (segment === "all") {
    const { count } = await supabase
      .from("push_tokens")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  }

  const { data: allTokens } = await supabase
    .from("push_tokens")
    .select("user_id");

  if (!allTokens || allTokens.length === 0) return 0;

  const userIds = [...new Set(allTokens.map((t) => t.user_id))];

  switch (segment) {
    case "free": {
      const { data } = await supabase
        .from("profiles").select("id").in("id", userIds).eq("is_premium", true);
      return userIds.length - (data?.length ?? 0);
    }
    case "premium": {
      const { count } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .in("id", userIds).eq("is_premium", true);
      return count ?? 0;
    }
    case "never_played": {
      const { count } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .in("id", userIds).eq("total_iq", 0);
      return count ?? 0;
    }
    case "lapsed_7d": {
      const ago7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .in("id", userIds).gt("total_iq", 0).lt("updated_at", ago7d);
      return count ?? 0;
    }
    case "at_risk": {
      const ago24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const ago48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .in("id", userIds).gt("total_iq", 0)
        .lt("updated_at", ago24h).gt("updated_at", ago48h);
      return count ?? 0;
    }
    default:
      return 0;
  }
}

/**
 * Extract a display title from puzzle content based on game mode.
 */
function getPuzzleTitleFromContent(gameMode: string, content: unknown): string {
  const c = content as Record<string, unknown>;
  switch (gameMode) {
    case "career_path":
    case "career_path_pro":
      return (c.answer as string) || "Untitled";
    case "guess_the_transfer":
      return (c.answer as string) || "Untitled";
    case "guess_the_goalscorers":
      return `${c.home_team || "?"} vs ${c.away_team || "?"}`;
    case "top_tens":
      return (c.title as string) || "Untitled";
    case "starting_xi":
      return (c.match_name as string) || "Untitled";
    default:
      return GAME_MODE_DISPLAY_NAMES[gameMode as GameMode] ?? "Untitled";
  }
}

export interface TodaysPuzzle {
  id: string;
  game_mode: GameMode;
  title: string;
  event_title: string | null;
}

/**
 * Fetch today's live puzzles for the notification form.
 */
export async function getTodaysPuzzles() {
  const supabase = await createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("id, game_mode, content, event_title, status")
    .eq("puzzle_date", today)
    .eq("status", "live")
    .order("game_mode", { ascending: true });

  if (error) {
    return { puzzles: [] as TodaysPuzzle[] };
  }

  const puzzles: TodaysPuzzle[] = (data ?? []).map((p: { id: string; game_mode: string; content: unknown; event_title: string | null }) => ({
    id: p.id,
    game_mode: p.game_mode as GameMode,
    title: getPuzzleTitleFromContent(p.game_mode, p.content),
    event_title: p.event_title,
  }));

  return { puzzles };
}
