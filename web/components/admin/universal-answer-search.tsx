"use client";

import { useState, useCallback, useRef } from "react";
import { Search, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FlagIcon } from "@/components/ui/flag-icon";
import { usePlayerRapSheet } from "@/hooks/use-player-rap-sheet";
import { searchPlayersForForm } from "@/app/(dashboard)/calendar/actions";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES } from "@/lib/constants";
import type { GameMode } from "@/lib/constants";
import { format, parseISO } from "date-fns";

interface SearchResult {
  id: string;
  name: string;
  birth_year: number | null;
  scout_rank: number;
}

export function UniversalAnswerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedQid, setSelectedQid] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { player, appearances, modesSummary, isLoading: rapSheetLoading } =
    usePlayerRapSheet(selectedQid);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const result = await searchPlayersForForm(value);
        if (result.success && result.data) {
          setResults(result.data);
          setShowDropdown(true);
        }
      }, 300);
    },
    []
  );

  const handleSelectPlayer = (player: SearchResult) => {
    setSelectedQid(player.id);
    setQuery(player.name);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedQid(null);
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a player..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 bg-white/5 border-white/10"
          />
          {(query || selectedQid) && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-floodlight"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-stadium-navy shadow-lg overflow-hidden">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectPlayer(result)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-floodlight">
                    {result.name}
                  </span>
                  {result.birth_year && (
                    <span className="text-xs text-muted-foreground ml-2">
                      b. {result.birth_year}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {result.id}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rap Sheet */}
      {selectedQid && player ? (
        <RapSheetCard
          player={player}
          appearances={appearances}
          modesSummary={modesSummary}
          isLoading={rapSheetLoading}
        />
      ) : (
        !selectedQid && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p>Search for a player to see their puzzle appearances</p>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================================
// RAP SHEET CARD
// ============================================================================

interface RapSheetCardProps {
  player: { id: string; name: string; nationality_code: string | null };
  appearances: Array<{
    puzzle_id: string;
    puzzle_date: string | null;
    game_mode: string;
    status: string | null;
  }>;
  modesSummary: Record<string, number>;
  isLoading: boolean;
}

function RapSheetCard({
  player,
  appearances,
  modesSummary,
  isLoading,
}: RapSheetCardProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading rap sheet...
      </div>
    );
  }

  const totalAppearances = appearances.length;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
      {/* Player Header */}
      <div className="flex items-center gap-3">
        {player.nationality_code && (
          <FlagIcon code={player.nationality_code} size={24} />
        )}
        <div>
          <h3 className="text-lg font-semibold text-floodlight">
            {player.name}
          </h3>
          <span className="text-xs text-muted-foreground">{player.id}</span>
        </div>
        <Badge
          variant="outline"
          className="ml-auto border-pitch-green/30 text-pitch-green"
        >
          {totalAppearances} appearance{totalAppearances !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Mode Breakdown */}
      <div className="space-y-2">
        {GAME_MODES.map((mode) => {
          const count = modesSummary[mode] ?? 0;
          const modeAppearances = appearances.filter(
            (a) => a.game_mode === mode
          );

          return (
            <div
              key={mode}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
            >
              <span className="text-sm text-floodlight">
                {GAME_MODE_DISPLAY_NAMES[mode as GameMode]}
              </span>
              {count > 0 ? (
                <div className="flex items-center gap-2">
                  {modeAppearances.map((app) => (
                    <Badge
                      key={app.puzzle_id}
                      variant="outline"
                      className="text-xs border-pitch-green/30 text-pitch-green"
                    >
                      {app.puzzle_date
                        ? format(parseISO(app.puzzle_date), "MMM d, yyyy")
                        : "Backlog"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Never used
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
