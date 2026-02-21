"use client";

import { useState } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  runContentIntegrityChecks,
  type IntegrityCheckResult,
  type IntegrityIssue,
} from "./actions";
import {
  GAME_MODES,
  GAME_MODE_DISPLAY_NAMES,
  type GameMode,
} from "@/lib/constants";

export default function ContentIntegrityPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<IntegrityCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    live: true,
    draft: true,
    archived: false,
  });
  const [gameModeFilters, setGameModeFilters] = useState<
    Record<string, boolean>
  >({});

  function toggleStatus(status: string) {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  }

  function toggleGameMode(mode: string) {
    setGameModeFilters((prev) => ({ ...prev, [mode]: !prev[mode] }));
  }

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);

    const statuses = Object.entries(statusFilters)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const gameModes = Object.entries(gameModeFilters)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      const res = await runContentIntegrityChecks({
        statuses,
        gameModes: gameModes.length > 0 ? gameModes : undefined,
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setRunning(false);
    }
  }

  // Group issues by game mode for display
  const issuesByMode = new Map<string, IntegrityIssue[]>();
  if (result) {
    for (const issue of result.issues) {
      const existing = issuesByMode.get(issue.gameMode) ?? [];
      existing.push(issue);
      issuesByMode.set(issue.gameMode, existing);
    }
  }

  return (
    <AdminPageShell
      title="Content Integrity"
      subtitle="Automated validation of puzzle content against player and club databases"
    >
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-floodlight">
              Run Integrity Checks
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Validate puzzle content against the player and club databases
            </p>
          </div>
          <Badge variant="secondary">Batch</Badge>
        </div>

        {/* Status filters */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Puzzle status
            </label>
            <div className="flex items-center gap-4">
              {["live", "draft", "archived"].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={statusFilters[status] ?? false}
                    onChange={() => toggleStatus(status)}
                    className="rounded border-white/20"
                  />
                  <span className="text-sm text-muted-foreground capitalize">
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Game mode filters */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Game modes (leave empty for all)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {GAME_MODES.map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={gameModeFilters[mode] ?? false}
                    onChange={() => toggleGameMode(mode)}
                    className="rounded border-white/20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {GAME_MODE_DISPLAY_NAMES[mode]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleRun} disabled={running}>
          {running ? (
            <>
              <Loader2 className="animate-spin" />
              Running checks...
            </>
          ) : (
            <>
              <ShieldCheck />
              Run Checks
            </>
          )}
        </Button>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Success banner if no issues */}
            {result.totalIssues === 0 ? (
              <div className="flex items-start gap-3 rounded-md border border-pitch-green/30 bg-pitch-green/10 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-pitch-green shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-pitch-green">
                    All checks passed
                  </p>
                  <p className="text-xs text-pitch-green/70 mt-0.5">
                    {result.totalPuzzlesChecked} puzzles checked with zero
                    issues found.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-md border border-card-yellow/30 bg-card-yellow/10 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-card-yellow shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-card-yellow">
                    {result.totalIssues} issue
                    {result.totalIssues !== 1 ? "s" : ""} found
                  </p>
                  <p className="text-xs text-card-yellow/70 mt-0.5">
                    {result.issuesBySeverity.error} error
                    {result.issuesBySeverity.error !== 1 ? "s" : ""},{" "}
                    {result.issuesBySeverity.warning} warning
                    {result.issuesBySeverity.warning !== 1 ? "s" : ""} across{" "}
                    {result.totalPuzzlesChecked} puzzles.
                  </p>
                </div>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Puzzles checked"
                value={result.totalPuzzlesChecked}
              />
              <StatCard
                label="Total issues"
                value={result.totalIssues}
                variant={result.totalIssues > 0 ? "warning" : undefined}
              />
              <StatCard
                label="Errors"
                value={result.issuesBySeverity.error}
                variant={
                  result.issuesBySeverity.error > 0 ? "error" : undefined
                }
              />
              <StatCard
                label="Warnings"
                value={result.issuesBySeverity.warning}
                variant={
                  result.issuesBySeverity.warning > 0 ? "warning" : undefined
                }
              />
            </div>

            {/* Issues by game mode */}
            {Array.from(issuesByMode.entries())
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([mode, issues]) => (
                <GameModeSection key={mode} mode={mode} issues={issues} />
              ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

// ============================================================================
// Local Components
// ============================================================================


function GameModeSection({
  mode,
  issues,
}: {
  mode: string;
  issues: IntegrityIssue[];
}) {
  const [expanded, setExpanded] = useState(true);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const displayName =
    GAME_MODE_DISPLAY_NAMES[mode as GameMode] ?? mode;

  return (
    <div className="rounded-md border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-white/5 border-b border-white/10 hover:bg-white/[0.07] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              expanded ? "" : "-rotate-90"
            }`}
          />
          <h3 className="text-sm font-medium text-floodlight">
            {displayName}
          </h3>
          <span className="text-xs text-muted-foreground">
            {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <Badge
              variant="destructive"
              className="bg-red-card text-white border-transparent"
            >
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="warning">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-white/5">
          {issues.map((issue, idx) => (
            <IssueRow key={`${issue.puzzleId}-${issue.check}-${idx}`} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: IntegrityIssue }) {
  return (
    <div className="flex items-start gap-3 px-4 py-2.5 text-sm">
      {/* Date */}
      <span className="text-xs text-muted-foreground font-mono shrink-0 w-24 pt-0.5">
        {issue.puzzleDate ?? "no date"}
      </span>

      {/* Severity badge */}
      <Badge
        variant={issue.severity === "error" ? "destructive" : "warning"}
        className={
          issue.severity === "error"
            ? "bg-red-card text-white border-transparent shrink-0"
            : "shrink-0"
        }
      >
        {issue.severity}
      </Badge>

      {/* Check + message */}
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground font-mono">
          {issue.check}
        </span>
        <p className="text-sm text-floodlight mt-0.5">{issue.message}</p>
      </div>

      {/* Player link */}
      {issue.playerQid && (
        <a
          href={`/admin/players/${issue.playerQid}`}
          className="text-xs text-pitch-green hover:underline shrink-0 pt-0.5"
        >
          {issue.playerQid}
        </a>
      )}
    </div>
  );
}
