/**
 * Career Path OG Image API Route
 *
 * Generates the Open Graph image for the Career Path game.
 * URL: /api/og/play/career-path
 *
 * Returns a 1200x630 PNG image that social platforms use for link previews.
 */

import { ImageResponse } from '@vercel/og';
import { GameOGCard } from '@/components/og/GameOGCard';

export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET() {
  return new ImageResponse(
    <GameOGCard
      gameTitle="Career Path"
      tagline="Guess the player from their career"
      accentColor="#58CC02"
    />,
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
