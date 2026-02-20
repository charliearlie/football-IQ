/**
 * Connections OG Image API Route
 *
 * Generates the Open Graph image for the Connections game.
 * URL: /api/og/play/connections
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
      gameTitle="Connections"
      tagline="Group 16 players into 4 categories"
      accentColor="#3B82F6"
    />,
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
