/**
 * Topical Quiz OG Image API Route
 *
 * Generates a dynamic Open Graph image showing the first question
 * from today's topical quiz with A/B/C/D options.
 *
 * URL: /api/og/play/topical-quiz?date=YYYY-MM-DD
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { GameOGCard } from '@/components/og/GameOGCard';
import { TopicalQuizOGCard } from '@/components/og/TopicalQuizOGCard';
import { topicalQuizContentSchema } from '@/lib/schemas/puzzle-schemas';
import { loadOGFonts } from '@/components/og/og-fonts';

export const runtime = 'edge';
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request: NextRequest) {
  const fonts = await loadOGFonts();

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? undefined;

    const puzzle = await fetchDailyPuzzle('topical_quiz', date);

    if (puzzle?.content) {
      const parsed = topicalQuizContentSchema.safeParse(puzzle.content);
      if (parsed.success && parsed.data.questions.length > 0) {
        const { question, options } = parsed.data.questions[0];
        return new ImageResponse(
          <TopicalQuizOGCard
            firstQuestion={question}
            options={options}
          />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      }
    }
  } catch (error) {
    console.error('Error generating Topical Quiz OG image:', error);
  }

  // Fallback to generic card
  return new ImageResponse(
    <GameOGCard
      gameTitle="Topical Quiz"
      tagline="5 questions on this week's headlines"
      accentColor="#FF6B6B"
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
