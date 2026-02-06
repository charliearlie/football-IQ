"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Building2, Loader2, Globe, AlertTriangle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FlagIcon } from "@/components/ui/flag-icon";
import { ProBadge, isElitePlayer } from "@/components/admin/pro-badge";
import { fetchPlayerCommandCenterData } from "@/app/(dashboard)/admin/actions";
import {
  extractCareerFromWikipediaArticle,
  replacePlayerCareerFromWikipedia,
  type ExtractedCareerEntry,
} from "./actions";
import { toast } from "sonner";

interface PlayerDetailPageProps {
  params: Promise<{ playerId: string }>;
}

interface ClubHistoryEntry {
  club_id: string;
  club_name: string;
  country_code: string | null;
  start_year: number | null;
  end_year: number | null;
}

interface PlayerData {
  id: string;
  name: string;
  nationality_code: string | null;
  scout_rank: number;
}

export default function PlayerDetailPage({ params }: PlayerDetailPageProps) {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [clubHistory, setClubHistory] = useState<ClubHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wikipedia extraction state
  const [wikiUrl, setWikiUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEntries, setExtractedEntries] = useState<ExtractedCareerEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load params
  useEffect(() => {
    params.then((p) => setPlayerId(p.playerId));
  }, [params]);

  // Fetch player data
  const loadPlayerData = useCallback(async () => {
    if (!playerId) return;

    setIsLoading(true);
    setError(null);

    const result = await fetchPlayerCommandCenterData(playerId);
    if (result.success && result.data) {
      setPlayer(result.data.player);
      setClubHistory(result.data.clubHistory);
    } else {
      setError(result.error ?? "Failed to load player data");
    }
    setIsLoading(false);
  }, [playerId]);

  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Extract career from Wikipedia
  const handleExtract = async () => {
    if (!wikiUrl.trim()) return;

    setIsExtracting(true);
    setExtractedEntries([]);

    try {
      // Pass player's country code to improve club matching (e.g., prefer Spanish Barcelona for Spanish players)
      const result = await extractCareerFromWikipediaArticle(wikiUrl.trim(), player?.nationality_code ?? undefined);
      if (result.success && result.data) {
        setExtractedEntries(result.data.entries);
        if (result.data.entries.length === 0) {
          toast.warning("No career entries found in article");
        } else {
          toast.success(`Extracted ${result.data.entries.length} career entries`);
        }
      } else {
        toast.error(result.error ?? "Failed to extract career");
      }
    } catch {
      toast.error("An error occurred during extraction");
    } finally {
      setIsExtracting(false);
    }
  };

  // Remove entry from preview
  const handleRemoveEntry = (index: number) => {
    setExtractedEntries((prev) => prev.filter((_, i) => i !== index));
  };

  // Save extracted career
  const handleSaveCareer = async () => {
    if (!playerId || extractedEntries.length === 0) return;

    setIsSaving(true);
    try {
      const result = await replacePlayerCareerFromWikipedia(playerId, extractedEntries);
      if (result.success && result.data) {
        toast.success(`Saved ${result.data.count} career entries`);
        setExtractedEntries([]);
        setWikiUrl("");
        // Reload player data to show updated career
        await loadPlayerData();
      } else {
        toast.error(result.error ?? "Failed to save career");
      }
    } catch {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel extraction
  const handleCancel = () => {
    setExtractedEntries([]);
    setWikiUrl("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pitch-green" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="space-y-6">
        <Breadcrumb playerName="Not Found" />
        <div className="rounded-lg border border-red-card/30 bg-red-card/10 p-6">
          <p className="text-red-card">{error ?? "Player not found"}</p>
          <Link href="/player-scout" className="text-sm text-pitch-green hover:underline mt-2 block">
            &larr; Back to Player Scout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb playerName={player.name} />

      {/* Player Header */}
      <div className="flex items-center gap-4">
        {player.nationality_code && (
          <FlagIcon code={player.nationality_code} size={32} />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-bebas)] tracking-wide text-floodlight">
              {player.name}
            </h1>
            {isElitePlayer(player.scout_rank) && <ProBadge />}
          </div>
          <p className="text-sm text-muted-foreground font-mono">{player.id}</p>
        </div>
      </div>

      {/* Current Career History */}
      <section className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-floodlight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-pitch-green" />
            Current Career ({clubHistory.length} clubs)
          </h2>
        </div>

        {clubHistory.length === 0 ? (
          <div className="rounded-lg bg-white/5 border border-white/10 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-card-yellow mx-auto mb-2" />
            <p className="text-muted-foreground">No career data found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the Wikipedia extraction below to add career data
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {clubHistory.map((club, index) => (
              <div
                key={`${club.club_id}-${index}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  {club.country_code && <FlagIcon code={club.country_code} size={16} />}
                  <span className="text-sm text-floodlight">{club.club_name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {club.start_year ?? "?"} - {club.end_year ?? "Present"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wikipedia Extraction */}
      <section className="rounded-lg border border-white/10 bg-white/5 p-4">
        <h2 className="text-lg font-semibold text-floodlight flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-pitch-green" />
          Extract from Wikipedia
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          If Wikidata is missing career data, paste a Wikipedia article URL to extract career history using AI.
        </p>

        <div className="flex gap-2 mb-4">
          <Input
            value={wikiUrl}
            onChange={(e) => setWikiUrl(e.target.value)}
            placeholder="https://en.wikipedia.org/wiki/David_Silva"
            className="bg-stadium-navy border-white/10"
            onKeyDown={(e) => e.key === "Enter" && handleExtract()}
          />
          <Button
            onClick={handleExtract}
            disabled={isExtracting || !wikiUrl.trim()}
            className="bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy font-bold"
          >
            {isExtracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Extract"
            )}
          </Button>
        </div>

        {/* Preview of extracted entries */}
        {extractedEntries.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-floodlight">
              Preview ({extractedEntries.length} entries)
            </Label>

            <div className="space-y-1 max-h-64 overflow-y-auto">
              {extractedEntries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-stadium-navy border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        entry.matchedClubId
                          ? "border-pitch-green text-pitch-green"
                          : "border-card-yellow text-card-yellow"
                      }
                    >
                      {entry.matchedClubId ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                      )}
                      {entry.matchedClubId ? "Matched" : "New"}
                    </Badge>
                    <span className="text-sm text-floodlight">{entry.clubName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {entry.startYear ?? "?"} - {entry.endYear ?? "Present"}
                    </span>
                    <button
                      onClick={() => handleRemoveEntry(index)}
                      className="text-muted-foreground hover:text-red-card transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveCareer}
                disabled={isSaving || extractedEntries.length === 0}
                className="bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy font-bold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Replace Career"
                )}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Breadcrumb({ playerName }: { playerName: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/player-scout" className="hover:text-floodlight">
        Players
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-floodlight">{playerName}</span>
    </div>
  );
}
