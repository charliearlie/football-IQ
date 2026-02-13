"use client";

import { useState } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  runApiFootballMapping,
  runCareerValidation,
  acceptFlaggedMapping,
  inspectApiPlayer,
} from "@/app/(dashboard)/admin/actions";
import type {
  MappingRunResult,
  CareerValidationResult,
  PlayerCareerValidation,
  ClubMapping,
  AmbiguousCandidate,
  ApiClubSummary,
} from "@/lib/data-pipeline/map-external-ids";
import { Loader2, Play, FlaskConical, Search, Link2, CheckCircle2, AlertTriangle, Info, Check, ChevronDown, Eye } from "lucide-react";

type MappingResult = MappingRunResult & { savedCount: number };
type ValidationResult = CareerValidationResult & { clubMappingsSaved: number; clubDuplicates: string[] };

export default function DataPipelinePage() {
  return (
    <AdminPageShell
      title="Data Pipeline"
      subtitle="External ID mapping and data reconciliation"
    >
      <MappingCard />
      <CareerValidationCard />
    </AdminPageShell>
  );
}

// ============================================================================
// Phase 1: ID Mapping
// ============================================================================

function MappingCard() {
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(50);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<MappingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptedQids, setAcceptedQids] = useState<Set<string>>(new Set());

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);
    setAcceptedQids(new Set());

    try {
      const res = await runApiFootballMapping({ limit, dryRun });
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

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-floodlight">
            Phase 1: API-Football ID Mapping
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Map Wikidata players to API-Football v3 IDs via name + birth year +
            nationality
          </p>
        </div>
        <Badge variant="warning">7,500 req/day</Badge>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Player limit
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
          />
        </div>

        <label className="flex items-center gap-2 pb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="text-sm text-muted-foreground">Dry run</span>
        </label>

        <Button onClick={handleRun} disabled={running}>
          {running ? (
            <>
              <Loader2 className="animate-spin" />
              Running...
            </>
          ) : dryRun ? (
            <>
              <FlaskConical />
              Dry Run
            </>
          ) : (
            <>
              <Play />
              Run Mapping
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Completion banner */}
          {dryRun ? (
            <div className="flex items-start gap-3 rounded-md border border-blue-400/30 bg-blue-400/10 px-4 py-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-400">Dry run — nothing saved</p>
                <p className="text-xs text-blue-400/70 mt-0.5">
                  Found {result.mapped.length} high-confidence matches.
                  Uncheck &quot;Dry run&quot; and run again to save {result.mapped.length > 0 ? "these" : ""} mappings to the database.
                </p>
              </div>
            </div>
          ) : result.savedCount > 0 ? (
            <div className="flex items-start gap-3 rounded-md border border-pitch-green/30 bg-pitch-green/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-pitch-green shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-pitch-green">
                  Saved {result.savedCount} player ID {result.savedCount === 1 ? "mapping" : "mappings"} to database
                </p>
                <p className="text-xs text-pitch-green/70 mt-0.5">
                  {result.mapped.length} matched, {result.flaggedForReview.length} flagged for review, {result.skipped.length} skipped.
                  Used {result.requestsUsed} API requests.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-card-yellow/30 bg-card-yellow/10 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-card-yellow shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-card-yellow">No new mappings saved</p>
                <p className="text-xs text-card-yellow/70 mt-0.5">
                  {result.mapped.length} matched but 0 new saves (may already exist).
                  {result.skipped.length} skipped, {result.flaggedForReview.length} flagged.
                  Used {result.requestsUsed} API requests.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              label="Requests used"
              value={`${result.requestsUsed} / ${result.requestBudget}`}
            />
            <StatCard
              label="Mapped"
              value={result.mapped.length}
              variant="success"
            />
            <StatCard
              label="Flagged"
              value={result.flaggedForReview.length}
              variant="warning"
            />
            <StatCard label="Skipped" value={result.skipped.length} />
            <StatCard
              label="Saved to DB"
              value={dryRun ? "dry run" : result.savedCount}
              variant={dryRun ? undefined : "success"}
            />
          </div>

          {result.mapped.length > 0 && (
            <ResultSection title="Mapped (high confidence)" variant="success">
              {result.mapped.map((m) => (
                <MappingRow key={m.playerQid} item={m} />
              ))}
            </ResultSection>
          )}

          {result.flaggedForReview.length > 0 && (
            <ResultSection
              title={`Flagged for review${acceptedQids.size > 0 ? ` (${acceptedQids.size} accepted)` : ""}`}
              variant="warning"
            >
              {result.flaggedForReview.map((m) => (
                <FlaggedMappingRow
                  key={m.playerQid}
                  item={m}
                  accepted={acceptedQids.has(m.playerQid)}
                  onAccepted={(qid) => setAcceptedQids((prev) => new Set(prev).add(qid))}
                />
              ))}
            </ResultSection>
          )}

          {result.skipped.length > 0 && (
            <ResultSection title="Skipped" variant="muted">
              {result.skipped.map((m) => (
                <MappingRow key={m.playerQid} item={m} />
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Phase 2: Career Validation
// ============================================================================

function CareerValidationCard() {
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(50);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await runCareerValidation({ limit, dryRun });
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

  const playersWithIssues =
    result?.validated.filter((v) => v.totalDiscrepancies > 0) ?? [];
  const cleanPlayers =
    result?.validated.filter((v) => v.totalDiscrepancies === 0) ?? [];

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-floodlight">
            Phase 2: Career Validation + Club ID Mapping
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fetch player team histories, bootstrap club ID mappings, and compare
            against our player_appearances.
          </p>
        </div>
        <Badge variant="warning">7,500 req/day</Badge>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Player limit
          </label>
          <input
            type="number"
            min={1}
            max={10000}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-24 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
          />
        </div>

        <label className="flex items-center gap-2 pb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="rounded border-white/20"
          />
          <span className="text-sm text-muted-foreground">Dry run</span>
        </label>

        <Button onClick={handleRun} disabled={running}>
          {running ? (
            <>
              <Loader2 className="animate-spin" />
              Validating...
            </>
          ) : dryRun ? (
            <>
              <FlaskConical />
              Dry Run
            </>
          ) : (
            <>
              <Search />
              Validate + Map
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Completion banner */}
          {dryRun ? (
            <div className="flex items-start gap-3 rounded-md border border-blue-400/30 bg-blue-400/10 px-4 py-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-400">Dry run — nothing saved</p>
                <p className="text-xs text-blue-400/70 mt-0.5">
                  Validated {result.validated.length} players, discovered {result.clubMappingsDiscovered.length} club mappings.
                  Uncheck &quot;Dry run&quot; to save club mappings to the database.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-pitch-green/30 bg-pitch-green/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-pitch-green shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-pitch-green">
                  Saved {result.clubMappingsSaved} club {result.clubMappingsSaved === 1 ? "mapping" : "mappings"} to database
                </p>
                <p className="text-xs text-pitch-green/70 mt-0.5">
                  {result.validated.length} players validated, {playersWithIssues.length} with discrepancies.
                  {result.clubDuplicates.length > 0 ? ` ${result.clubDuplicates.length} potential duplicates flagged.` : ""}
                  Used {result.requestsUsed} API requests.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              label="Requests used"
              value={`${result.requestsUsed} / ${result.requestBudget}`}
            />
            <StatCard
              label="Validated"
              value={result.validated.length}
              variant="success"
            />
            <StatCard
              label="Club mappings"
              value={dryRun ? `${result.clubMappingsDiscovered.length} found` : `${result.clubMappingsSaved} saved`}
              variant={result.clubMappingsDiscovered.length > 0 ? "success" : undefined}
            />
            <StatCard
              label="With discrepancies"
              value={playersWithIssues.length}
              variant={playersWithIssues.length > 0 ? "warning" : undefined}
            />
            <StatCard
              label="Errors"
              value={result.errors.length}
              variant={result.errors.length > 0 ? "warning" : undefined}
            />
          </div>

          {result.clubMappingsDiscovered.length > 0 && (
            <ResultSection title="Club ID mappings discovered" variant="success">
              {result.clubMappingsDiscovered.map((m) => (
                <ClubMappingRow key={m.clubQid} mapping={m} />
              ))}
            </ResultSection>
          )}

          {result.clubDuplicates.length > 0 && (
            <ResultSection title="Potential club duplicates" variant="warning">
              {result.clubDuplicates.map((d, i) => (
                <div key={i} className="px-4 py-2 text-xs text-card-yellow">
                  {d}
                </div>
              ))}
            </ResultSection>
          )}

          {playersWithIssues.length > 0 && (
            <ResultSection title="Players with discrepancies" variant="warning">
              {playersWithIssues.map((v) => (
                <CareerRow key={v.playerQid} player={v} />
              ))}
            </ResultSection>
          )}

          {cleanPlayers.length > 0 && (
            <ResultSection title="Clean (no discrepancies)" variant="success">
              {cleanPlayers.map((v) => (
                <div
                  key={v.playerQid}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono text-xs">
                      {v.playerQid}
                    </span>
                    <span className="text-floodlight">{v.playerName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {v.comparison.matched.length} clubs matched
                  </span>
                </div>
              ))}
            </ResultSection>
          )}

          {result.errors.length > 0 && (
            <ResultSection title="Errors" variant="muted">
              {result.errors.map((e) => (
                <div
                  key={e.playerQid}
                  className="flex items-center justify-between px-4 py-2 text-sm"
                >
                  <span className="text-floodlight">{e.playerName}</span>
                  <span className="text-xs text-red-card">{e.error}</span>
                </div>
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function CareerRow({ player }: { player: PlayerCareerValidation }) {
  const { comparison } = player;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-mono text-xs">
            {player.playerQid}
          </span>
          <span className="text-sm font-medium text-floodlight">
            {player.playerName}
          </span>
        </div>
        <Badge variant="warning">{player.totalDiscrepancies} issues</Badge>
      </div>

      {/* Matched clubs with year diffs */}
      {comparison.matched.length > 0 && (
        <div className="space-y-1 ml-4">
          {comparison.matched.map((m, i) => {
            const hasYearIssue =
              (m.yearDiffStart != null && Math.abs(m.yearDiffStart) > 1) ||
              (m.yearDiffEnd != null && Math.abs(m.yearDiffEnd) > 1);
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    hasYearIssue ? "text-card-yellow" : "text-pitch-green"
                  }
                >
                  {hasYearIssue ? "~" : "="}
                </span>
                <span className="text-muted-foreground">
                  {m.ourClubName}
                </span>
                <span className="text-muted-foreground/50">
                  ours: {m.ourYears.start ?? "?"}-{m.ourYears.end ?? "now"} |
                  api: {m.apiYears.start}-{m.apiYears.end}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Missing from our data */}
      {comparison.missingFromOurs.length > 0 && (
        <div className="space-y-1 ml-4">
          {comparison.missingFromOurs.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-card-yellow">+</span>
              <span className="text-card-yellow">{m.clubName}</span>
              <span className="text-muted-foreground/50">
                {m.startYear}-{m.endYear} (in API, missing from ours)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Missing from API */}
      {comparison.missingFromApi.length > 0 && (
        <div className="space-y-1 ml-4">
          {comparison.missingFromApi.map((m, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">-</span>
              <span className="text-muted-foreground">{m.clubName}</span>
              <span className="text-muted-foreground/50">
                {m.startYear ?? "?"}-{m.endYear ?? "now"} (in ours, not in API)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClubMappingRow({ mapping }: { mapping: ClubMapping }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Link2 className="h-3.5 w-3.5 text-pitch-green shrink-0" />
        <span className="text-muted-foreground font-mono text-xs shrink-0">
          {mapping.clubQid}
        </span>
        <span className="text-floodlight truncate">{mapping.clubName}</span>
        <span className="text-muted-foreground/50 text-xs">&rarr;</span>
        <span className="text-muted-foreground text-xs truncate">
          {mapping.apiClubName} (ID: {mapping.apiFootballId})
        </span>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        via {mapping.discoveredVia}
      </span>
    </div>
  );
}

// ============================================================================
// Shared UI components
// ============================================================================

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: "success" | "warning";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={
          variant === "success"
            ? "text-lg font-semibold text-pitch-green"
            : variant === "warning"
              ? "text-lg font-semibold text-card-yellow"
              : "text-lg font-semibold text-floodlight"
        }
      >
        {value}
      </p>
    </div>
  );
}

function ResultSection({
  title,
  variant,
  children,
}: {
  title: string;
  variant: "success" | "warning" | "muted";
  children: React.ReactNode;
}) {
  const borderColor =
    variant === "success"
      ? "border-pitch-green/20"
      : variant === "warning"
        ? "border-card-yellow/20"
        : "border-white/10";

  return (
    <div className={`rounded-md border ${borderColor} overflow-hidden`}>
      <div className="px-4 py-2 bg-white/5 border-b border-white/10">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function FlaggedMappingRow({
  item,
  accepted,
  onAccepted,
}: {
  item: {
    playerQid: string;
    playerName: string;
    apiFootballId: number | null;
    confidence: string;
    reason: string;
    candidates: number;
    ambiguousCandidates?: AmbiguousCandidate[];
  };
  accepted: boolean;
  onAccepted: (qid: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const hasCandidates = !!item.ambiguousCandidates?.length;

  async function handleAccept(apiFootballId: number) {
    setSaving(true);
    try {
      const res = await acceptFlaggedMapping(item.playerQid, apiFootballId);
      if (res.success) {
        setSelectedId(apiFootballId);
        onAccepted(item.playerQid);
      }
    } finally {
      setSaving(false);
    }
  }

  if (accepted) {
    return (
      <div className="flex items-center justify-between px-4 py-2 text-sm gap-4 bg-pitch-green/5">
        <div className="flex items-center gap-3 min-w-0">
          <Check className="h-4 w-4 text-pitch-green shrink-0" />
          <span className="text-muted-foreground font-mono text-xs shrink-0">
            {item.playerQid}
          </span>
          <span className="text-floodlight truncate">{item.playerName}</span>
          <span className="text-xs text-pitch-green font-mono shrink-0">
            &rarr; {selectedId ?? item.apiFootballId}
          </span>
        </div>
        <Badge variant="success">accepted</Badge>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-2">
      <div className="flex items-center justify-between text-sm gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-muted-foreground font-mono text-xs shrink-0">
            {item.playerQid}
          </span>
          <span className="text-floodlight truncate">{item.playerName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground truncate max-w-[250px]" title={item.reason}>
            {item.reason}
          </span>
          {hasCandidates && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpanded(!expanded)}
            >
              Review
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </Button>
          )}
          <Badge variant="warning">medium</Badge>
        </div>
      </div>

      {/* Candidate review panel */}
      {hasCandidates && expanded && (
        <div className="ml-4 space-y-1.5 pb-1">
          {item.ambiguousCandidates!.map((c) => (
            <CandidateRow
              key={c.apiFootballId}
              candidate={c}
              saving={saving && selectedId === c.apiFootballId}
              onAccept={() => handleAccept(c.apiFootballId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRow({
  candidate,
  saving,
  onAccept,
}: {
  candidate: AmbiguousCandidate;
  saving: boolean;
  onAccept: () => void;
}) {
  const [inspecting, setInspecting] = useState(false);
  const [clubs, setClubs] = useState<ApiClubSummary[] | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  async function handleInspect() {
    if (clubs) {
      setClubs(null);
      return;
    }
    setInspecting(true);
    setInspectError(null);
    try {
      const res = await inspectApiPlayer(candidate.apiFootballId);
      if (res.success && res.data) {
        setClubs(res.data.clubs);
      } else {
        setInspectError(res.error ?? "Failed to fetch");
      }
    } finally {
      setInspecting(false);
    }
  }

  return (
    <div className="rounded-md border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between text-xs px-3 py-2 hover:bg-white/5">
        <div className="flex items-center gap-3 min-w-0">
          {candidate.photo && (
            <img
              src={candidate.photo}
              alt={candidate.name}
              className="h-7 w-7 rounded-full object-cover shrink-0"
            />
          )}
          <span className="text-card-yellow font-mono shrink-0">{candidate.apiFootballId}</span>
          <span className="text-floodlight">{candidate.name}</span>
          <span className="text-muted-foreground">
            {candidate.nationality}{candidate.birthYear ? `, b. ${candidate.birthYear}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={handleInspect}
            disabled={inspecting}
          >
            {inspecting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            {clubs ? "Hide" : "Teams"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-pitch-green hover:text-pitch-green hover:bg-pitch-green/10"
            onClick={onAccept}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Accept
          </Button>
        </div>
      </div>

      {inspectError && (
        <div className="px-3 py-1.5 text-xs text-red-card bg-red-card/5 border-t border-white/5">
          {inspectError}
        </div>
      )}

      {clubs && (
        <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] space-y-0.5">
          {clubs.length === 0 ? (
            <span className="text-xs text-muted-foreground">No club data available</span>
          ) : (
            clubs.map((club) => (
              <div key={`${club.apiClubId}-${club.startYear}`} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-mono w-20 shrink-0">
                  {club.startYear}–{club.endYear}
                </span>
                <span className="text-floodlight">{club.clubName}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MappingRow({
  item,
}: {
  item: {
    playerQid: string;
    playerName: string;
    apiFootballId: number | null;
    confidence: string;
    reason: string;
    candidates: number;
  };
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-muted-foreground font-mono text-xs shrink-0">
          {item.playerQid}
        </span>
        <span className="text-floodlight truncate">{item.playerName}</span>
        {item.apiFootballId && (
          <span className="text-xs text-pitch-green font-mono shrink-0">
            → {item.apiFootballId}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-muted-foreground truncate max-w-[300px]" title={item.reason}>
          {item.reason}
        </span>
        <Badge
          variant={
            item.confidence === "high"
              ? "success"
              : item.confidence === "medium"
                ? "warning"
                : "secondary"
          }
        >
          {item.confidence}
        </Badge>
      </div>
    </div>
  );
}
