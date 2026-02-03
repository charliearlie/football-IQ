"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlagIcon } from "@/components/ui/flag-icon";
import { useAdminPuzzles } from "@/hooks/use-admin-puzzles";
import { GAME_MODE_SHORT_NAMES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface PuzzleArchiveTableProps {
  gameMode: GameMode | GameMode[];
  onRowClick?: (puzzleId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  live: "bg-pitch-green/20 text-pitch-green border-pitch-green/30",
  draft: "bg-card-yellow/20 text-card-yellow border-card-yellow/30",
  archived: "bg-white/10 text-muted-foreground border-white/10",
};

export function PuzzleArchiveTable({
  gameMode,
  onRowClick,
}: PuzzleArchiveTableProps) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const isMultiMode = Array.isArray(gameMode);
  const pageSize = 25;

  const { rows, totalCount, isLoading, error } = useAdminPuzzles({
    gameMode,
    page,
    pageSize,
    status,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={status ?? "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? null : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {totalCount} puzzle{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-card">
          Error: {error.message}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No puzzles found
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Answer</TableHead>
                {isMultiMode && (
                  <TableHead className="text-muted-foreground">Mode</TableHead>
                )}
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Uses
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => onRowClick?.(row.id)}
                >
                  <TableCell className="text-floodlight">
                    {row.puzzle_date ? (
                      formatDate(row.puzzle_date)
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-card-yellow/30 text-card-yellow"
                      >
                        Backlog
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.nationality_code && (
                        <FlagIcon code={row.nationality_code} size={16} />
                      )}
                      <span className="text-floodlight">{row.answer}</span>
                    </div>
                  </TableCell>
                  {isMultiMode && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-white/20 text-muted-foreground text-xs"
                      >
                        {GAME_MODE_SHORT_NAMES[
                          row.game_mode as GameMode
                        ] ?? row.game_mode}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        STATUS_COLORS[row.status ?? ""] ??
                        STATUS_COLORS.archived
                      }
                    >
                      {row.status ?? "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.usage_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="border-white/10"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="border-white/10"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
