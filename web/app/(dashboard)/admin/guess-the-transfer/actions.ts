"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { transferGuessContentSchema } from "@/lib/schemas";
import { addDays, format } from "date-fns";
import type { Json } from "@/types/supabase";

interface BulkImportResult {
  success: boolean;
  inserted?: number;
  dates?: string[];
  error?: string;
  validationErrors?: { index: number; errors: string[] }[];
}

const START_DATE = "2026-03-27";
const MAX_DAYS_SEARCH = 365;

export async function bulkImportTransfers(
  items: unknown[]
): Promise<BulkImportResult> {
  try {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: "Expected a non-empty array of transfers" };
    }

    // Validate every item against the schema
    const validationErrors: { index: number; errors: string[] }[] = [];
    const validated: ReturnType<typeof transferGuessContentSchema.parse>[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = transferGuessContentSchema.safeParse(items[i]);
      if (!result.success) {
        validationErrors.push({
          index: i,
          errors: result.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`
          ),
        });
      } else {
        validated.push(result.data);
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, validationErrors };
    }

    // Fetch all occupied dates for guess_the_transfer from START_DATE onwards
    const supabase = await createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("daily_puzzles")
      .select("puzzle_date")
      .eq("game_mode", "guess_the_transfer")
      .gte("puzzle_date", START_DATE);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const occupiedDates = new Set(
      (existing ?? []).map((p) => p.puzzle_date).filter(Boolean)
    );

    // Find empty dates starting from START_DATE
    const emptyDates: string[] = [];
    const start = new Date(START_DATE + "T00:00:00");

    for (let d = 0; d < MAX_DAYS_SEARCH && emptyDates.length < validated.length; d++) {
      const date = format(addDays(start, d), "yyyy-MM-dd");
      if (!occupiedDates.has(date)) {
        emptyDates.push(date);
      }
    }

    if (emptyDates.length < validated.length) {
      return {
        success: false,
        error: `Only ${emptyDates.length} empty slots available in the next ${MAX_DAYS_SEARCH} days, but ${validated.length} transfers provided`,
      };
    }

    // Build rows for batch insert
    const rows = validated.map((content, i) => ({
      puzzle_date: emptyDates[i],
      game_mode: "guess_the_transfer" as const,
      content: content as unknown as Json,
      status: "live",
      source: "manual",
      triggered_by: "manual",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from("daily_puzzles")
      .insert(rows);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath("/calendar");
    revalidatePath("/admin/guess-the-transfer");

    return {
      success: true,
      inserted: rows.length,
      dates: emptyDates.slice(0, validated.length),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
