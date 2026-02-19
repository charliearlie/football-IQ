"use server";

import { createAdminClient, ensureAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/(dashboard)/admin/actions";
import type { Json } from "@/types/supabase";

interface TimelineEventInput {
  text: string;
  year: number;
  month?: number;
}

interface CreateTimelinePuzzleInput {
  puzzleDate: string;
  status: "draft" | "live";
  title?: string;
  subject?: string;
  subject_id?: string;
  events: TimelineEventInput[];
}

export async function createTimelinePuzzle(
  input: CreateTimelinePuzzleInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await ensureAdmin();
    const supabase = await createAdminClient();

    const { puzzleDate, status, title, subject, subject_id, events } = input;

    // Validate: exactly 6 events
    if (events.length !== 6) {
      return { success: false, error: "Exactly 6 events are required" };
    }

    // Validate each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event.text.trim()) {
        return { success: false, error: `Event ${i + 1} has no text` };
      }
      if (!event.year || event.year < 1900 || event.year > 2100) {
        return { success: false, error: `Event ${i + 1} has an invalid year` };
      }
      if (event.month !== undefined && (event.month < 1 || event.month > 12)) {
        return { success: false, error: `Event ${i + 1} has an invalid month (1-12)` };
      }
    }

    // Validate: events are in chronological order
    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];

      if (curr.year < prev.year) {
        return {
          success: false,
          error: `Events must be in chronological order. Event ${i + 1} (${curr.year}) comes before Event ${i} (${prev.year})`
        };
      }

      if (curr.year === prev.year) {
        const prevMonth = prev.month ?? 0;
        const currMonth = curr.month ?? 0;
        if (currMonth > 0 && prevMonth > 0 && currMonth < prevMonth) {
          return {
            success: false,
            error: `Events must be in chronological order. Event ${i + 1} (month ${currMonth}) comes before Event ${i} (month ${prevMonth})`
          };
        }
      }
    }

    // Insert into daily_puzzles
    const { data, error } = await supabase
      .from("daily_puzzles")
      .insert({
        puzzle_date: puzzleDate,
        game_mode: "timeline",
        status,
        content: {
          ...(title?.trim() ? { title: title.trim() } : {}),
          ...(subject?.trim() ? { subject: subject.trim() } : {}),
          ...(subject_id?.trim() ? { subject_id: subject_id.trim() } : {}),
          events
        } as unknown as Json,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/timeline");
    return { success: true, data: { id: data.id } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create puzzle",
    };
  }
}

interface TimelinePuzzleRow {
  id: string;
  puzzle_date: string | null;
  status: string | null;
  content: Record<string, unknown>;
}

export async function fetchTimelinePuzzles(
  page: number,
  pageSize: number
): Promise<ActionResult<{ puzzles: TimelinePuzzleRow[]; totalCount: number }>> {
  try {
    const supabase = await createAdminClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("daily_puzzles")
      .select("id, puzzle_date, status, content", { count: "exact" })
      .eq("game_mode", "timeline")
      .order("puzzle_date", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        puzzles: (data ?? []) as TimelinePuzzleRow[],
        totalCount: count ?? 0,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch puzzles",
    };
  }
}
