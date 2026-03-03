/**
 * CRON route for pre-generating OG images.
 *
 * Runs daily at 00:05 UTC (configured in vercel.json).
 * Generates all 4 game OG images using Satori with branded fonts,
 * then uploads static PNGs to Supabase Storage for instant delivery.
 *
 * Protected by CRON_SECRET to prevent unauthorized invocation.
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchDailyPuzzle } from '@/lib/fetchDailyPuzzle';
import { createAdminClient } from '@/lib/supabase/server';
import type { OGFont } from '@/components/og/og-fonts';

// Game-specific OG card components
import { CareerPathOGCard } from '@/components/og/CareerPathOGCard';
import { ConnectionsOGCard } from '@/components/og/ConnectionsOGCard';
import { TransferGuessOGCard } from '@/components/og/TransferGuessOGCard';
import { TopicalQuizOGCard } from '@/components/og/TopicalQuizOGCard';
import { GameOGCard } from '@/components/og/GameOGCard';

// Zod schemas for puzzle content validation
import {
  careerPathContentSchema,
  connectionsContentSchema,
  transferGuessContentSchema,
  topicalQuizContentSchema,
} from '@/lib/schemas/puzzle-schemas';

// Node.js runtime for more memory and no edge constraints
export const runtime = 'nodejs';
export const maxDuration = 30;

const WIDTH = 1200;
const HEIGHT = 630;

interface GameConfig {
  slug: string;
  gameMode: string;
  /** If true, puzzle is guaranteed daily — generate fallback if missing. */
  daily: boolean;
  fallbackTitle: string;
  fallbackTagline: string;
  fallbackAccent: string;
  renderCard: (content: unknown, fonts: OGFont[]) => ImageResponse | null;
}

/** Deterministic shuffle (same as connections route). */
function seededShuffle(arr: string[], seed: number): string[] {
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

function buildGameConfigs(date: string): GameConfig[] {
  return [
    {
      slug: 'career-path',
      gameMode: 'career_path',
      daily: true,
      fallbackTitle: 'Career Path',
      fallbackTagline: 'Guess the player from their career',
      fallbackAccent: '#2EFC5D',
      renderCard: (content, fonts) => {
        const parsed = careerPathContentSchema.safeParse(content);
        if (!parsed.success || parsed.data.career_steps.length === 0) return null;
        const { career_steps } = parsed.data;
        return new ImageResponse(
          <CareerPathOGCard firstStep={career_steps[0]} totalSteps={career_steps.length} />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      },
    },
    {
      slug: 'connections',
      gameMode: 'connections',
      daily: false,
      fallbackTitle: 'Connections',
      fallbackTagline: 'Group 16 players into 4 categories',
      fallbackAccent: '#3B82F6',
      renderCard: (content, fonts) => {
        const parsed = connectionsContentSchema.safeParse(content);
        if (!parsed.success) return null;
        const allPlayers = parsed.data.groups.flatMap((g) => [...g.players]);
        const seed = parseInt(date.replace(/-/g, ''), 10);
        const shuffled = seededShuffle(allPlayers, seed);
        return new ImageResponse(
          <ConnectionsOGCard players={shuffled} />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      },
    },
    {
      slug: 'transfer-guess',
      gameMode: 'guess_the_transfer',
      daily: true,
      fallbackTitle: 'Transfer Guess',
      fallbackTagline: 'Name the player from a single transfer',
      fallbackAccent: '#FACC15',
      renderCard: (content, fonts) => {
        const parsed = transferGuessContentSchema.safeParse(content);
        if (!parsed.success) return null;
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
      },
    },
    {
      slug: 'topical-quiz',
      gameMode: 'topical_quiz',
      daily: false,
      fallbackTitle: 'Topical Quiz',
      fallbackTagline: "5 questions on this week's headlines",
      fallbackAccent: '#FF6B6B',
      renderCard: (content, fonts) => {
        const parsed = topicalQuizContentSchema.safeParse(content);
        if (!parsed.success || parsed.data.questions.length === 0) return null;
        const { question, options } = parsed.data.questions[0];
        return new ImageResponse(
          <TopicalQuizOGCard firstQuestion={question} options={options} />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      },
    },
  ];
}

export async function GET(request: NextRequest) {
  // Verify CRON secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Load fonts via fs (Node.js runtime — import.meta.url doesn't work here)
  const fontsDir = join(process.cwd(), 'public', 'fonts');
  const [montserratRegular, montserratSemiBold, bebasNeue] = await Promise.all([
    readFile(join(fontsDir, 'Montserrat-Regular.ttf')),
    readFile(join(fontsDir, 'Montserrat-SemiBold.ttf')),
    readFile(join(fontsDir, 'BebasNeue-Regular.ttf')),
  ]);
  const fonts: OGFont[] = [
    { name: 'Montserrat', data: montserratRegular.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'Montserrat', data: montserratSemiBold.buffer as ArrayBuffer, weight: 600, style: 'normal' },
    { name: 'Bebas Neue', data: bebasNeue.buffer as ArrayBuffer, weight: 400, style: 'normal' },
  ];

  const supabase = await createAdminClient();
  const results: { slug: string; status: string; path?: string }[] = [];

  const games = buildGameConfigs(today);

  for (const game of games) {
    try {
      let imageResponse: ImageResponse;

      // Try to render dynamic card from puzzle data
      const puzzle = await fetchDailyPuzzle(game.gameMode, today);
      const dynamicCard = puzzle?.content ? game.renderCard(puzzle.content, fonts) : null;

      if (dynamicCard) {
        imageResponse = dynamicCard;
      } else if (game.daily) {
        // Daily games always get an image — use generic fallback
        imageResponse = new ImageResponse(
          <GameOGCard
            gameTitle={game.fallbackTitle}
            tagline={game.fallbackTagline}
            accentColor={game.fallbackAccent}
          />,
          { width: WIDTH, height: HEIGHT, fonts },
        );
      } else {
        // Non-daily games: no puzzle today → skip (dynamic route handles fallback)
        results.push({ slug: game.slug, status: 'skipped' });
        continue;
      }

      // Extract PNG buffer from ImageResponse
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage (upsert)
      const storagePath = `${game.slug}/${today}.png`;
      const { error } = await supabase.storage
        .from('og-images')
        .upload(storagePath, buffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload OG image for ${game.slug}:`, error);
        results.push({ slug: game.slug, status: 'upload_error' });
      } else {
        results.push({ slug: game.slug, status: 'success', path: storagePath });
      }
    } catch (error) {
      console.error(`Error generating OG image for ${game.slug}:`, error);
      results.push({ slug: game.slug, status: 'error' });
    }
  }

  return Response.json({
    date: today,
    results,
    generated: results.filter((r) => r.status === 'success').length,
    total: games.length,
  });
}
