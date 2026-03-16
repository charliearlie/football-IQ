import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { contentSchemaMap, puzzleBaseSchema, validateContent } from "@/lib/schemas/puzzle-schemas";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST — Create a puzzle (returns 409 if duplicate date+mode)
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseAndValidateBody(body);
  if ("error" in parsed) {
    return Response.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Check for duplicate
  const { data: existing } = await supabase
    .from("daily_puzzles")
    .select("id")
    .eq("puzzle_date", parsed.puzzle_date)
    .eq("game_mode", parsed.game_mode)
    .single();

  if (existing) {
    return Response.json(
      { success: false, error: "Puzzle already exists for this date and game mode", existing_id: existing.id },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("daily_puzzles")
    .insert({
      puzzle_date: parsed.puzzle_date,
      game_mode: parsed.game_mode,
      content: parsed.content,
      status: parsed.status,
      difficulty: parsed.difficulty ?? null,
      source: parsed.source,
      triggered_by: "api",
    })
    .select("id, puzzle_date, game_mode, status, difficulty, source, created_at")
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, puzzle: data }, { status: 201 });
}

// ---------------------------------------------------------------------------
// PUT — Upsert (create or update by date+mode, idempotent)
// ---------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseAndValidateBody(body);
  if ("error" in parsed) {
    return Response.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Check if exists
  const { data: existing } = await supabase
    .from("daily_puzzles")
    .select("id")
    .eq("puzzle_date", parsed.puzzle_date)
    .eq("game_mode", parsed.game_mode)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("daily_puzzles")
      .update({
        content: parsed.content,
        status: parsed.status,
        difficulty: parsed.difficulty ?? null,
        source: parsed.source,
        triggered_by: "api",
      })
      .eq("id", existing.id)
      .select("id, puzzle_date, game_mode, status, difficulty, source, created_at, updated_at")
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, action: "updated", puzzle: data });
  }

  // Create new
  const { data, error } = await supabase
    .from("daily_puzzles")
    .insert({
      puzzle_date: parsed.puzzle_date,
      game_mode: parsed.game_mode,
      content: parsed.content,
      status: parsed.status,
      difficulty: parsed.difficulty ?? null,
      source: parsed.source,
      triggered_by: "api",
    })
    .select("id, puzzle_date, game_mode, status, difficulty, source, created_at")
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, action: "created", puzzle: data }, { status: 201 });
}

// ---------------------------------------------------------------------------
// GET — List puzzles by date range
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const gameMode = searchParams.get("game_mode");
  const status = searchParams.get("status");
  const includeContent = searchParams.get("include_content") === "true";

  if (!from || !to) {
    return Response.json(
      { success: false, error: "Both 'from' and 'to' query parameters are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return Response.json(
      { success: false, error: "Dates must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  // Validate date range (max 60 days)
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    return Response.json(
      { success: false, error: "'from' must be before or equal to 'to'" },
      { status: 400 }
    );
  }
  if (diffDays > 60) {
    return Response.json(
      { success: false, error: "Date range cannot exceed 60 days" },
      { status: 400 }
    );
  }

  if (gameMode && !GAME_MODES.includes(gameMode as GameMode)) {
    return Response.json(
      { success: false, error: `Invalid game_mode. Valid modes: ${GAME_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  const selectFields = includeContent
    ? "id, puzzle_date, game_mode, status, difficulty, source, content, created_at, updated_at"
    : "id, puzzle_date, game_mode, status, difficulty, source, created_at, updated_at";

  let query = supabase
    .from("daily_puzzles")
    .select(selectFields)
    .gte("puzzle_date", from)
    .lte("puzzle_date", to)
    .order("puzzle_date", { ascending: true })
    .order("game_mode", { ascending: true });

  if (gameMode) {
    query = query.eq("game_mode", gameMode);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, count: data.length, puzzles: data });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ValidatedBody = {
  puzzle_date: string;
  game_mode: keyof typeof contentSchemaMap;
  content: Json;
  status: "live" | "draft" | "archived";
  difficulty?: "easy" | "medium" | "hard" | null;
  source?: string | null;
};

function parseAndValidateBody(body: Record<string, unknown>): ValidatedBody | { error: string } {
  // Validate base fields
  const baseResult = puzzleBaseSchema.safeParse(body);
  if (!baseResult.success) {
    const fieldErrors = baseResult.error.flatten().fieldErrors;
    return { error: JSON.stringify(fieldErrors) };
  }

  const { puzzle_date, game_mode, status, difficulty, source } = baseResult.data;

  // Validate game_mode is in contentSchemaMap
  if (!(game_mode in contentSchemaMap)) {
    return { error: `Invalid game_mode "${game_mode}". Valid modes: ${GAME_MODES.join(", ")}` };
  }

  // Validate content
  if (!body.content || typeof body.content !== "object") {
    return { error: "content is required and must be an object" };
  }

  const contentResult = validateContent(game_mode as keyof typeof contentSchemaMap, body.content);
  if (!contentResult.success) {
    const fieldErrors = contentResult.error.flatten().fieldErrors;
    return { error: JSON.stringify(fieldErrors) };
  }

  return {
    puzzle_date,
    game_mode: game_mode as keyof typeof contentSchemaMap,
    content: contentResult.data as Json,
    status,
    difficulty: difficulty ?? null,
    source: source ?? "ai_generated",
  };
}
