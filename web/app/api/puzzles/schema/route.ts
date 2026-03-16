import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const modes = GAME_MODES.map((mode) => ({
    game_mode: mode,
    display_name: GAME_MODE_DISPLAY_NAMES[mode],
    schema_url: `/api/puzzles/schema/${mode}`,
  }));

  return Response.json({ success: true, modes });
}
