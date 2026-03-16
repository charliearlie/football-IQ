import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { contentSchemaMap, validateContent } from "@/lib/schemas/puzzle-schemas";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// PATCH — Update a puzzle by UUID
// ---------------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { id } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Fetch existing puzzle to get game_mode for content validation
  const { data: existing, error: fetchError } = await supabase
    .from("daily_puzzles")
    .select("id, game_mode")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return Response.json({ success: false, error: "Puzzle not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  // Validate content if provided
  if (body.content !== undefined) {
    if (typeof body.content !== "object" || body.content === null) {
      return Response.json(
        { success: false, error: "content must be an object" },
        { status: 400 }
      );
    }

    const gameMode = existing.game_mode as keyof typeof contentSchemaMap;
    if (!(gameMode in contentSchemaMap)) {
      return Response.json(
        { success: false, error: `Cannot validate content for game_mode "${gameMode}"` },
        { status: 400 }
      );
    }

    const contentResult = validateContent(gameMode, body.content);
    if (!contentResult.success) {
      const fieldErrors = contentResult.error.flatten().fieldErrors;
      return Response.json(
        { success: false, error: JSON.stringify(fieldErrors) },
        { status: 400 }
      );
    }
    updates.content = contentResult.data as Json;
  }

  // Optional fields
  if (body.status !== undefined) {
    if (!["live", "draft", "archived"].includes(body.status)) {
      return Response.json(
        { success: false, error: "status must be one of: live, draft, archived" },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (body.difficulty !== undefined) {
    if (body.difficulty !== null && !["easy", "medium", "hard"].includes(body.difficulty)) {
      return Response.json(
        { success: false, error: "difficulty must be one of: easy, medium, hard, or null" },
        { status: 400 }
      );
    }
    updates.difficulty = body.difficulty;
  }

  if (body.source !== undefined) {
    updates.source = body.source;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { success: false, error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updates.triggered_by = "api";

  const { data, error } = await supabase
    .from("daily_puzzles")
    .update(updates)
    .eq("id", id)
    .select("id, puzzle_date, game_mode, status, difficulty, source, created_at, updated_at")
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, puzzle: data });
}

// ---------------------------------------------------------------------------
// DELETE — Remove a puzzle by UUID
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: existing } = await supabase
    .from("daily_puzzles")
    .select("id")
    .eq("id", id)
    .single();

  if (!existing) {
    return Response.json({ success: false, error: "Puzzle not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("daily_puzzles")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, deleted_id: id });
}
