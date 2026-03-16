import { NextRequest } from "next/server";
import { z } from "zod";
import { validateApiAuth } from "@/lib/api-auth";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { contentSchemaMap } from "@/lib/schemas/puzzle-schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameMode: string }> }
) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { gameMode } = await params;

  if (!GAME_MODES.includes(gameMode as GameMode)) {
    return Response.json(
      {
        success: false,
        error: `Invalid game_mode "${gameMode}". Valid modes: ${GAME_MODES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const mode = gameMode as keyof typeof contentSchemaMap;
  const contentSchema = contentSchemaMap[mode];
  const jsonSchema = z.toJSONSchema(contentSchema);

  return Response.json({
    success: true,
    game_mode: gameMode,
    display_name: GAME_MODE_DISPLAY_NAMES[mode],
    content_schema: jsonSchema,
    envelope: {
      puzzle_date: { type: "string", format: "YYYY-MM-DD", required: true },
      game_mode: { type: "string", enum: GAME_MODES, required: true },
      status: { type: "string", enum: ["live", "draft", "scheduled", "archived"], default: "draft" },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"], nullable: true },
      source: { type: "string", enum: ["manual", "ai_generated"], default: "ai_generated", nullable: true },
    },
  });
}
