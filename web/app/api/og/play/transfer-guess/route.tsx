/**
 * Transfer Guess OG Image API Route
 *
 * Generates the Open Graph image for the Transfer Guess game.
 * URL: /api/og/play/transfer-guess
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
      gameTitle="Transfer Guess"
      tagline="Name the player from a single transfer"
      accentColor="#FACC15"
    />,
    {
      width: WIDTH,
      height: HEIGHT,
    }
  );
}
