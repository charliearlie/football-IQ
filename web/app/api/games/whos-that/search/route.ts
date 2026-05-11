import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PlayerSearchResult {
  id: string;
  name: string;
  birth_year: number | null;
  position_category: string | null;
  nationality_code: string | null;
}

/**
 * Public player-name autocomplete endpoint for the Who's That? game.
 * No auth required (the data exposed here is name + birth year + nationality code +
 * broad position — none of which are sensitive). Limited to top 10 results.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 3) {
    return Response.json({ players: [] satisfies PlayerSearchResult[] });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("search_players_oracle", {
    query_text: q,
    match_limit: 10,
    active_only: true,
  });

  if (error || !data) {
    return Response.json(
      { players: [] satisfies PlayerSearchResult[], error: "search_failed" },
      { status: 500 }
    );
  }

  const players: PlayerSearchResult[] = data.map((row: {
    id: string;
    name: string;
    birth_year: number | null;
    position_category: string | null;
    nationality_code: string | null;
  }) => ({
    id: row.id,
    name: row.name,
    birth_year: row.birth_year,
    position_category: row.position_category,
    nationality_code: row.nationality_code,
  }));

  return Response.json({ players });
}
