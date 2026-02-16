"use client";

import { useState, useEffect, useRef } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getFlaggedPlayers,
  searchApiFootballCandidates,
  resolveFromWikipedia,
  searchWikipediaArticles,
  skipPlayer,
  searchClubsForCareer,
  savePlayerCareer,
} from "./actions";
import {
  acceptFlaggedMapping,
  inspectApiPlayer,
} from "@/app/(dashboard)/admin/actions";
import type {
  FlaggedPlayer,
  FlaggedPlayersResult,
  ClubOption,
  WikiSearchResult,
} from "./actions";
import type {
  AmbiguousCandidate,
  ApiClubSummary,
} from "@/lib/data-pipeline/map-external-ids";
import type {
  CareerEntry,
  ResolvedPlayer,
} from "@/app/(dashboard)/player-scout/actions";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Eye,
  Globe,
  ExternalLink,
  SkipForward,
  UserCheck,
  Save,
} from "lucide-react";

// ============================================================================
// Page
// ============================================================================

export default function PlayerReviewPage() {
  return (
    <AdminPageShell
      title="Player Review"
      subtitle="Review flagged players and resolve API-Football mappings"
    >
      <PlayerReviewContent />
    </AdminPageShell>
  );
}

// ============================================================================
// Main Content
// ============================================================================

function PlayerReviewContent() {
  const [filter, setFilter] = useState<"all" | "flagged" | "not_found" | "no_career">("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [data, setData] = useState<FlaggedPlayersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getFlaggedPlayers(page, pageSize, filter);
        if (!cancelled && res.success && res.data) {
          setData(res.data);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  function handleFilterChange(newFilter: "all" | "flagged" | "not_found" | "no_career") {
    setFilter(newFilter);
    setPage(1);
    setExpandedId(null);
  }

  function handleRemovePlayer(playerId: string) {
    if (!data) return;
    const status = data.players.find((p) => p.id === playerId)?.mappingStatus;
    setData({
      ...data,
      players: data.players.filter((p) => p.id !== playerId),
      totalCount: data.totalCount - 1,
      counts: {
        all: status === "flagged" || status === "not_found"
          ? data.counts.all - 1
          : data.counts.all,
        flagged: status === "flagged" ? data.counts.flagged - 1 : data.counts.flagged,
        notFound: status === "not_found" ? data.counts.notFound - 1 : data.counts.notFound,
        noCareer: status === "no_career" ? data.counts.noCareer - 1 : data.counts.noCareer,
      },
    });
    if (expandedId === playerId) {
      setExpandedId(null);
    }
  }

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  const counts = data?.counts ?? { all: 0, flagged: 0, notFound: 0, noCareer: 0 };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterButton
          label={`All (${counts.all.toLocaleString()})`}
          active={filter === "all"}
          onClick={() => handleFilterChange("all")}
        />
        <FilterButton
          label={`Flagged (${counts.flagged.toLocaleString()})`}
          active={filter === "flagged"}
          onClick={() => handleFilterChange("flagged")}
        />
        <FilterButton
          label={`Not Found (${counts.notFound.toLocaleString()})`}
          active={filter === "not_found"}
          onClick={() => handleFilterChange("not_found")}
        />
        <FilterButton
          label={`No Career (${counts.noCareer.toLocaleString()})`}
          active={filter === "no_career"}
          onClick={() => handleFilterChange("no_career")}
        />
      </div>

      {/* Player List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data && data.players.length > 0 ? (
        <>
          <div className="space-y-2">
            {data.players.map((player) => {
              const isExpanded = expandedId === player.id;
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isExpanded={isExpanded}
                  onToggleExpand={() =>
                    setExpandedId(isExpanded ? null : player.id)
                  }
                  onRemove={() => handleRemovePlayer(player.id)}
                />
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.totalCount} {data.totalCount === 1 ? "player" : "players"}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs">
                {page}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-muted-foreground">
          {filter === "no_career"
            ? "All players have career data."
            : "No flagged players found."}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filter Button
// ============================================================================

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-pitch-green/10 text-pitch-green border-pitch-green/30"
          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Player Card
// ============================================================================

function PlayerCard({
  player,
  isExpanded,
  onToggleExpand,
  onRemove,
}: {
  player: FlaggedPlayer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-floodlight truncate">
              {player.name}
            </span>
            {player.mappingStatus === "flagged" ? (
              <Badge variant="warning" className="shrink-0 text-[10px] px-1.5 py-0">Flagged</Badge>
            ) : player.mappingStatus === "no_career" ? (
              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">No Career</Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">Not Found</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {player.nationalityCode && <span>{player.nationalityCode}</span>}
            {player.birthYear && <span>b. {player.birthYear}</span>}
            {player.scoutRank != null && (
              <span>Rank {player.scoutRank}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-white/10 bg-white/[0.02]">
          <PlayerExpandedRow player={player} onRemove={onRemove} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Expanded Row
// ============================================================================

function PlayerExpandedRow({
  player,
  onRemove,
}: {
  player: FlaggedPlayer;
  onRemove: () => void;
}) {
  const [candidates, setCandidates] = useState<AmbiguousCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Inspect state: track per-candidate
  const [inspectedClubs, setInspectedClubs] = useState<
    Record<number, ApiClubSummary[] | null>
  >({});
  const [inspecting, setInspecting] = useState<Record<number, boolean>>({});

  // Wikipedia search state
  const [wikiSearchQuery, setWikiSearchQuery] = useState(player.name);
  const [wikiSearchResults, setWikiSearchResults] = useState<WikiSearchResult[]>([]);
  const [wikiSearchLoading, setWikiSearchLoading] = useState(false);
  const [wikiSearchError, setWikiSearchError] = useState<string | null>(null);

  // Wikipedia resolve state
  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiResult, setWikiResult] = useState<{
    player: ResolvedPlayer | null;
    career: CareerEntry[];
    error?: string;
  } | null>(null);

  // Skip state
  const [skipping, setSkipping] = useState(false);

  // Accepting state
  const [accepting, setAccepting] = useState<number | null>(null);

  // Career editor state
  const [editableCareer, setEditableCareer] = useState<CareerEntry[]>([]);
  const [clubQuery, setClubQuery] = useState("");
  const [clubResults, setClubResults] = useState<ClubOption[]>([]);
  const [clubSearching, setClubSearching] = useState(false);
  const [addStartYear, setAddStartYear] = useState("");
  const [addEndYear, setAddEndYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const clubDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  async function handleApiSearch() {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await searchApiFootballCandidates(player.id);
      if (res.success && res.data) {
        setCandidates(res.data.candidates);
      } else {
        setSearchError(res.error ?? "Search failed");
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Unexpected error"
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleInspect(apiFootballId: number) {
    // Toggle off if already inspected
    if (inspectedClubs[apiFootballId]) {
      setInspectedClubs((prev) => ({ ...prev, [apiFootballId]: null }));
      return;
    }

    setInspecting((prev) => ({ ...prev, [apiFootballId]: true }));
    try {
      const res = await inspectApiPlayer(apiFootballId);
      if (res.success && res.data) {
        setInspectedClubs((prev) => ({
          ...prev,
          [apiFootballId]: res.data!.clubs,
        }));
      }
    } finally {
      setInspecting((prev) => ({ ...prev, [apiFootballId]: false }));
    }
  }

  async function handleAccept(apiFootballId: number) {
    setAccepting(apiFootballId);
    try {
      const res = await acceptFlaggedMapping(player.id, apiFootballId);
      if (res.success) {
        onRemove();
      }
    } finally {
      setAccepting(null);
    }
  }

  async function handleWikiFetch() {
    if (!wikiUrl.trim()) return;
    setWikiLoading(true);
    setWikiResult(null);
    try {
      const res = await resolveFromWikipedia(wikiUrl.trim());
      if (res.success && res.data) {
        setWikiResult(res.data);
        if (res.data.career.length > 0) {
          setEditableCareer(res.data.career);
        }
      } else {
        setWikiResult({
          player: null,
          career: [],
          error: res.error ?? "Failed to resolve",
        });
      }
    } catch (err) {
      setWikiResult({
        player: null,
        career: [],
        error: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setWikiLoading(false);
    }
  }

  async function handleWikiSearch() {
    if (wikiSearchQuery.trim().length < 2) return;
    setWikiSearchLoading(true);
    setWikiSearchError(null);
    try {
      const res = await searchWikipediaArticles(wikiSearchQuery.trim());
      if (res.success && res.data) {
        setWikiSearchResults(res.data);
      } else {
        setWikiSearchError(res.error ?? "Search failed");
      }
    } catch (err) {
      setWikiSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setWikiSearchLoading(false);
    }
  }

  async function handleWikiSelect(result: WikiSearchResult) {
    setWikiSearchResults([]);
    setWikiUrl(result.pageUrl);
    setWikiLoading(true);
    setWikiResult(null);
    try {
      const res = await resolveFromWikipedia(result.pageUrl);
      if (res.success && res.data) {
        setWikiResult(res.data);
        if (res.data.career.length > 0) {
          setEditableCareer(res.data.career);
        }
      } else {
        setWikiResult({
          player: null,
          career: [],
          error: res.error ?? "Failed to resolve",
        });
      }
    } catch (err) {
      setWikiResult({
        player: null,
        career: [],
        error: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setWikiLoading(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      const res = await skipPlayer(player.id);
      if (res.success) {
        onRemove();
      }
    } finally {
      setSkipping(false);
    }
  }

  const currentYear = new Date().getFullYear();

  function formatClubYears(startYear: number, endYear: number): string {
    const end =
      endYear >= currentYear ? "Present" : String(endYear);
    return `${startYear} - ${end}`;
  }

  function handleClubSearch(value: string) {
    setClubQuery(value);
    if (clubDebounceRef.current) clearTimeout(clubDebounceRef.current);
    if (value.length < 2) {
      setClubResults([]);
      return;
    }
    clubDebounceRef.current = setTimeout(async () => {
      setClubSearching(true);
      try {
        const res = await searchClubsForCareer(value);
        if (res.success && res.data) {
          setClubResults(res.data);
        }
      } finally {
        setClubSearching(false);
      }
    }, 300);
  }

  function handleAddClub(club: ClubOption) {
    const newEntry: CareerEntry = {
      clubQid: club.id,
      clubName: club.name,
      clubCountryCode: club.countryCode,
      startYear: addStartYear ? parseInt(addStartYear) : null,
      endYear: addEndYear ? parseInt(addEndYear) : null,
    };
    setEditableCareer((prev) => [...prev, newEntry]);
    setClubQuery("");
    setClubResults([]);
    setAddStartYear("");
    setAddEndYear("");
  }

  function handleRemoveEntry(index: number) {
    setEditableCareer((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateYear(
    index: number,
    field: "startYear" | "endYear",
    value: string
  ) {
    setEditableCareer((prev) =>
      prev.map((e, i) =>
        i === index ? { ...e, [field]: value ? parseInt(value) : null } : e
      )
    );
  }

  async function handleSaveCareer() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await savePlayerCareer(
        player.id,
        editableCareer.map((e) => ({
          clubQid: e.clubQid,
          clubName: e.clubName,
          clubCountryCode: e.clubCountryCode,
          startYear: e.startYear,
          endYear: e.endYear,
        }))
      );
      if (res.success) {
        onRemove();
      } else {
        setSaveError(res.error ?? "Failed to save");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 py-3 px-2 sm:px-3">
      {/* API-Football Candidates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            API-Football Candidates
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleApiSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            {searchLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchError ? (
          <div className="rounded-md border border-red-card/30 bg-red-card/10 px-3 py-2 text-xs text-red-card">
            {searchError}
          </div>
        ) : candidates.length > 0 ? (
          <div className="space-y-1.5">
            {candidates.map((candidate) => (
              <div
                key={candidate.apiFootballId}
                className="rounded-md border border-white/10 overflow-hidden"
              >
                <div className="px-3 py-2 hover:bg-white/5">
                  <div className="flex items-start gap-3">
                    {candidate.photo ? (
                      <img
                        src={candidate.photo}
                        alt={candidate.name}
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-floodlight">
                        {candidate.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {candidate.birthYear && (
                          <span>b. {candidate.birthYear}</span>
                        )}
                        <span>{candidate.nationality}</span>
                        <span className="font-mono">
                          ID: {candidate.apiFootballId}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-[52px] sm:ml-0 sm:mt-0 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleInspect(candidate.apiFootballId)}
                      disabled={inspecting[candidate.apiFootballId]}
                    >
                      {inspecting[candidate.apiFootballId] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                      {inspectedClubs[candidate.apiFootballId]
                        ? "Hide"
                        : "Teams"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-pitch-green hover:text-pitch-green hover:bg-pitch-green/10"
                      onClick={() => handleAccept(candidate.apiFootballId)}
                      disabled={accepting === candidate.apiFootballId}
                    >
                      {accepting === candidate.apiFootballId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>

                {/* Club history for this candidate */}
                {inspectedClubs[candidate.apiFootballId] && (
                  <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] space-y-0.5">
                    {inspectedClubs[candidate.apiFootballId]!.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No club data available
                      </span>
                    ) : (
                      inspectedClubs[candidate.apiFootballId]!.map((club) => (
                        <div
                          key={`${club.apiClubId}-${club.startYear}`}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="text-muted-foreground font-mono w-24 sm:w-28 shrink-0 text-[11px]">
                            {formatClubYears(club.startYear, club.endYear)}
                          </span>
                          <span className="text-floodlight truncate">
                            {club.clubName}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Career Editor */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          Career Editor
        </p>

        {/* Wikipedia Search */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search Wikipedia..."
              value={wikiSearchQuery}
              onChange={(e) => setWikiSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleWikiSearch()}
              className="border-white/10 bg-white/5 text-floodlight placeholder:text-muted-foreground text-xs h-9"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs shrink-0"
              onClick={handleWikiSearch}
              disabled={wikiSearchLoading || wikiSearchQuery.trim().length < 2}
            >
              {wikiSearchLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Search className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">{wikiSearchLoading ? "Searching..." : "Search Wiki"}</span>
              <span className="sm:hidden">{wikiSearchLoading ? "..." : "Wiki"}</span>
            </Button>
          </div>
          {wikiLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading career...
            </div>
          )}

          {/* Search Error */}
          {wikiSearchError && (
            <p className="text-xs text-red-card">{wikiSearchError}</p>
          )}

          {/* Search Results */}
          {wikiSearchResults.length > 0 && !wikiLoading && (
            <div className="rounded border border-white/10 bg-white/5 max-h-48 overflow-y-auto">
              {wikiSearchResults.map((result) => (
                <button
                  key={result.pageUrl}
                  onClick={() => handleWikiSelect(result)}
                  className="w-full text-left px-3 py-2.5 text-xs hover:bg-white/10 active:bg-white/15 transition-colors border-b border-white/5 last:border-b-0"
                >
                  <span className="text-floodlight font-medium">
                    {result.title}
                  </span>
                  <p className="text-muted-foreground line-clamp-1 mt-0.5">
                    {result.snippet}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* URL Fallback */}
          {wikiSearchResults.length === 0 && !wikiSearchLoading && !wikiLoading && !wikiResult && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Or paste Wikipedia URL..."
                value={wikiUrl}
                onChange={(e) => setWikiUrl(e.target.value)}
                className="border-white/10 bg-white/5 text-floodlight placeholder:text-muted-foreground text-xs h-8"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={handleWikiFetch}
                disabled={wikiLoading || !wikiUrl.trim()}
              >
                <Globe className="h-3 w-3" />
                Fetch
              </Button>
            </div>
          )}
        </div>

        {/* Wiki player info */}
        {wikiResult?.error && (
          <p className="text-xs text-red-card">{wikiResult.error}</p>
        )}
        {wikiResult?.player && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <UserCheck className="h-4 w-4 text-pitch-green shrink-0" />
            <span className="text-floodlight font-medium">
              {wikiResult.player.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {wikiResult.player.qid}
            </span>
            {wikiResult.player.birthYear && (
              <span className="text-xs text-muted-foreground">
                b. {wikiResult.player.birthYear}
              </span>
            )}
            {wikiResult.player.nationalityCode && (
              <span className="text-xs text-muted-foreground">
                {wikiResult.player.nationalityCode}
              </span>
            )}
            {wikiUrl && (
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-pitch-green hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Wikipedia
              </a>
            )}
          </div>
        )}
        {wikiResult?.player && wikiResult.career.length === 0 && !wikiLoading && (
          <p className="text-xs text-amber-400">
            No career data found on Wikidata for this player. Add clubs manually below.
          </p>
        )}

        {/* Editable Career Entries */}
        {editableCareer.length > 0 && (
          <div className="space-y-1.5 rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 py-2">
            {editableCareer.map((entry, i) => (
              <div
                key={`${entry.clubQid}-${i}`}
                className="flex items-center gap-1.5 sm:gap-2 text-xs"
              >
                <span className="text-floodlight min-w-0 truncate flex-1 text-[11px] sm:text-xs">
                  {entry.clubName}
                  {entry.clubCountryCode && (
                    <span className="text-muted-foreground ml-1">
                      ({entry.clubCountryCode})
                    </span>
                  )}
                </span>
                <input
                  type="number"
                  className="w-14 sm:w-16 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-xs text-floodlight text-center"
                  placeholder="Start"
                  value={entry.startYear ?? ""}
                  onChange={(e) =>
                    handleUpdateYear(i, "startYear", e.target.value)
                  }
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  className="w-14 sm:w-16 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-xs text-floodlight text-center"
                  placeholder="End"
                  value={entry.endYear ?? ""}
                  onChange={(e) =>
                    handleUpdateYear(i, "endYear", e.target.value)
                  }
                />
                <button
                  onClick={() => handleRemoveEntry(i)}
                  className="text-muted-foreground hover:text-red-card active:text-red-card transition-colors p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Club */}
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search clubs to add..."
                value={clubQuery}
                onChange={(e) => handleClubSearch(e.target.value)}
                className="border-white/10 bg-white/5 text-floodlight placeholder:text-muted-foreground text-xs h-9"
              />
              {clubSearching && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="number"
                className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-floodlight text-center"
                placeholder="Start"
                value={addStartYear}
                onChange={(e) => setAddStartYear(e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                className="w-16 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-floodlight text-center"
                placeholder="End"
                value={addEndYear}
                onChange={(e) => setAddEndYear(e.target.value)}
              />
            </div>
          </div>
          {clubResults.length > 0 && (
            <div className="rounded border border-white/10 bg-white/5 max-h-40 overflow-y-auto">
              {clubResults.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleAddClub(club)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 active:bg-white/15 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-floodlight truncate">{club.name}</span>
                  <span className="text-muted-foreground font-mono text-[10px] shrink-0">
                    {club.countryCode ?? ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save Career */}
        {editableCareer.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-pitch-green/20 text-pitch-green hover:bg-pitch-green/30 active:bg-pitch-green/40 border border-pitch-green/30 h-9"
              onClick={handleSaveCareer}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save ({editableCareer.length}{" "}
              {editableCareer.length === 1 ? "club" : "clubs"})
            </Button>
            {saveError && (
              <span className="text-xs text-red-card">{saveError}</span>
            )}
          </div>
        )}
      </div>

      {/* Skip Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-floodlight h-9"
          onClick={handleSkip}
          disabled={skipping}
        >
          {skipping ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SkipForward className="h-3.5 w-3.5" />
          )}
          Skip
        </Button>
      </div>
    </div>
  );
}
