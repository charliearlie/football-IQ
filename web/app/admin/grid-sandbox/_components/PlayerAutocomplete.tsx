"use client";

import { useState, useCallback, useRef } from "react";
import { searchPlayers } from "../actions";
import { getFlagEmoji } from "../_lib/types";
import type { AutocompletePlayer } from "../_lib/types";

interface PlayerAutocompleteProps {
  onSelect: (player: AutocompletePlayer) => void;
}

export function PlayerAutocomplete({ onSelect }: PlayerAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompletePlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        const res = await searchPlayers(value);
        if (res.success && res.data) {
          setResults(res.data);
          setShowDropdown(res.data.length > 0);
        }
        setIsSearching(false);
      }, 300);
    },
    []
  );

  const handleSelect = (player: AutocompletePlayer) => {
    setQuery(player.name);
    setShowDropdown(false);
    onSelect(player);
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        Player Tester
      </h3>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search player (zero-spoiler)..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#58CC02] focus:ring-1 focus:ring-[#58CC02]/30"
        />
        {isSearching && (
          <div className="absolute right-3 top-2.5 text-xs text-slate-500">
            ...
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-xl max-h-60 overflow-y-auto">
            {results.map((player) => (
              <button
                key={player.qid}
                onClick={() => handleSelect(player)}
                className="w-full px-3 py-2 text-left hover:bg-slate-700 flex items-center gap-3 text-sm border-b border-slate-700/50 last:border-0"
              >
                <span className="text-base">
                  {getFlagEmoji(player.nationalityCode)}
                </span>
                <span className="flex-1 font-medium">{player.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {player.positionCategory ?? "—"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {player.birthYear ?? "—"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-600 mt-1.5">
        Zero-spoiler: flag + position + birth year only. No club history shown.
      </p>
    </div>
  );
}
