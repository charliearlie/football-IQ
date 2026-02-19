"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { connectionsContentSchema } from "@/lib/schemas";
import {
  createConnectionsPuzzle,
  fetchConnectionsPuzzles,
} from "@/app/(dashboard)/admin/connections/actions";

type Difficulty = "yellow" | "green" | "blue" | "purple";

interface GroupFormData {
  category: string;
  difficulty: Difficulty;
  players: [string, string, string, string];
}

const DIFFICULTIES: Difficulty[] = ["yellow", "green", "blue", "purple"];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  yellow: "bg-yellow-400",
  green: "bg-pitch-green",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

const DIFFICULTY_BORDER: Record<Difficulty, string> = {
  yellow: "border-l-yellow-400",
  green: "border-l-pitch-green",
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
};

function createEmptyGroups(): GroupFormData[] {
  return DIFFICULTIES.map((d) => ({
    category: "",
    difficulty: d,
    players: ["", "", "", ""],
  }));
}

export default function ConnectionsAdminPage() {
  return (
    <AdminPageShell
      title="Connections"
      subtitle="Create and manage Football Connections puzzles"
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
  const [groups, setGroups] = useState<GroupFormData[]>(createEmptyGroups);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  function updateGroup(index: number, partial: Partial<GroupFormData>) {
    setGroups((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...partial };
      return next;
    });
  }

  function updatePlayer(
    groupIndex: number,
    playerIndex: number,
    value: string
  ) {
    setGroups((prev) => {
      const next = [...prev];
      const players = [...next[groupIndex].players] as [
        string,
        string,
        string,
        string,
      ];
      players[playerIndex] = value;
      next[groupIndex] = { ...next[groupIndex], players };
      return next;
    });
  }

  function handleJsonImport() {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);

      // Normalise: accept "items" as an alias for "players"
      if (parsed?.groups && Array.isArray(parsed.groups)) {
        for (const g of parsed.groups) {
          if (g.items && !g.players) {
            g.players = g.items;
            delete g.items;
          }
        }
      }

      const result = connectionsContentSchema.safeParse(parsed);
      if (!result.success) {
        setJsonError(result.error.issues.map((i) => i.message).join(", "));
        return;
      }
      setGroups(
        result.data.groups.map((g) => ({
          category: g.category,
          difficulty: g.difficulty,
          players: [...g.players] as [string, string, string, string],
        }))
      );
      setJsonInput("");
      setJsonMode(false);
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  function validateLocally(): string | null {
    // Check categories
    for (const group of groups) {
      if (!group.category.trim()) {
        return `The ${group.difficulty} group is missing a category`;
      }
    }

    // Check all players filled
    for (const group of groups) {
      for (let i = 0; i < 4; i++) {
        if (!group.players[i].trim()) {
          return `The ${group.difficulty} group has an empty player name (slot ${i + 1})`;
        }
      }
    }

    // Check uniqueness
    const seen = new Set<string>();
    for (const group of groups) {
      for (const player of group.players) {
        const normalized = player.trim().toLowerCase();
        if (seen.has(normalized)) {
          return `Duplicate player name: "${player.trim()}"`;
        }
        seen.add(normalized);
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
      const res = await createConnectionsPuzzle({
        puzzleDate,
        status,
        groups: groups.map((g) => ({
          category: g.category.trim(),
          difficulty: g.difficulty,
          players: g.players.map((p) => p.trim()),
        })),
      });

      if (res.success) {
        setSuccess(`Puzzle created (ID: ${res.data?.id})`);
        setGroups(createEmptyGroups());
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-floodlight">
            Create New Puzzle
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define 4 groups of 4 items each, with a category and difficulty
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setJsonMode(!jsonMode);
            setJsonError(null);
          }}
        >
          {jsonMode ? "Manual Input" : "Paste JSON"}
        </Button>
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

      {jsonMode ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste the connections JSON below and click Import.
          </p>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={'{\n  "groups": [\n    {\n      "items": ["Item 1", "Item 2", "Item 3", "Item 4"],\n      "category": "Category name",\n      "difficulty": "green"\n    },\n    ...\n  ]\n}'}
            rows={14}
            className="bg-white/5 border-white/10 font-mono text-sm"
          />
          {jsonError && (
            <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
              {jsonError}
            </div>
          )}
          <Button type="button" onClick={handleJsonImport}>
            Import JSON
          </Button>
        </div>
      ) : (
      <>
      {/* Group editors */}
      <div className="space-y-4">
        {groups.map((group, gi) => (
          <div
            key={group.difficulty}
            className={`rounded-md border border-white/10 bg-white/[0.03] p-4 space-y-3 border-l-4 ${DIFFICULTY_BORDER[group.difficulty]}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${DIFFICULTY_COLORS[group.difficulty]}`}
              />
              <span className="text-sm font-medium text-floodlight capitalize">
                {group.difficulty}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <input
                type="text"
                value={group.category}
                onChange={(e) =>
                  updateGroup(gi, { category: e.target.value })
                }
                placeholder='e.g., "Played for Barcelona and PSG"'
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {group.players.map((player, pi) => (
                <input
                  key={pi}
                  type="text"
                  value={player}
                  onChange={(e) => updatePlayer(gi, pi, e.target.value)}
                  placeholder={`Player ${pi + 1}`}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground/40"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

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
      const res = await fetchConnectionsPuzzles(page, pageSize);
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

  function getFirstCategory(content: Record<string, unknown>): string {
    const groups = content.groups as
      | Array<{ category: string }>
      | undefined;
    if (groups && groups.length > 0) {
      return groups[0].category;
    }
    return "No category";
  }

  function getGroupCount(content: Record<string, unknown>): number {
    const groups = content.groups as Array<unknown> | undefined;
    return groups?.length ?? 0;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-floodlight">
            Puzzle Archive
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} connection{totalCount !== 1 ? "s" : ""} puzzle
            {totalCount !== 1 ? "s" : ""}
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
          No connections puzzles yet. Create one above.
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
                    Groups
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">
                    First Category
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
                    <td className="py-2 px-3 text-muted-foreground">
                      {getGroupCount(puzzle.content)}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground truncate max-w-[300px]">
                      {getFirstCategory(puzzle.content)}
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
