/**
 * Connections OG Image API Route
 *
 * Generates a dynamic Open Graph image showing today's connections puzzle
 * as a shuffled 4x4 grid of player name tiles.
 *
 * URL: /api/og/play/connections?date=YYYY-MM-DD
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { GameOGCard } from '@/components/og/GameOGCard';
import { ConnectionsOGCard } from '@/components/og/ConnectionsOGCard';
import { connectionsContentSchema } from '@/lib/schemas/puzzle-schemas';
import { loadOGFonts } from '@/components/og/og-fonts';

export const runtime = 'edge';
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

/** Deterministic shuffle using a simple LCG seeded by the date string. */
function seededShuffle(arr: string[], seed: number): string[] {
  const shuffled = [...arr];
  let s = seed;
  // Pre-warm the generator for better distribution
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

    const puzzle = await fetchDailyPuzzle('connections', date);

    if (puzzle?.content) {
      const parsed = connectionsContentSchema.safeParse(puzzle.content);
      if (parsed.success) {
        const allPlayers = parsed.data.groups.flatMap((g) => [...g.players]);
        const dateStr = puzzle.puzzle_date ?? new Date().toISOString().split('T')[0];
        const seed = parseInt(dateStr.replace(/-/g, ''), 10);
        const shuffled = seededShuffle(allPlayers, seed);

        return new ImageResponse(
          <ConnectionsOGCard players={shuffled} />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      }
    }
  } catch (error) {
    console.error('Error generating Connections OG image:', error);
  }

  // Fallback to generic card
  return new ImageResponse(
    <GameOGCard
      gameTitle="Connections"
      tagline="Group 16 players into 4 categories"
      accentColor="#3B82F6"
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
