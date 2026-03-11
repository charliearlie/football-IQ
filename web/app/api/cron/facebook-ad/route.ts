/**
 * CRON route for daily Facebook ad generation.
 *
 * Pipeline:
 *   1. Pick today's game mode (rotates daily, falls back to career_path)
 *   2. Fetch the puzzle from Supabase
 *   3. Generate an ad image with Gemini
 *   4. Post to the Facebook Page
 *
 * Configure in vercel.json:
 *   { "path": "/api/cron/facebook-ad", "schedule": "0 8 * * *" }
 *
 * Protected by CRON_SECRET bearer token.
 *
 * Required env vars:
 *   CRON_SECRET, GEMINI_API_KEY, FACEBOOK_PAGE_ID, FACEBOOK_PAGE_ACCESS_TOKEN
 */

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";
import { GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { buildAdContent } from "@/lib/ads/prompts";
import { postPhotoToPage } from "@/lib/ads/facebook";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Game modes to rotate through for ads (free modes only) */
const AD_ROTATION: GameMode[] = [
  "connections",
  "career_path",
  "guess_the_transfer",
  "timeline",
  "guess_the_goalscorers",
  "starting_xi",
  "topical_quiz",
  "top_tens",
];

const FALLBACK_MODE: GameMode = "career_path";

/** Map game_mode to /play URL path */
const GAME_MODE_PATHS: Partial<Record<GameMode, string>> = {
  career_path: "career-path",
  career_path_pro: "career-path",
  connections: "connections",
  guess_the_transfer: "transfer-guess",
  guess_the_goalscorers: "goalscorer-recall",
  topical_quiz: "topical-quiz",
  top_tens: "top-tens",
  starting_xi: "starting-xi",
  timeline: "timeline",
  the_chain: "the-chain",
  the_thread: "the-thread",
  the_grid: "the-grid",
};

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function fetchPuzzle(
  gameMode: GameMode,
  date: string,
): Promise<{ content: Record<string, unknown>; game_mode: string } | null> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("daily_puzzles")
    .select("content, game_mode")
    .eq("game_mode", gameMode)
    .eq("puzzle_date", date)
    .eq("status", "live")
    .single();

  return data as { content: Record<string, unknown>; game_mode: string } | null;
}

async function generateAdImage(prompt: string): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No response from Gemini");
  }

  const imagePart = parts.find((p) =>
    p.inlineData?.mimeType?.startsWith("image/"),
  );

  if (!imagePart?.inlineData?.data) {
    const textPart = parts.find((p) => p.text);
    throw new Error(
      `Gemini did not return an image. Feedback: ${textPart?.text ?? "none"}`,
    );
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { success: false, error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  if (!process.env.FACEBOOK_PAGE_ID || !process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    return Response.json(
      { success: false, error: "Facebook credentials not configured" },
      { status: 500 },
    );
  }

  const today = getToday();
  const dayOfYear = getDayOfYear();
  const rotationIndex = dayOfYear % AD_ROTATION.length;
  let gameMode = AD_ROTATION[rotationIndex];

  console.log(
    `[facebook-ad] Day ${dayOfYear}, rotation index ${rotationIndex}, trying ${gameMode}`,
  );

  // Try the rotated game mode, fall back to career_path
  let puzzle = await fetchPuzzle(gameMode, today);
  if (!puzzle && gameMode !== FALLBACK_MODE) {
    console.log(
      `[facebook-ad] No ${gameMode} puzzle for ${today}, falling back to ${FALLBACK_MODE}`,
    );
    gameMode = FALLBACK_MODE;
    puzzle = await fetchPuzzle(FALLBACK_MODE, today);
  }

  if (!puzzle) {
    return Response.json({
      success: false,
      error: `No live puzzle found for ${today} (tried ${AD_ROTATION[rotationIndex]} and ${FALLBACK_MODE})`,
    }, { status: 404 });
  }

  const displayName = GAME_MODE_DISPLAY_NAMES[gameMode] ?? gameMode;
  const pathSegment = GAME_MODE_PATHS[gameMode] ?? gameMode;
  const playUrl = `https://footballiq.club/play/${pathSegment}`;

  // Build prompt and caption
  const { imagePrompt, caption } = buildAdContent(
    gameMode,
    displayName,
    puzzle.content,
    playUrl,
  );

  console.log(`[facebook-ad] Generating image for ${gameMode}...`);

  // Generate image
  const imageBuffer = await generateAdImage(imagePrompt);

  console.log(
    `[facebook-ad] Image generated (${(imageBuffer.length / 1024).toFixed(0)}KB), posting to Facebook...`,
  );

  // Post to Facebook
  const fbResult = await postPhotoToPage(imageBuffer, caption);

  console.log(
    `[facebook-ad] Posted to Facebook! Post ID: ${fbResult.post_id}`,
  );

  return Response.json({
    success: true,
    gameMode,
    displayName,
    puzzleDate: today,
    facebookPostId: fbResult.post_id,
  });
}
