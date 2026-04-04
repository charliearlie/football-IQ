/**
 * Challenge detail API
 *
 * GET /api/challenges/[id] — Get challenge details + responses
 * POST /api/challenges/[id] — Submit a response to a challenge
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Fetch challenge with puzzle content
  const { data: challenge, error } = await supabase
    .from("challenges")
    .select(`
      id,
      challenger_id,
      game_mode,
      puzzle_id,
      puzzle_date,
      challenger_score,
      challenger_score_display,
      challenger_metadata,
      play_count,
      created_at
    `)
    .eq("id", id)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  // Fetch challenger's display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", challenge.challenger_id)
    .single();

  // Fetch responses
  const { data: responses } = await supabase
    .from("challenge_responses")
    .select("responder_id, score, score_display, completed_at")
    .eq("challenge_id", id)
    .order("completed_at", { ascending: true })
    .limit(50);

  return NextResponse.json({
    ...challenge,
    challenger_name: profile?.display_name ?? "Anonymous",
    challenger_avatar: profile?.avatar_url,
    responses: responses ?? [],
  });
}

interface SubmitResponseBody {
  responderId: string;
  score: number;
  scoreDisplay?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body: SubmitResponseBody = await request.json();

    if (!body.responderId || body.score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: responderId, score" },
        { status: 400 },
      );
    }

    const supabase = await createAdminClient();

    // Verify challenge exists
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id, challenger_score, challenger_score_display")
      .eq("id", id)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Insert response (unique constraint prevents duplicates)
    const { error } = await supabase
      .from("challenge_responses")
      .insert({
        challenge_id: id,
        responder_id: body.responderId,
        score: body.score,
        score_display: body.scoreDisplay ?? null,
        metadata: (body.metadata ?? {}) as Record<string, string>,
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You've already responded to this challenge" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return comparison
    const won = body.score > challenge.challenger_score;
    const tied = body.score === challenge.challenger_score;

    return NextResponse.json({
      result: won ? "won" : tied ? "tied" : "lost",
      yourScore: body.score,
      challengerScore: challenge.challenger_score,
      challengerScoreDisplay: challenge.challenger_score_display,
    });
  } catch (err) {
    console.error("[challenges] Submit error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
