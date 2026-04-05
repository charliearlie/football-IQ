"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlagIcon } from "@/components/ui/flag-icon";
import {
  Check,
  X,
  SkipForward,
  Loader2,
  AlertTriangle,
  Search,
  Keyboard,
  Trash2,
  UserX,
} from "lucide-react";
import {
  getNextPlayerToValidate,
  confirmPlayer,
  fixPlayerClub,
  markNoClub,
  deletePlayer,
  searchClubs,
  getValidationStats,
  type ValidatorPlayer,
  type ValidationStats,
  type ClubSearchResult,
} from "./actions";
import { toast } from "sonner";

export default function ValidatePage() {
  const [player, setPlayer] = useState<ValidatorPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [fixMode, setFixMode] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);

  // Fix mode state
  const [clubQuery, setClubQuery] = useState("");
  const [clubResults, setClubResults] = useState<ClubSearchResult[]>([]);
  const [selectedClub, setSelectedClub] = useState<ClubSearchResult | null>(null);
  const [leagueOverride, setLeagueOverride] = useState("");
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const loadNext = useCallback(async (skipIds?: string[]) => {
    setLoading(true);
    setFixMode(false);
    setSelectedClub(null);
    setClubQuery("");
    setClubResults([]);
    setLeagueOverride("");

    const result = await getNextPlayerToValidate(skipIds ?? []);
    if (result.success && result.data) {
      setPlayer(result.data);
    } else {
      setPlayer(null);
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    const result = await getValidationStats();
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  useEffect(() => {
    loadNext();
    loadStats();
  }, [loadNext, loadStats]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (fixMode || acting || loading || !player) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFixMode(true);
      } else if (e.key === " ") {
        e.preventDefault();
        handleSkip();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  async function handleConfirm() {
    if (!player || acting) return;
    setActing(true);

    const result = await confirmPlayer(player.id, player.mismatch_id);
    if (result.success) {
      setSessionCount((c) => c + 1);
      toast.success(`${player.name} confirmed`);
      await loadNext();
      loadStats();
    } else {
      toast.error(result.error ?? "Failed to confirm");
    }
    setActing(false);
  }

  async function handleSkip() {
    if (!player) return;
    const newSkipped = [...skippedIds, player.id];
    setSkippedIds(newSkipped);
    await loadNext(newSkipped);
  }

  async function handleFix() {
    if (!player || !selectedClub || acting) return;
    setActing(true);

    const league = leagueOverride || selectedClub.league;
    const result = await fixPlayerClub(
      player.id,
      selectedClub.id,
      selectedClub.name,
      league,
      player.mismatch_id,
    );

    if (result.success) {
      setSessionCount((c) => c + 1);
      toast.success(`${player.name} fixed → ${selectedClub.name}`);
      await loadNext();
      loadStats();
    } else {
      toast.error(result.error ?? "Failed to fix");
    }
    setActing(false);
  }

  async function handleNoClub() {
    if (!player || acting) return;
    setActing(true);

    const result = await markNoClub(player.id, player.mismatch_id);
    if (result.success) {
      setSessionCount((c) => c + 1);
      toast.success(`${player.name} marked as no club`);
      await loadNext();
      loadStats();
    } else {
      toast.error(result.error ?? "Failed");
    }
    setActing(false);
  }

  async function handleDelete() {
    if (!player || acting) return;
    if (!confirm(`Delete ${player.name} permanently? This cannot be undone.`)) return;
    setActing(true);

    const result = await deletePlayer(player.id);
    if (result.success) {
      setSessionCount((c) => c + 1);
      toast.success(`${player.name} deleted`);
      await loadNext();
      loadStats();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
    setActing(false);
  }

  // Club search with debounce
  useEffect(() => {
    if (clubQuery.length < 2) {
      setClubResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchClubs(clubQuery);
      setClubResults(results);
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [clubQuery]);

  if (loading && !player) {
    return (
      <AdminPageShell title="Validate Players" subtitle="Tinder-style club verification">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminPageShell>
    );
  }

  if (!player) {
    return (
      <AdminPageShell title="Validate Players" subtitle="Tinder-style club verification">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Check className="h-12 w-12 text-pitch-green mb-4" />
          <h2 className="text-xl font-semibold text-floodlight">All caught up!</h2>
          <p className="text-muted-foreground mt-2">
            No more players need validation right now.
            {sessionCount > 0 && ` You validated ${sessionCount} players this session.`}
          </p>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Validate Players" subtitle="Tinder-style club verification">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground">
          <Badge variant="secondary" className="font-mono">
            {stats.verified} / {stats.total} verified
          </Badge>
          {stats.mismatches > 0 && (
            <Badge variant="destructive" className="font-mono">
              {stats.mismatches} mismatches
            </Badge>
          )}
          {stats.expired > 0 && (
            <Badge variant="outline" className="font-mono">
              {stats.expired} expired
            </Badge>
          )}
          <span className="ml-auto">Session: {sessionCount}</span>
        </div>
      )}

      {/* Player card */}
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 space-y-6">
          {/* Mismatch warning */}
          {player.mismatch_api_club && (
            <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-400">API-Football mismatch</p>
                <p className="text-muted-foreground mt-0.5">
                  API says: <strong>{player.mismatch_api_club}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Player header */}
          <div className="flex items-center gap-4">
            {player.nationality_code && (
              <FlagIcon code={player.nationality_code} className="h-10 w-10 rounded" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-floodlight">{player.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span>{player.position_category ?? "Unknown"}</span>
                <span>·</span>
                <span>Born {player.birth_year ?? "?"}</span>
                <span>·</span>
                <span>Rank {player.scout_rank}</span>
              </div>
            </div>
          </div>

          {/* Club info */}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Current Club
            </div>
            {player.club_name ? (
              <>
                <div className="text-xl font-semibold text-floodlight">
                  {player.club_name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {player.league ?? "Unknown league"}
                  {player.start_year && ` · Since ${player.start_year}`}
                </div>
              </>
            ) : (
              <div className="text-lg text-muted-foreground italic">
                No current club (retired?)
              </div>
            )}
          </div>

          {/* Wikipedia extract */}
          {player.wiki_extract && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">
                Wikipedia
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {player.wiki_extract.length > 300
                  ? player.wiki_extract.slice(0, 300) + "..."
                  : player.wiki_extract}
              </p>
            </div>
          )}

          {/* Verified status */}
          {player.verified_at && (
            <div className="text-xs text-muted-foreground">
              Last verified: {new Date(player.verified_at).toLocaleDateString()}
            </div>
          )}

          {/* Fix mode */}
          {fixMode ? (
            <div className="space-y-4 border-t border-white/10 pt-5">
              <div className="text-sm font-medium text-floodlight">
                Fix current club
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNoClub}
                  disabled={acting}
                  className="text-xs"
                >
                  <UserX className="mr-1 h-3 w-3" />
                  No club (retired)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={acting}
                  className="text-xs border-red-card/30 text-red-card hover:bg-red-card/10"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete player
                </Button>
              </div>

              {/* Club search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={clubQuery}
                  onChange={(e) => {
                    setClubQuery(e.target.value);
                    setSelectedClub(null);
                  }}
                  placeholder="Search clubs..."
                  className="w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-floodlight placeholder:text-muted-foreground"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Results */}
              {clubResults.length > 0 && !selectedClub && (
                <div className="max-h-48 overflow-y-auto rounded-md border border-white/10 bg-white/[0.03]">
                  {clubResults.map((club) => (
                    <button
                      key={club.id}
                      onClick={() => {
                        setSelectedClub(club);
                        setClubQuery(club.name);
                        setClubResults([]);
                        setLeagueOverride(club.league ?? "");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="text-floodlight">{club.name}</span>
                      {club.league && (
                        <span className="text-muted-foreground ml-2">
                          {club.league}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected club + league override */}
              {selectedClub && (
                <div className="space-y-3">
                  <div className="rounded-md border border-pitch-green/30 bg-pitch-green/10 px-3 py-2 text-sm text-pitch-green">
                    Selected: {selectedClub.name}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">League</label>
                    <input
                      type="text"
                      value={leagueOverride}
                      onChange={(e) => setLeagueOverride(e.target.value)}
                      placeholder="League name"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-floodlight"
                    />
                  </div>
                </div>
              )}

              {/* Fix actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFixMode(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFix}
                  disabled={!selectedClub || acting}
                  className="flex-1 bg-pitch-green text-black hover:bg-pitch-green/90"
                >
                  {acting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Save & Next"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Action buttons */
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setFixMode(true)}
                disabled={acting}
                className="flex-1 border-red-card/30 text-red-card hover:bg-red-card/10 hover:text-red-card"
              >
                <X className="mr-1.5 h-4 w-4" />
                Fix
              </Button>
              <Button
                onClick={handleSkip}
                disabled={acting}
                variant="ghost"
                className="px-4"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={acting}
                className="flex-1 bg-pitch-green text-black hover:bg-pitch-green/90"
              >
                {acting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    OK
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Keyboard hint */}
          {!fixMode && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
              <Keyboard className="h-3 w-3" />
              <span>← Fix</span>
              <span>Space Skip</span>
              <span>→ OK</span>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
