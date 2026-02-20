"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  createTimelinePuzzle,
  fetchTimelinePuzzles,
} from "@/app/(dashboard)/admin/timeline/actions";

interface EventFormData {
  text: string;
  year: string;
  month: string;
}

function createEmptyEvents(): EventFormData[] {
  return Array.from({ length: 6 }, () => ({
    text: "",
    year: "",
    month: "",
  }));
}

export default function TimelineAdminPage() {
  return (
    <AdminPageShell
      title="Timeline"
      subtitle="Create and manage Timeline puzzles"
    >
      <CreatePuzzleForm />
      <PuzzleArchive />
    </AdminPageShell>
  );
}

// ============================================================================
// Create Puzzle Form
// ============================================================================

function CreatePuzzleForm() {
  const [puzzleDate, setPuzzleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"draft" | "live">("draft");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [events, setEvents] = useState<EventFormData[]>(createEmptyEvents);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateEvent(index: number, partial: Partial<EventFormData>) {
    setEvents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...partial };
      return next;
    });
  }

  function validateLocally(): string | null {
    // Check all events filled
    for (let i = 0; i < 6; i++) {
      const event = events[i];
      if (!event.text.trim()) {
        return `Event ${i + 1} has no text`;
      }
      if (!event.year.trim()) {
        return `Event ${i + 1} has no year`;
      }
      const year = parseInt(event.year, 10);
      if (isNaN(year) || year < 1900 || year > 2100) {
        return `Event ${i + 1} has an invalid year`;
      }
      if (event.month.trim()) {
        const month = parseInt(event.month, 10);
        if (isNaN(month) || month < 1 || month > 12) {
          return `Event ${i + 1} has an invalid month (1-12)`;
        }
      }
    }

    // Check chronological order
    for (let i = 1; i < 6; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      const prevYear = parseInt(prev.year, 10);
      const currYear = parseInt(curr.year, 10);

      if (currYear < prevYear) {
        return `Events must be in chronological order. Event ${i + 1} (${currYear}) comes before Event ${i} (${prevYear})`;
      }

      if (currYear === prevYear && prev.month.trim() && curr.month.trim()) {
        const prevMonth = parseInt(prev.month, 10);
        const currMonth = parseInt(curr.month, 10);
        if (currMonth < prevMonth) {
          return `Events must be in chronological order. Event ${i + 1} (month ${currMonth}) comes before Event ${i} (month ${prevMonth})`;
        }
      }
    }

    return null;
  }

  async function handleCreate() {
    setError(null);
    setSuccess(null);

    const localError = validateLocally();
    if (localError) {
      setError(localError);
      return;
    }

    setSaving(true);
    try {
      const res = await createTimelinePuzzle({
        puzzleDate,
        status,
        title: title.trim() || undefined,
        subject: subject.trim() || undefined,
        subject_id: subjectId.trim() || undefined,
        events: events.map((e) => ({
          text: e.text.trim(),
          year: parseInt(e.year, 10),
          month: e.month.trim() ? parseInt(e.month, 10) : undefined,
        })),
      });

      if (res.success) {
        setSuccess(`Puzzle created (ID: ${res.data?.id})`);
        setTitle("");
        setSubject("");
        setSubjectId("");
        setEvents(createEmptyEvents());
      } else {
        setError(res.error ?? "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-floodlight">
          Create New Puzzle
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Define 6 events in chronological order
        </p>
      </div>

      {/* Date + Status row */}
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Puzzle date
          </label>
          <input
            type="date"
            value={puzzleDate}
            onChange={(e) => setPuzzleDate(e.target.value)}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "live")}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
          >
            <option value="draft">Draft</option>
            <option value="live">Live</option>
          </select>
        </div>
      </div>

      {/* Title / Subject fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Title / Theme
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='e.g., "Premier League Moments" (optional — for themed timelines)'
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
          />
          <p className="text-xs text-muted-foreground/60">
            Shown as the header on the game screen. Leave blank if using Subject below.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Subject Name
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder='e.g., "Lionel Messi" (optional — for player career timelines)'
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
          />
          <p className="text-xs text-muted-foreground/60">
            Shows as &ldquo;CAREER OF &middot; NAME&rdquo; on the game screen. Title takes priority if both are set.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Subject ID
          </label>
          <input
            type="text"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            placeholder='e.g., "Q615" for Lionel Messi'
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Event editors */}
      <div className="space-y-4">
        {events.map((event, ei) => (
          <div
            key={ei}
            className="rounded-md border border-white/10 bg-white/[0.03] p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-floodlight">
                Event {ei + 1}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Description *
              </label>
              <input
                type="text"
                value={event.text}
                onChange={(e) => updateEvent(ei, { text: e.target.value })}
                placeholder='e.g., "Joined Barcelona youth academy"'
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Year *
                </label>
                <input
                  type="number"
                  value={event.year}
                  onChange={(e) => updateEvent(ei, { year: e.target.value })}
                  placeholder="2000"
                  min={1900}
                  max={2100}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Month (optional)
                </label>
                <input
                  type="number"
                  value={event.month}
                  onChange={(e) => updateEvent(ei, { month: e.target.value })}
                  placeholder="1-12"
                  min={1}
                  max={12}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-pitch-green/30 bg-pitch-green/10 px-4 py-3 text-sm text-pitch-green">
          {success}
        </div>
      )}

      {/* Submit */}
      <Button onClick={handleCreate} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus />
            Create Puzzle
          </>
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// Puzzle Archive
// ============================================================================

interface PuzzleRow {
  id: string;
  puzzle_date: string | null;
  status: string | null;
  content: Record<string, unknown>;
}

function PuzzleArchive() {
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  const loadPuzzles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTimelinePuzzles(page, pageSize);
      if (res.success && res.data) {
        setPuzzles(res.data.puzzles);
        setTotalCount(res.data.totalCount);
      } else {
        setError(res.error ?? "Failed to load puzzles");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPuzzles();
  }, [loadPuzzles]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function getLabel(content: Record<string, unknown>): string {
    if (content.title) return content.title as string;
    if (content.subject) return content.subject as string;
    return "Untitled";
  }

  function getEventCount(content: Record<string, unknown>): number {
    const events = content.events as Array<unknown> | undefined;
    return events?.length ?? 0;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-floodlight">
            Puzzle Archive
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} timeline puzzle{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : puzzles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No timeline puzzles yet. Create one above.
        </p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Title / Subject
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    Events
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {puzzles.map((puzzle) => (
                  <tr key={puzzle.id} className="hover:bg-white/5">
                    <td className="py-2 px-3 text-floodlight font-mono text-xs">
                      {puzzle.puzzle_date ?? "No date"}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        variant={
                          puzzle.status === "live"
                            ? "success"
                            : puzzle.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {puzzle.status ?? "unknown"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-floodlight">
                      {getLabel(puzzle.content)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {getEventCount(puzzle.content)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
