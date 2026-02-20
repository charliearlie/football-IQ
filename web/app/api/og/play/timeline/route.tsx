/**
 * Timeline OG Image API Route
 *
 * Generates a dynamic Open Graph image showing today's timeline puzzle
 * as 6 shuffled event cards (years hidden).
 *
 * URL: /api/og/play/timeline?date=YYYY-MM-DD
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { GameOGCard } from '@/components/og/GameOGCard';
import { TimelineOGCard } from '@/components/og/TimelineOGCard';
import { timelineContentSchema } from '@/lib/schemas/puzzle-schemas';
import { loadOGFonts } from '@/components/og/og-fonts';

export const runtime = 'edge';
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

/** Deterministic shuffle using a simple LCG seeded by the date string. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let w = 0; w < 5; w++) {
    s = (s * 16807) % 2147483647;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function GET(request: NextRequest) {
  const fonts = await loadOGFonts();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? undefined;

    const puzzle = await fetchDailyPuzzle('timeline', date);

    if (puzzle?.content) {
      const parsed = timelineContentSchema.safeParse(puzzle.content);
      if (parsed.success && parsed.data.events.length === 6) {
        const dateStr = puzzle.puzzle_date ?? new Date().toISOString().split('T')[0];
        const seed = parseInt(dateStr.replace(/-/g, ''), 10);
        const shuffledEvents = seededShuffle(
          parsed.data.events.map((e) => e.text),
          seed
        );

        return new ImageResponse(
          <TimelineOGCard
            events={shuffledEvents}
            subject={parsed.data.subject ?? parsed.data.title}
          />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      }
    }
  } catch (error) {
    console.error('Error generating Timeline OG image:', error);
  }

  // Fallback to generic card
  return new ImageResponse(
    <GameOGCard
      gameTitle="Timeline"
      tagline="Sort 6 events into chronological order"
      accentColor="#F59E0B"
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
