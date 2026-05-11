"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchedPlayer {
  id: string;
  name: string;
  birth_year: number | null;
  position_category: string | null;
  nationality_code: string | null;
}

interface PlayerSearchInputProps {
  onSelect: (player: SearchedPlayer) => void;
  /** Disables the input — e.g. when the game is over. */
  disabled?: boolean;
  /** Placeholder text in the input. */
  placeholder?: string;
}

export function PlayerSearchInput({
  onSelect,
  disabled,
  placeholder = "Search players (3+ letters)...",
}: PlayerSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when user clicks outside.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cancel any in-flight debounced fetch on unmount (prevents setState on
  // an unmounted component when the game ends mid-debounce).
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/games/whos-that/search?q=${encodeURIComponent(value.trim())}`
        );
        const json = (await res.json()) as { players?: SearchedPlayer[] };
        const players = json.players ?? [];
        setResults(players);
        setShowDropdown(players.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, []);

  const handleSelect = useCallback(
    (player: SearchedPlayer) => {
      setQuery("");
      setResults([]);
      setShowDropdown(false);
      onSelect(player);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          disabled={disabled}
          placeholder={placeholder}
          className="pl-9 bg-white/5 border-white/10 text-floodlight placeholder:text-slate-500"
          aria-label="Player name"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            …
          </span>
        )}
      </div>
      {showDropdown && (
        <ul
          className={cn(
            "absolute z-50 w-full mt-1 bg-stadium-navy border border-white/10 rounded-md shadow-xl",
            "max-h-60 overflow-y-auto"
          )}
          role="listbox"
        >
          {results.map((player) => (
            <li key={player.id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(player)}
                className="w-full px-3 py-2 text-left text-sm text-floodlight hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center justify-between"
              >
                <span className="truncate">{player.name}</span>
                {player.birth_year && (
                  <span className="text-xs text-slate-400 ml-2">
                    b. {player.birth_year}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
