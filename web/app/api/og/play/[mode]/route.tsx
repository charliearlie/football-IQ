/**
 * Dynamic OG image fallback for game-mode landing pages.
 *
 * Static folders under /api/og/play/* (career-path, connections, etc.) take
 * priority for the 5 playable web modes. This dynamic route catches the 9
 * app-only modes (higher-lower, top-tens, etc.) so every /play/[mode] page
 * has a working social preview image without one-off route files.
 */

import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { GameOGCard } from "@/components/og/GameOGCard";
import { loadOGFonts } from "@/components/og/og-fonts";
import { GAME_MODE_SEO } from "@/lib/seoData";

export const runtime = "edge";
export const revalidate = 86400;

const WIDTH = 1200;
const HEIGHT = 630;

interface RouteContext {
  params: Promise<{ mode: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const fonts = await loadOGFonts();
  const { mode } = await context.params;
  const seo = GAME_MODE_SEO[mode];

  const title = seo?.title ?? "Football IQ";
  const tagline = seo
    ? seo.heroDescription.split(".")[0].trim()
    : "Daily Football Trivia";
  const accent = seo?.accentColor ?? "#2EFC5D";

  return new ImageResponse(
    <GameOGCard gameTitle={title} tagline={tagline} accentColor={accent} />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
