/**
 * Career Path OG Image API Route
 *
 * Generates a dynamic Open Graph image showing today's career path puzzle
 * in its unplayed state (first club revealed, rest locked).
 *
 * URL: /api/og/play/career-path?date=YYYY-MM-DD
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { GameOGCard } from '@/components/og/GameOGCard';
import { CareerPathOGCard } from '@/components/og/CareerPathOGCard';
import { careerPathContentSchema } from '@/lib/schemas/puzzle-schemas';

export const runtime = 'edge';
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? undefined;

    const puzzle = await fetchDailyPuzzle('career_path', date);

    if (puzzle?.content) {
      const parsed = careerPathContentSchema.safeParse(puzzle.content);
      if (parsed.success && parsed.data.career_steps.length > 0) {
        const { career_steps } = parsed.data;
        return new ImageResponse(
          <CareerPathOGCard
            firstStep={career_steps[0]}
            totalSteps={career_steps.length}
          />,
          { width: WIDTH, height: HEIGHT },
        );
      }
    }
  } catch (error) {
    console.error('Error generating Career Path OG image:', error);
  }

  // Fallback to generic card
  return new ImageResponse(
    <GameOGCard
      gameTitle="Career Path"
      tagline="Guess the player from their career"
      accentColor="#58CC02"
    />,
    { width: WIDTH, height: HEIGHT },
  );
}
