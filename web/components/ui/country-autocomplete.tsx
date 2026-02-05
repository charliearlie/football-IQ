"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverAnchor } from "./popover";
import { Input } from "./input";
import { FlagIcon } from "./flag-icon";
import { cn } from "@/lib/utils";
import { searchCountries, getCountryByCode, getCountryByEmoji, type Country } from "@/lib/countries";

interface CountryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountryAutocomplete({
  value,
  onChange,
  placeholder = "Search country...",
  className,
}: CountryAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [results, setResults] = React.useState<Country[]>([]);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value (ISO code or emoji) to display name
  React.useEffect(() => {
    const country = getCountryByCode(value) ?? getCountryByEmoji(value);
    if (country) {
      setInputValue(country.name);
      // If loaded from DB as emoji, convert to ISO code for the form
      if (country.code !== value) {
        onChange(country.code);
      }
    } else {
      setInputValue(value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const filtered = searchCountries(inputValue);
    setResults(filtered.slice(0, 8));
    setHighlightedIndex(0);
  }, [inputValue]);

  const handleSelect = (country: Country) => {
    setInputValue(country.name);
    onChange(country.code);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("bg-white/5 border-white/10", className)}
          autoComplete="off"
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {results.length === 0 ? (
          <div className="px-2 py-3 text-sm text-white/50 text-center">
            No countries found
          </div>
        ) : (
          <ul className="max-h-[200px] overflow-auto">
            {results.map((country, index) => (
              <li
                key={country.code}
                onClick={() => handleSelect(country)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer",
                  index === highlightedIndex
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5"
                )}
              >
                <FlagIcon code={country.code} size={16} />
                <span>{country.name}</span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
