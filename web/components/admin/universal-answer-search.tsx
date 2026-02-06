"use client";

import { useState, useCallback, useRef } from "react";
import { Search, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FlagIcon } from "@/components/ui/flag-icon";
import { searchPlayersForForm } from "@/app/(dashboard)/calendar/actions";
import { ProBadge, isElitePlayer } from "./pro-badge";
import { PlayerDetailSheet } from "./player-detail-sheet";

interface SearchResult {
  id: string;
  name: string;
  birth_year: number | null;
  scout_rank: number;
  nationality_code: string | null;
}

export function UniversalAnswerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedQid, setSelectedQid] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((value: string) => {
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
        // Results are already sorted by scout_rank from the server
        setResults(result.data);
        setShowDropdown(true);
      }
    }, 300);
  }, []);

  const handleSelectPlayer = (player: SearchResult) => {
    setSelectedQid(player.id);
    setQuery(player.name);
    setShowDropdown(false);
    setIsSheetOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedQid(null);
    setResults([]);
    setShowDropdown(false);
    setIsSheetOpen(false);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
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
                {/* Nationality Flag */}
                {result.nationality_code ? (
                  <FlagIcon
                    code={result.nationality_code}
                    size={20}
                    className="flex-shrink-0"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}

                {/* Player Name and Birth Year */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-floodlight">{result.name}</span>
                  {result.birth_year && (
                    <span className="text-xs text-muted-foreground ml-2">
                      b. {result.birth_year}
                    </span>
                  )}
                </div>

                {/* Pro Badge for Elite Players */}
                {isElitePlayer(result.scout_rank) && <ProBadge />}

                {/* QID */}
                <span className="text-xs text-muted-foreground">
                  {result.id}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!selectedQid && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p>Search for a player to see their puzzle appearances</p>
        </div>
      )}

      {/* Selected Player Indicator */}
      {selectedQid && !isSheetOpen && (
        <button
          onClick={() => setIsSheetOpen(true)}
          className="w-full text-left rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
        >
          <p className="text-sm text-floodlight">
            Click to view player details for{" "}
            <span className="font-semibold">{query}</span>
          </p>
        </button>
      )}

      {/* Player Detail Sheet */}
      <PlayerDetailSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        playerQid={selectedQid}
      />
    </div>
  );
}
