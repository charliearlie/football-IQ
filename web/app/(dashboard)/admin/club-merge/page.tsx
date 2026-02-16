"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  getDuplicateGroups,
  mergeClubGroup,
  bulkMergeGroups,
  searchClubs,
  getDataQualityStats,
} from "./actions";

// ---------------------------------------------------------------------------
// Types (matching action signatures)
// ---------------------------------------------------------------------------

interface ClubInfo {
  id: string;
  name: string;
  playerCount: number;
  apiFootballId: number | null;
  canonicalClubId: string | null;
}

interface DuplicateGroup {
  normalizedName: string;
  countryCode: string | null;
  clubs: ClubInfo[];
}

interface DuplicateGroupsResult {
  groups: DuplicateGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface MergeResult {
  mergedCount: number;
  appearancesReassigned: number;
}

interface BulkMergeResult {
  totalGroupsMerged: number;
  totalClubsMerged: number;
  totalAppearancesReassigned: number;
  errors: string[];
}

interface DataQualityStats {
  totalClubs: number;
  totalPlayers: number;
  totalAppearances: number;
  clubsByPlayerCount: {
    zero: number;
    one: number;
    twoToFive: number;
    sixToTwenty: number;
    twentyOneToFifty: number;
    fiftyPlus: number;
  };
  playersMissingNationality: number;
  playersMissingPosition: number;
  playersMissingBirthYear: number;
  clubsWithCanonical: number;
  clubsWithoutCanonical: number;
  remainingDuplicateGroups: number;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClubMergePage() {
  return (
    <AdminPageShell
      title="Club Merge"
      subtitle="Deduplicate clubs and manage canonical club records"
    >
      <Tabs defaultValue="duplicates" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="duplicates">Duplicate Groups</TabsTrigger>
          <TabsTrigger value="manual">Manual Merge</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="duplicates">
          <DuplicateGroupsTab />
        </TabsContent>

        <TabsContent value="manual">
          <ManualMergeTab />
        </TabsContent>

        <TabsContent value="quality">
          <DataQualityTab />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Duplicate Groups
// ---------------------------------------------------------------------------

function DuplicateGroupsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DuplicateGroupsResult | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [bulkMerging, setBulkMerging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchGroups = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDuplicateGroups(p, pageSize);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error ?? "Failed to load duplicate groups");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups(page);
  }, [page, fetchGroups]);

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function groupKey(g: DuplicateGroup) {
    return `${g.normalizedName}::${g.countryCode ?? ""}`;
  }

  async function handleMerge(group: DuplicateGroup, canonicalId: string, displayName?: string) {
    setMerging(true);
    setMessage(null);
    const duplicateIds = group.clubs.filter((c) => c.id !== canonicalId).map((c) => c.id);
    try {
      const res = await mergeClubGroup(canonicalId, duplicateIds, displayName);
      if (res.success && res.data) {
        setMessage({
          type: "success",
          text: `Merged ${res.data.mergedCount} clubs, reassigned ${res.data.appearancesReassigned} appearances`,
        });
        setExpandedGroup(null);
        fetchGroups(page);
      } else {
        setMessage({ type: "error", text: res.error ?? "Merge failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unexpected error" });
    } finally {
      setMerging(false);
    }
  }

  async function handleBulkMerge() {
    if (!data || selected.size === 0) return;
    setBulkMerging(true);
    setMessage(null);

    const groups = data.groups.filter((g) => selected.has(groupKey(g)));
    const payload = groups.map((g) => {
      const sorted = [...g.clubs].sort((a, b) => b.playerCount - a.playerCount);
      const canonical = sorted[0];
      return {
        canonicalId: canonical.id,
        duplicateIds: sorted.slice(1).map((c) => c.id),
        displayName: stripSuffix(canonical.name),
      };
    });

    try {
      const res = await bulkMergeGroups(payload);
      if (res.success && res.data) {
        const d = res.data;
        setMessage({
          type: d.errors.length > 0 ? "error" : "success",
          text: `Merged ${d.totalGroupsMerged} groups (${d.totalClubsMerged} clubs, ${d.totalAppearancesReassigned} appearances)${d.errors.length > 0 ? `. Errors: ${d.errors.join(", ")}` : ""}`,
        });
        setSelected(new Set());
        fetchGroups(page);
      } else {
        setMessage({ type: "error", text: res.error ?? "Bulk merge failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unexpected error" });
    } finally {
      setBulkMerging(false);
    }
  }

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-pitch-green/30 bg-pitch-green/10 text-pitch-green"
              : "border-red-card/30 bg-red-card/10 text-red-card"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={handleBulkMerge} disabled={bulkMerging}>
            {bulkMerging ? (
              <>
                <Loader2 className="animate-spin" />
                Merging...
              </>
            ) : (
              `Merge Selected (${selected.size})`
            )}
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-floodlight"
          >
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
          {error}
        </div>
      ) : data && data.groups.length > 0 ? (
        <>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="w-10" />
                  <TableHead>Normalized Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Clubs</TableHead>
                  <TableHead className="text-right">Total Players</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.groups.map((group) => {
                  const key = groupKey(group);
                  const isExpanded = expandedGroup === key;
                  return (
                    <DuplicateGroupRow
                      key={key}
                      group={group}
                      groupKey={key}
                      isSelected={selected.has(key)}
                      isExpanded={isExpanded}
                      onToggleSelect={() => toggleSelect(key)}
                      onToggleExpand={() => setExpandedGroup(isExpanded ? null : key)}
                      onMerge={handleMerge}
                      merging={merging}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.totalCount} duplicate {data.totalCount === 1 ? "group" : "groups"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center text-muted-foreground">
          No duplicate groups found.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Duplicate Group Row
// ---------------------------------------------------------------------------

function DuplicateGroupRow({
  group,
  groupKey: key,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onMerge,
  merging,
}: {
  group: DuplicateGroup;
  groupKey: string;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onMerge: (group: DuplicateGroup, canonicalId: string, displayName?: string) => void;
  merging: boolean;
}) {
  const sorted = [...group.clubs].sort((a, b) => b.playerCount - a.playerCount);
  const [canonicalId, setCanonicalId] = useState(sorted[0]?.id ?? "");
  const [displayName, setDisplayName] = useState(() =>
    stripSuffix(sorted[0]?.name ?? group.normalizedName)
  );

  return (
    <>
      <TableRow className="border-white/10">
        <TableCell>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded border-white/20"
          />
        </TableCell>
        <TableCell className="font-medium text-floodlight">{group.normalizedName}</TableCell>
        <TableCell className="text-muted-foreground">{group.countryCode ?? "-"}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {group.clubs.map((c) => `${c.name} (${c.playerCount})`).join(", ")}
        </TableCell>
        <TableCell className="text-right text-floodlight">{group.clubs.reduce((sum, c) => sum + c.playerCount, 0)}</TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            Review
            <ChevronDown
              className={`h-3 w-3 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="border-white/10 bg-white/[0.02]">
          <TableCell colSpan={6}>
            <div className="space-y-3 py-2 px-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Select canonical club (receives all appearances)
                </p>
                {sorted.map((club) => (
                  <label
                    key={club.id}
                    className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`canonical-${key}`}
                      value={club.id}
                      checked={canonicalId === club.id}
                      onChange={() => {
                        setCanonicalId(club.id);
                        setDisplayName(stripSuffix(club.name));
                      }}
                      className="border-white/20"
                    />
                    <span className="text-sm text-floodlight">{club.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {club.playerCount} players
                    </span>
                    {club.apiFootballId && (
                      <Badge variant="secondary" className="text-[10px]">
                        API: {club.apiFootballId}
                      </Badge>
                    )}
                    {club.canonicalClubId && (
                      <Badge variant="secondary" className="text-[10px]">
                        canonical
                      </Badge>
                    )}
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
                />
              </div>

              <Button
                onClick={() => onMerge(group, canonicalId, displayName)}
                disabled={merging}
              >
                {merging ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Merging...
                  </>
                ) : (
                  "Merge Group"
                )}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Manual Merge
// ---------------------------------------------------------------------------

function ManualMergeTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClubInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ClubInfo[]>([]);
  const [canonicalId, setCanonicalId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [merging, setMerging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchClubs(value);
        if (res.success && res.data) {
          setResults(res.data);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function toggleClub(club: ClubInfo) {
    setSelected((prev) => {
      const exists = prev.find((c) => c.id === club.id);
      if (exists) {
        const next = prev.filter((c) => c.id !== club.id);
        if (canonicalId === club.id) {
          setCanonicalId(next[0]?.id ?? null);
          setDisplayName(next[0] ? stripSuffix(next[0].name) : "");
        }
        return next;
      }
      const next = [...prev, club];
      if (!canonicalId) {
        setCanonicalId(club.id);
        setDisplayName(stripSuffix(club.name));
      }
      return next;
    });
  }

  async function handleMerge() {
    if (!canonicalId || selected.length < 2) return;
    setMerging(true);
    setMessage(null);
    const duplicateIds = selected.filter((c) => c.id !== canonicalId).map((c) => c.id);
    try {
      const res = await mergeClubGroup(canonicalId, duplicateIds, displayName);
      if (res.success && res.data) {
        setMessage({
          type: "success",
          text: `Merged ${res.data.mergedCount} clubs, reassigned ${res.data.appearancesReassigned} appearances`,
        });
        setSelected([]);
        setCanonicalId(null);
        setDisplayName("");
        setResults([]);
        setQuery("");
      } else {
        setMessage({ type: "error", text: res.error ?? "Merge failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Unexpected error" });
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-pitch-green/30 bg-pitch-green/10 text-pitch-green"
              : "border-red-card/30 bg-red-card/10 text-red-card"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clubs by name..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {results.length > 0 && (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="w-10" />
                  <TableHead>Club Name</TableHead>
                  <TableHead className="text-right">Players</TableHead>
                  <TableHead>API ID</TableHead>
                  <TableHead>Canonical</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((club) => {
                  const isSelected = selected.some((c) => c.id === club.id);
                  return (
                    <TableRow
                      key={club.id}
                      className={`border-white/10 cursor-pointer ${isSelected ? "bg-pitch-green/5" : ""}`}
                      onClick={() => toggleClub(club)}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClub(club)}
                          className="rounded border-white/20"
                        />
                      </TableCell>
                      <TableCell className="text-floodlight">{club.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {club.playerCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {club.apiFootballId ?? "-"}
                      </TableCell>
                      <TableCell>
                        {club.canonicalClubId ? (
                          <Badge variant="secondary" className="text-[10px]">
                            canonical
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {selected.length >= 2 && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
          <h3 className="text-sm font-medium text-floodlight">
            Merge {selected.length} clubs
          </h3>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Select canonical club
            </p>
            {selected.map((club) => (
              <label
                key={club.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="radio"
                  name="manual-canonical"
                  value={club.id}
                  checked={canonicalId === club.id}
                  onChange={() => {
                    setCanonicalId(club.id);
                    setDisplayName(stripSuffix(club.name));
                  }}
                  className="border-white/20"
                />
                <span className="text-sm text-floodlight">{club.name}</span>
                <span className="text-xs text-muted-foreground">
                  {club.playerCount} players
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
            />
          </div>

          <Button onClick={handleMerge} disabled={merging}>
            {merging ? (
              <>
                <Loader2 className="animate-spin" />
                Merging...
              </>
            ) : (
              "Merge Clubs"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Data Quality
// ---------------------------------------------------------------------------

function DataQualityTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DataQualityStats | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getDataQualityStats();
        if (res.success && res.data) {
          setStats(res.data);
        } else {
          setError(res.error ?? "Failed to load stats");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Clubs" value={stats.totalClubs.toLocaleString()} />
        <StatCard label="Total Players" value={stats.totalPlayers.toLocaleString()} />
        <StatCard label="Total Appearances" value={stats.totalAppearances.toLocaleString()} />
        <StatCard
          label="Remaining Duplicates"
          value={stats.remainingDuplicateGroups}
          variant={stats.remainingDuplicateGroups > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Clubs with Canonical"
          value={stats.clubsWithCanonical.toLocaleString()}
          variant="success"
        />
        <StatCard
          label="Clubs without Canonical"
          value={stats.clubsWithoutCanonical.toLocaleString()}
          variant={stats.clubsWithoutCanonical > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Missing Nationality"
          value={stats.playersMissingNationality.toLocaleString()}
          variant={stats.playersMissingNationality > 0 ? "warning" : undefined}
        />
        <StatCard
          label="Missing Position"
          value={stats.playersMissingPosition.toLocaleString()}
          variant={stats.playersMissingPosition > 0 ? "warning" : undefined}
        />
        <StatCard
          label="Missing Birth Year"
          value={stats.playersMissingBirthYear.toLocaleString()}
          variant={stats.playersMissingBirthYear > 0 ? "warning" : undefined}
        />
      </div>

      {(() => {
        const dist = stats.clubsByPlayerCount;
        const buckets = [
          { label: "0 players", count: dist.zero },
          { label: "1 player", count: dist.one },
          { label: "2-5 players", count: dist.twoToFive },
          { label: "6-20 players", count: dist.sixToTwenty },
          { label: "21-50 players", count: dist.twentyOneToFifty },
          { label: "50+ players", count: dist.fiftyPlus },
        ];
        const maxCount = Math.max(...buckets.map((b) => b.count));
        return (
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-3">
            <h3 className="text-sm font-medium text-floodlight">Club Size Distribution</h3>
            <div className="space-y-2">
              {buckets.map((bucket) => {
                const pct = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                return (
                  <div key={bucket.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 text-right">
                      {bucket.label}
                    </span>
                    <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-pitch-green/40 rounded"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-floodlight w-16 text-right">
                      {bucket.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

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

function stripSuffix(name: string): string {
  return name
    .replace(/\bF\.C\.?\b/gi, "")
    .replace(/\bFC\b/gi, "")
    .replace(/\bA\.F\.C\.?\b/gi, "")
    .replace(/\bAFC\b/gi, "")
    .replace(/\bS\.C\.?\b/gi, "")
    .replace(/\bSC\b/gi, "")
    .replace(/\bCF\b/gi, "")
    .replace(/\bC\.F\.?\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}
