/**
 * Transfer Guess OG Image API Route
 *
 * Generates a dynamic Open Graph image showing today's transfer puzzle
 * with from-club → to-club, fee, and locked hint pills.
 *
 * URL: /api/og/play/transfer-guess?date=YYYY-MM-DD
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { GameOGCard } from '@/components/og/GameOGCard';
import { TransferGuessOGCard } from '@/components/og/TransferGuessOGCard';
import { transferGuessContentSchema } from '@/lib/schemas/puzzle-schemas';
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

    const puzzle = await fetchDailyPuzzle('guess_the_transfer', date);

    if (puzzle?.content) {
      const parsed = transferGuessContentSchema.safeParse(puzzle.content);
      if (parsed.success) {
        const { from_club, to_club, fee, from_club_color, to_club_color, from_club_abbreviation, to_club_abbreviation } = parsed.data;
        return new ImageResponse(
          <TransferGuessOGCard
            fromClub={from_club}
            toClub={to_club}
            fee={fee}
            fromClubColor={from_club_color || undefined}
            toClubColor={to_club_color || undefined}
            fromClubAbbreviation={from_club_abbreviation || undefined}
            toClubAbbreviation={to_club_abbreviation || undefined}
          />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      }
    }
  } catch (error) {
    console.error('Error generating Transfer Guess OG image:', error);
  }

  // Fallback to generic card
  return new ImageResponse(
    <GameOGCard
      gameTitle="Transfer Guess"
      tagline="Name the player from a single transfer"
      accentColor="#FACC15"
    />,
    { width: WIDTH, height: HEIGHT, fonts },
  );
}
