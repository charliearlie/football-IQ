/**
 * Topical Quiz OG Image API Route
 *
 * Generates the Open Graph image for the Topical Quiz game.
 * URL: /api/og/play/topical-quiz
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
      gameTitle="Topical Quiz"
      tagline="5 questions on this week's headlines"
      accentColor="#FF6B6B"
    />,
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
