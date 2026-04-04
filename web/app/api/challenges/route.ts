/**
 * Challenges API
 *
 * POST /api/challenges — Create a new challenge
 * GET /api/challenges/[id] — Get challenge details (handled by [id]/route.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface CreateChallengeBody {
  challengerId: string;
  gameMode: string;
  puzzleId: string;
  puzzleDate?: string;
  score: number;
  scoreDisplay?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengeBody = await request.json();

    if (!body.challengerId || !body.gameMode || !body.puzzleId || body.score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: challengerId, gameMode, puzzleId, score" },
        { status: 400 },
      );
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        challenger_id: body.challengerId,
        game_mode: body.gameMode,
        puzzle_id: body.puzzleId,
        puzzle_date: body.puzzleDate ?? null,
        challenger_score: body.score,
        challenger_score_display: body.scoreDisplay ?? null,
        challenger_metadata: (body.metadata ?? {}) as Record<string, string>,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[challenges] Insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const challengeUrl = `https://football-iq.app/challenge/${data.id}`;

    return NextResponse.json({
      id: data.id,
      url: challengeUrl,
    });
  } catch (err) {
    console.error("[challenges] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
