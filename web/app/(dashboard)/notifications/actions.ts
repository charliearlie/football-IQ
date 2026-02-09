"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { type GameMode, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";

// Expo Push API endpoint
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface SendNotificationInput {
  title: string;
  body: string;
  gameMode?: GameMode | "";
  puzzleId?: string;
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
};

/**
 * Send a push notification to all registered devices.
 */
export async function sendPushNotification(input: SendNotificationInput) {
  const supabase = await createAdminClient();

  // Fetch all push tokens
  const { data: tokens, error: fetchError } = await supabase
    .from("push_tokens")
    .select("token");

  if (fetchError) {
    return { success: false, error: `Failed to fetch tokens: ${fetchError.message}` };
  }

  if (!tokens || tokens.length === 0) {
    return { success: false, error: "No registered devices found" };
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
