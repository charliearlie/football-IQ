import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limitParam = Math.min(Number(searchParams.get("limit")) || 10, 25);

  if (q.length < 3) {
    return Response.json(
      { success: false, error: "Query must be at least 3 characters" },
      { status: 400 },
    );
  }

  const supabase = await createAdminClient();

  const activeOnly = searchParams.get("active_only") === "true";

  const { data, error } = await supabase.rpc("search_players_oracle", {
    query_text: q,
    match_limit: limitParam,
    active_only: activeOnly,
  });

  if (error) {
    return Response.json(
      { success: false, error: "Player search failed" },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    count: data?.length ?? 0,
    players: data ?? [],
  });
}
