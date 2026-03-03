/**
 * Play Hub OG Image API Route
 *
 * Generates the Open Graph image for the Football IQ play hub page.
 * URL: /api/og/play
 *
 * Returns a 1200x630 PNG image that social platforms use for link previews.
 */

import { ImageResponse } from '@vercel/og';
import { GameOGCard } from '@/components/og/GameOGCard';
import { loadOGFonts } from '@/components/og/og-fonts';

export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
  const fonts = await loadOGFonts();

  return new ImageResponse(
    <GameOGCard
      gameTitle="Play Free"
      tagline="4 Daily Football Puzzles"
      accentColor="#2EFC5D"
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
