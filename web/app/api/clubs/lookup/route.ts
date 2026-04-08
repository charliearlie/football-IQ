import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/clubs/lookup?name=Bayern+Munich&country=DE
 *
 * Returns canonical club names from the database, so external systems
 * (e.g. OpenClaw) can resolve LLM-generated names to DB-canonical ones.
 */
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const country = searchParams.get("country") ?? null;

  if (!name || name.trim().length < 2) {
    return Response.json(
      { success: false, error: "Query parameter 'name' is required (min 2 chars)" },
      { status: 400 },
    );
  }

  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("match_club_by_name", {
    club_name_input: name.trim(),
    ...(country ? { player_country_code: country } : {}),
  });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  const matches = (data as { club_id: string; club_name: string; country_code: string; appearance_count: number; match_score: number }[]) ?? [];

  return Response.json({
    success: true,
    query: name.trim(),
    matches: matches.map((m) => ({
      club_id: m.club_id,
      club_name: m.club_name,
      country_code: m.country_code,
      match_score: m.match_score,
    })),
  });
}
