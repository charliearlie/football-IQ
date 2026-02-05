"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  fetchPuzzlesMissingQid,
  updatePuzzleAnswerQid,
} from "@/app/(dashboard)/admin/actions";
import { searchPlayersForForm } from "@/app/(dashboard)/calendar/actions";
import type { CleanupRow } from "@/app/(dashboard)/admin/actions";
import type { GameMode } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface CleanupPanelProps {
  gameMode: GameMode | GameMode[];
}

export function CleanupPanel({ gameMode }: CleanupPanelProps) {
  const [rows, setRows] = useState<CleanupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchPuzzlesMissingQid(gameMode);
    if (result.success && result.data) {
      setRows(result.data);
    } else {
      setError(result.error ?? "Failed to fetch");
    }
    setIsLoading(false);
  }, [gameMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolved = (puzzleId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== puzzleId));
    setResolvingId(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-card">Error: {error}</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Check className="h-8 w-8 mx-auto mb-3 text-pitch-green opacity-60" />
        <p>All puzzles have answer QIDs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-card-yellow" />
        <span className="text-sm text-card-yellow">
          {rows.length} puzzles missing QID
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Answer</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-white/10">
                <TableCell className="text-floodlight">
                  {row.puzzle_date
                    ? format(parseISO(row.puzzle_date), "MMM d, yyyy")
                    : "Backlog"}
                </TableCell>
                <TableCell className="text-floodlight">{row.answer}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-white/20 text-muted-foreground"
                  >
                    {row.status ?? "unknown"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {resolvingId === row.id ? (
                    <ResolveInline
                      puzzleId={row.id}
                      answerHint={row.answer}
                      onResolved={() => handleResolved(row.id)}
                      onCancel={() => setResolvingId(null)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResolvingId(row.id)}
                      className="border-card-yellow/30 text-card-yellow hover:bg-card-yellow/10"
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ============================================================================
// INLINE RESOLVE
// ============================================================================

interface ResolveInlineProps {
  puzzleId: string;
  answerHint: string;
  onResolved: () => void;
  onCancel: () => void;
}

function ResolveInline({
  puzzleId,
  answerHint,
  onResolved,
  onCancel,
}: ResolveInlineProps) {
  const [query, setQuery] = useState(answerHint);
  const [results, setResults] = useState<
    Array<{ id: string; name: string; birth_year: number | null }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Auto-search with the answer hint
    handleSearch(answerHint);
  }, [answerHint]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const result = await searchPlayersForForm(value);
      if (result.success && result.data) {
        setResults(result.data);
      }
    }, 300);
  };

  const handleSelect = async (qid: string) => {
    setIsSaving(true);
    const result = await updatePuzzleAnswerQid(puzzleId, qid);
    if (result.success) {
      onResolved();
    }
    setIsSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-48 h-8 text-xs bg-white/5 border-white/10"
          placeholder="Search player..."
        />
        {results.length > 0 && (
          <div className="absolute z-50 right-0 mt-1 w-64 rounded-lg border border-white/10 bg-stadium-navy shadow-lg overflow-hidden">
            {results.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelect(r.id)}
                disabled={isSaving}
                className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 flex justify-between"
              >
                <span className="text-floodlight">{r.name}</span>
                <span className="text-muted-foreground">{r.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onCancel}
        className="text-muted-foreground hover:text-floodlight"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
