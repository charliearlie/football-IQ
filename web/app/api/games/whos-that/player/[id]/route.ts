import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PlayerAttributes {
  club: string;
  league: string;
  birth_year: number | null;
}

/**
 * Public player-attributes lookup for the Who's That? game.
 * Returns the player's current club + league via the `get_balldle_attributes` RPC.
 * Used to enrich an autocomplete-selected player with the data needed to generate
 * feedback. Retired players (no current club) return `club: ""` — the client
 * rejects those before submitting a guess.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 2) {
    return Response.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("get_balldle_attributes", {
    p_player_id: id,
  });

  if (error || data == null) {
    return Response.json({ error: "lookup_failed" }, { status: 500 });
  }

  const attrs = typeof data === "string" ? JSON.parse(data) : data;
  const club: string = (attrs?.club ?? "")
    .replace(/ F\.?C\.?$/i, "")
    .replace(/ A\.?F\.?C\.?$/i, "")
    .trim();

  const result: PlayerAttributes = {
    club,
    league: typeof attrs?.league === "string" ? attrs.league : "",
    birth_year: typeof attrs?.birth_year === "number" ? attrs.birth_year : null,
  };

  return Response.json(result);
}
