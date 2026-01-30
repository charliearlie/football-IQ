"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search,
  Upload,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  resolvePlayerBatch,
  resolvePlayerFuzzy,
  resolvePlayerFromWikipedia,
  fetchPlayerCareer,
  savePlayersToSupabase,
  saveCareerToSupabase,
  getPlayerCount,
  searchExistingPlayers,
  getAllPlayerQids,
  getPlayersWithoutCareers,
  type ResolvedPlayer,
} from "./actions";

const BATCH_SIZE = 50;
const DELAY_MS = 1500;

type LogEntry = {
  id: number;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
};

type PipelineStatus = "idle" | "running" | "paused" | "complete" | "error";

export default function PlayerScoutPage() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [namesInput, setNamesInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; scout_rank: number }[]
  >([]);
  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiStatus, setWikiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [wikiMessage, setWikiMessage] = useState("");
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0, resolved: 0, failed: 0 });
  const [fetchCareers, setFetchCareers] = useState(true);
  const abortRef = useRef(false);
  const logIdRef = useRef(0);

  // ─── Logging ──────────────────────────────────────────────────────────────
  const addLog = useCallback(
    (type: LogEntry["type"], message: string) => {
      const entry: LogEntry = {
        id: logIdRef.current++,
        type,
        message,
        timestamp: new Date(),
      };
      setLogs((prev) => [...prev, entry]);
    },
    []
  );

  // ─── Load Player Count ────────────────────────────────────────────────────
  const loadPlayerCount = useCallback(async () => {
    const count = await getPlayerCount();
    setPlayerCount(count);
  }, []);

  // Load count on mount
  useEffect(() => {
    loadPlayerCount();
  }, [loadPlayerCount]);

  // ─── Search Existing ──────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return;
    const results = await searchExistingPlayers(searchQuery.trim());
    setSearchResults(results);
  }, [searchQuery]);

  // ─── Wikipedia URL Resolve ────────────────────────────────────────────────
  const handleWikiResolve = useCallback(async () => {
    if (!wikiUrl.trim()) return;
    setWikiStatus("loading");
    setWikiMessage("");

    try {
      const { player, error } = await resolvePlayerFromWikipedia(wikiUrl.trim());
      if (!player) {
        setWikiStatus("error");
        setWikiMessage(error ?? "Unknown error");
        return;
      }

      // Save player to Supabase
      const saveResult = await savePlayersToSupabase([player]);
      if (!saveResult.success) {
        setWikiStatus("error");
        setWikiMessage(`Resolved ${player.name} (${player.qid}) but save failed: ${saveResult.error}`);
        return;
      }

      // Fetch and save career
      const career = await fetchPlayerCareer(player.qid);
      if (career.length > 0) {
        const careerResult = await saveCareerToSupabase(player.qid, career);
        if (!careerResult.success) {
          setWikiStatus("error");
          setWikiMessage(`Resolved ${player.name} (${player.qid}) but career save failed: ${careerResult.error}`);
          return;
        }
      }

      setWikiStatus("success");
      setWikiMessage(`${player.name} (${player.qid}) — saved with ${career.length} career entries`);
      setWikiUrl("");
      loadPlayerCount();
    } catch (err) {
      setWikiStatus("error");
      setWikiMessage(err instanceof Error ? err.message : String(err));
    }
  }, [wikiUrl, loadPlayerCount]);

  // ─── Load players.json ────────────────────────────────────────────────────
  const handleLoadFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      try {
        const data = JSON.parse(text);
        // Handle both array and object formats
        const players = Array.isArray(data) ? data : data.players ?? [];
        const names = players
          .map((p: { name?: string; player_name?: string }) => p.name ?? p.player_name ?? "")
          .filter((n: string) => n.length > 0);

        setNamesInput(names.join("\n"));
        addLog("info", `Loaded ${names.length} player names from ${file.name}`);
      } catch {
        addLog("error", `Failed to parse ${file.name}: invalid JSON`);
      }
    },
    [addLog]
  );

  // ─── Batch Pipeline ───────────────────────────────────────────────────────
  const runPipeline = useCallback(async () => {
    const names = namesInput
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      addLog("error", "No player names to process");
      return;
    }

    setStatus("running");
    abortRef.current = false;
    setLogs([]);
    setProgress({ current: 0, total: names.length, resolved: 0, failed: 0 });

    const totalBatches = Math.ceil(names.length / BATCH_SIZE);
    addLog("info", `Starting pipeline: ${names.length} players in ${totalBatches} batches`);

    let totalResolved = 0;
    let totalFailed = 0;
    const allResolved: ResolvedPlayer[] = [];
    const allFailed: string[] = [];

    for (let i = 0; i < totalBatches; i++) {
      if (abortRef.current) {
        addLog("warning", "Pipeline aborted by user");
        setStatus("paused");
        return;
      }

      const batch = names.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      addLog("info", `Batch ${i + 1}/${totalBatches}: Resolving ${batch.length} names...`);

      try {
        const { resolved, failed } = await resolvePlayerBatch(batch);
        totalResolved += resolved.length;
        totalFailed += failed.length;
        allResolved.push(...resolved);
        allFailed.push(...failed);

        setProgress({
          current: (i + 1) * BATCH_SIZE,
          total: names.length,
          resolved: totalResolved,
          failed: totalFailed,
        });

        if (resolved.length > 0) {
          addLog("success", `Resolved ${resolved.length} players (e.g., ${resolved[0].name} → ${resolved[0].qid})`);

          // Save batch to Supabase
          const saveResult = await savePlayersToSupabase(resolved);
          if (saveResult.success) {
            addLog("success", `Saved ${saveResult.count} players to Supabase`);
          } else {
            addLog("error", `Save failed: ${saveResult.error}`);
          }
        }

        if (failed.length > 0) {
          addLog("warning", `Failed to resolve: ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? ` (+${failed.length - 5} more)` : ""}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog("error", `Batch ${i + 1} error: ${msg}`);
      }

      // Rate limit delay
      if (i < totalBatches - 1) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    // Phase 1.5: Fuzzy retry for failed names via Wikidata search API
    if (allFailed.length > 0 && !abortRef.current) {
      addLog("info", `Phase 1.5: Fuzzy retry for ${allFailed.length} failed names...`);
      let fuzzyResolved = 0;

      for (let i = 0; i < allFailed.length; i++) {
        if (abortRef.current) {
          addLog("warning", "Fuzzy retry aborted");
          break;
        }

        const name = allFailed[i];
        try {
          const player = await resolvePlayerFuzzy(name);
          if (player) {
            fuzzyResolved++;
            allResolved.push(player);
            totalResolved++;
            totalFailed--;

            const saveResult = await savePlayersToSupabase([player]);
            if (!saveResult.success) {
              addLog("error", `Fuzzy save failed for ${player.name}: ${saveResult.error}`);
            }
          }
        } catch {
          // Silently skip fuzzy errors
        }

        if ((i + 1) % 25 === 0 || i === allFailed.length - 1) {
          addLog("info", `Fuzzy progress: ${i + 1}/${allFailed.length} (${fuzzyResolved} recovered)`);
        }

        setProgress({
          current: names.length,
          total: names.length,
          resolved: totalResolved,
          failed: totalFailed,
        });

        // Rate limit - lighter since search API is separate from SPARQL
        await new Promise((r) => setTimeout(r, 500));
      }

      addLog("success", `Fuzzy retry recovered ${fuzzyResolved} additional players`);
    }

    // Phase 2: Fetch careers (if enabled)
    if (fetchCareers && allResolved.length > 0 && !abortRef.current) {
      addLog("info", `Phase 2: Fetching careers for ${allResolved.length} players...`);

      for (let i = 0; i < allResolved.length; i++) {
        if (abortRef.current) {
          addLog("warning", "Career fetch aborted");
          break;
        }

        const player = allResolved[i];
        try {
          const career = await fetchPlayerCareer(player.qid);
          if (career.length > 0) {
            const saveResult = await saveCareerToSupabase(player.qid, career);
            if (!saveResult.success) {
              addLog("error", `Career save failed for ${player.name}: ${saveResult.error}`);
            }
          }

          if ((i + 1) % 25 === 0 || i === allResolved.length - 1) {
            addLog("info", `Career progress: ${i + 1}/${allResolved.length}`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("error", `Career fetch failed for ${player.name}: ${msg}`);
        }

        // Rate limit
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    setStatus("complete");
    addLog(
      "success",
      `Pipeline complete: ${totalResolved} resolved, ${totalFailed} failed`
    );
    loadPlayerCount();
  }, [namesInput, fetchCareers, addLog, loadPlayerCount]);

  // ─── Phase 2 Only: Fetch Careers for All Existing Players ─────────────────
  const runCareersOnly = useCallback(async () => {
    setStatus("running");
    abortRef.current = false;
    setLogs([]);

    addLog("info", "Fetching all player QIDs from Supabase...");
    const players = await getAllPlayerQids();
    addLog("info", `Found ${players.length} players. Fetching careers...`);
    setProgress({ current: 0, total: players.length, resolved: 0, failed: 0 });

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < players.length; i++) {
      if (abortRef.current) {
        addLog("warning", "Career fetch aborted");
        setStatus("paused");
        return;
      }

      const player = players[i];
      try {
        const career = await fetchPlayerCareer(player.qid);
        if (career.length > 0) {
          const saveResult = await saveCareerToSupabase(player.qid, career);
          if (saveResult.success) {
            saved++;
          } else {
            failed++;
            addLog("error", `${player.name}: ${saveResult.error}`);
          }
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        addLog("error", `${player.name}: ${msg}`);
      }

      setProgress({ current: i + 1, total: players.length, resolved: saved, failed });

      if ((i + 1) % 50 === 0 || i === players.length - 1) {
        addLog("info", `Career progress: ${i + 1}/${players.length} (${saved} saved, ${failed} failed)`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    setStatus("complete");
    addLog("success", `Careers complete: ${saved} saved, ${failed} failed`);
    loadPlayerCount();
  }, [addLog, loadPlayerCount]);

  // ─── Fetch Missing Careers Only ──────────────────────────────────────────
  const runMissingCareers = useCallback(async () => {
    setStatus("running");
    abortRef.current = false;
    setLogs([]);

    addLog("info", "Finding players without career data...");
    const players = await getPlayersWithoutCareers();
    addLog("info", `Found ${players.length} players missing careers. Fetching...`);
    setProgress({ current: 0, total: players.length, resolved: 0, failed: 0 });

    let saved = 0;
    let failed = 0;

    for (let i = 0; i < players.length; i++) {
      if (abortRef.current) {
        addLog("warning", "Career fetch aborted");
        setStatus("paused");
        return;
      }

      const player = players[i];
      try {
        const career = await fetchPlayerCareer(player.qid);
        if (career.length > 0) {
          const saveResult = await saveCareerToSupabase(player.qid, career);
          if (saveResult.success) {
            saved++;
          } else {
            failed++;
            addLog("error", `${player.name}: ${saveResult.error}`);
          }
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        addLog("error", `${player.name}: ${msg}`);
      }

      setProgress({ current: i + 1, total: players.length, resolved: saved, failed });

      if ((i + 1) % 50 === 0 || i === players.length - 1) {
        addLog("info", `Career progress: ${i + 1}/${players.length} (${saved} saved, ${failed} failed)`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    setStatus("complete");
    addLog("success", `Missing careers complete: ${saved} saved, ${failed} failed`);
    loadPlayerCount();
  }, [addLog, loadPlayerCount]);

  const handleAbort = useCallback(() => {
    abortRef.current = true;
    addLog("warning", "Abort requested...");
  }, [addLog]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-floodlight">Player Scout</h1>
          <p className="text-sm text-muted-foreground">
            Resolve players via Wikidata SPARQL and populate the player graph
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Users className="h-4 w-4 text-pitch-green" />
            <span className="text-sm font-medium text-floodlight">
              {playerCount !== null ? playerCount.toLocaleString() : "..."} players
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="flex flex-col gap-4">
          {/* Search Existing */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <Label className="text-sm font-medium text-floodlight mb-2 block">
              Search Existing Players
            </Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="bg-stadium-navy border-white/10"
              />
              <Button variant="outline" size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm px-2 py-1 rounded bg-white/5"
                  >
                    <span className="text-floodlight">{p.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {p.id} (rank: {p.scout_rank})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wikipedia URL Resolve */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <Label className="text-sm font-medium text-floodlight mb-2 block">
              Add Player by Wikipedia URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={wikiUrl}
                onChange={(e) => {
                  setWikiUrl(e.target.value);
                  setWikiStatus("idle");
                }}
                placeholder="https://en.wikipedia.org/wiki/Ederson_(footballer,_born_1993)"
                onKeyDown={(e) => e.key === "Enter" && handleWikiResolve()}
                className="bg-stadium-navy border-white/10"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleWikiResolve}
                disabled={wikiStatus === "loading" || !wikiUrl.trim()}
              >
                {wikiStatus === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </Button>
            </div>
            {wikiMessage && (
              <p
                className={`mt-2 text-xs ${
                  wikiStatus === "success" ? "text-pitch-green" : "text-red-card"
                }`}
              >
                {wikiStatus === "success" ? "✓ " : "✗ "}
                {wikiMessage}
              </p>
            )}
          </div>

          {/* Batch Input */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-floodlight">
                Player Names (one per line)
              </Label>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleLoadFile}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-3 w-3 mr-1" />
                      Load JSON
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            <Textarea
              value={namesInput}
              onChange={(e) => setNamesInput(e.target.value)}
              placeholder={"Cristiano Ronaldo\nLionel Messi\nThierry Henry\n..."}
              className="min-h-[300px] font-mono text-sm bg-stadium-navy border-white/10"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fetch-careers"
                  checked={fetchCareers}
                  onChange={(e) => setFetchCareers(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="fetch-careers" className="text-sm text-muted-foreground">
                  Also fetch career clubs (Phase 2)
                </Label>
              </div>
              <span className="text-xs text-muted-foreground">
                {namesInput.split("\n").filter((n) => n.trim()).length} names
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={runPipeline}
              disabled={status === "running" || !namesInput.trim()}
              className="flex-1 bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy font-bold"
            >
              {status === "running" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Pipeline
                </>
              )}
            </Button>
            <Button
              onClick={runMissingCareers}
              disabled={status === "running"}
              variant="outline"
              className="border-pitch-green/30 text-pitch-green hover:bg-pitch-green/10"
            >
              <Globe className="h-4 w-4 mr-2" />
              Fetch Missing Careers
            </Button>
            <Button
              onClick={runCareersOnly}
              disabled={status === "running"}
              variant="outline"
              className="border-pitch-green/30 text-pitch-green hover:bg-pitch-green/10"
            >
              <Globe className="h-4 w-4 mr-2" />
              Refresh All Careers
            </Button>
            {status === "running" && (
              <Button variant="destructive" onClick={handleAbort}>
                Abort
              </Button>
            )}
          </div>
        </div>

        {/* Right: Progress + Log */}
        <div className="flex flex-col gap-4">
          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-floodlight">
                  Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pitch-green rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-pitch-green flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {progress.resolved} resolved
                </span>
                <span className="text-red-card flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {progress.failed} failed
                </span>
                <span className="text-muted-foreground">
                  {Math.min(progress.current, progress.total)}/{progress.total}{" "}
                  processed
                </span>
              </div>
            </div>
          )}

          {/* Log Output */}
          <div className="rounded-lg border border-white/10 bg-stadium-navy flex-1 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-sm font-medium text-floodlight">Log</span>
              <span className="text-xs text-muted-foreground">
                {logs.length} entries
              </span>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1 font-mono text-xs">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground italic">
                    Pipeline log will appear here...
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                      <span className="text-muted-foreground shrink-0">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          log.type === "success"
                            ? "text-pitch-green"
                            : log.type === "error"
                              ? "text-red-card"
                              : log.type === "warning"
                                ? "text-card-yellow"
                                : "text-muted-foreground"
                        }
                      >
                        {log.type === "success" && "✓ "}
                        {log.type === "error" && "✗ "}
                        {log.type === "warning" && "⚠ "}
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
