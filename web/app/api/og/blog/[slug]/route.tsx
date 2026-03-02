/**
 * Blog Article OG Image API Route
 *
 * Generates a dynamic Open Graph image for any blog article.
 * URL: /api/og/blog/{slug}
 *
 * Falls back to a generic card if the article is not found.
 */

import { ImageResponse } from "@vercel/og";
import { createAdminClient } from "@/lib/supabase/server";
import {
  BlogArticleOGCard,
  type BlogMatchResult,
} from "@/components/og/BlogArticleOGCard";
import { GameOGCard } from "@/components/og/GameOGCard";
import { loadOGFonts } from "@/components/og/og-fonts";

export const runtime = "edge";
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

interface RawMatchData {
  matches?: Array<{
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
    league: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const fonts = await loadOGFonts();
  const { slug } = await params;

  try {
    const supabase = await createAdminClient();
    const { data: article } = await supabase
      .from("blog_articles")
      .select("title, article_date, raw_match_data")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (article) {
      const raw = article.raw_match_data as RawMatchData | null;
      const matches = raw?.matches ?? [];

      const matchResults: BlogMatchResult[] = matches.slice(0, 3).map((m) => ({
        home: m.homeTeam,
        away: m.awayTeam,
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
      }));

      const competitions = [
        ...new Set(matches.map((m) => m.league).filter(Boolean)),
      ].slice(0, 4);

      const [year, month, day] = article.article_date.split("-").map(Number);
      const dateObj = new Date(Date.UTC(year, month - 1, day));
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });

      return new ImageResponse(
        (
          <BlogArticleOGCard
            title={article.title}
            matchResults={matchResults}
            competitions={competitions}
            date={formattedDate}
          />
        ),
        { width: WIDTH, height: HEIGHT, fonts }
      );
    }
  } catch (error) {
    console.error("Error generating blog OG image:", error);
  }

  // Fallback to generic card
  return new ImageResponse(
    (
      <GameOGCard
        gameTitle="Daily Digest"
        tagline="Football news and match analysis"
        accentColor="#2EFC5D"
      />
    ),
    { width: WIDTH, height: HEIGHT, fonts }
  );
}
