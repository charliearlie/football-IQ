"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { validateManualGrid, suggestClubs } from "../actions";
import { COUNTRY_NAME_TO_CODE } from "../_lib/types";
import { TROPHY_TO_STATS_KEY, GRID_STAT_POOL } from "../_lib/achievementMapping";
import type { GridCategory, GeneratedGrid, CellSolvability } from "../_lib/types";

type CategoryType = GridCategory["type"];

interface CategoryInput {
  type: CategoryType;
  value: string;
}

const EMPTY_CAT: CategoryInput = { type: "club", value: "" };

const NATION_NAMES = Object.keys(COUNTRY_NAME_TO_CODE);
const TROPHY_NAMES = Object.keys(TROPHY_TO_STATS_KEY);

interface ManualGridBuilderProps {
  onGridValidated: (grid: GeneratedGrid, solvability: CellSolvability[]) => void;
}

function CategoryField({
  label,
  cat,
  onChange,
}: {
  label: string;
  cat: CategoryInput;
  onChange: (cat: CategoryInput) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTypeChange = (type: CategoryType) => {
    onChange({ type, value: "" });
    setSuggestions([]);
  };

  const handleValueChange = (value: string) => {
    onChange({ ...cat, value });

    if (cat.type === "club" && value.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const res = await suggestClubs(value);
        if (res.success && res.data) {
          setSuggestions(res.data);
          setShowSuggestions(true);
        }
      }, 300);
    } else if (cat.type === "nation") {
      const filtered = NATION_NAMES.filter((n) =>
        n.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
    } else if (cat.type === "trophy") {
      const filtered = TROPHY_NAMES.filter((n) =>
        n.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
    } else if (cat.type === "stat") {
      const filtered = GRID_STAT_POOL.filter((n) =>
        n.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (val: string) => {
    onChange({ ...cat, value: val });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const typeColors: Record<string, string> = {
    club: "border-blue-500/50 text-blue-300",
    nation: "border-green-500/50 text-green-300",
    trophy: "border-yellow-500/50 text-yellow-300",
    stat: "border-purple-500/50 text-purple-300",
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      <span className="text-[10px] uppercase text-slate-500 font-mono">
        {label}
      </span>
      <div className="flex gap-1.5">
        {(["club", "nation", "trophy", "stat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => handleTypeChange(t)}
            className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded transition-colors ${
              cat.type === t
                ? typeColors[t]
                : "text-slate-600 hover:text-slate-400"
            } ${cat.type === t ? "border" : "border border-transparent"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={cat.value}
          onChange={(e) => handleValueChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={
            cat.type === "club"
              ? "e.g. Chelsea F.C."
              : cat.type === "nation"
                ? "e.g. France"
                : cat.type === "trophy"
                  ? "e.g. Champions League"
                  : "e.g. 3+ Ballon d'Ors"
          }
          className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ManualGridBuilder({ onGridValidated }: ManualGridBuilderProps) {
  const [xAxis, setXAxis] = useState<[CategoryInput, CategoryInput, CategoryInput]>([
    { ...EMPTY_CAT },
    { ...EMPTY_CAT },
    { ...EMPTY_CAT },
  ]);
  const [yAxis, setYAxis] = useState<[CategoryInput, CategoryInput, CategoryInput]>([
    { ...EMPTY_CAT },
    { ...EMPTY_CAT },
    { ...EMPTY_CAT },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateX = (i: number, cat: CategoryInput) => {
    const next = [...xAxis] as [CategoryInput, CategoryInput, CategoryInput];
    next[i] = cat;
    setXAxis(next);
  };

  const updateY = (i: number, cat: CategoryInput) => {
    const next = [...yAxis] as [CategoryInput, CategoryInput, CategoryInput];
    next[i] = cat;
    setYAxis(next);
  };

  const allFilled = [...xAxis, ...yAxis].every((c) => c.value.trim().length > 0);

  const handleValidate = () => {
    setError(null);
    const xCats = xAxis.map((c) => ({ type: c.type, value: c.value.trim() })) as [
      GridCategory,
      GridCategory,
      GridCategory,
    ];
    const yCats = yAxis.map((c) => ({ type: c.type, value: c.value.trim() })) as [
      GridCategory,
      GridCategory,
      GridCategory,
    ];

    startTransition(async () => {
      const res = await validateManualGrid(xCats, yCats);
      if (res.success && res.data) {
        onGridValidated(res.data.grid, res.data.solvability);
      } else {
        setError(res.error ?? "Validation failed");
      }
    });
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300">
          Manual Grid Builder
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Define 3 column and 3 row categories, then validate all 9 cells have answers.
        </p>
      </div>

      {/* X-axis (columns) */}
      <div>
        <span className="text-xs font-medium text-slate-400 mb-2 block">
          Columns (x-axis)
        </span>
        <div className="grid grid-cols-3 gap-3">
          {xAxis.map((cat, i) => (
            <CategoryField
              key={`x-${i}`}
              label={`Col ${i + 1}`}
              cat={cat}
              onChange={(c) => updateX(i, c)}
            />
          ))}
        </div>
      </div>

      {/* Y-axis (rows) */}
      <div>
        <span className="text-xs font-medium text-slate-400 mb-2 block">
          Rows (y-axis)
        </span>
        <div className="grid grid-cols-3 gap-3">
          {yAxis.map((cat, i) => (
            <CategoryField
              key={`y-${i}`}
              label={`Row ${i + 1}`}
              cat={cat}
              onChange={(c) => updateY(i, c)}
            />
          ))}
        </div>
      </div>

      {/* Validate button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleValidate}
          disabled={!allFilled || isPending}
          className="px-5 py-2 bg-[#58CC02] hover:bg-[#46A302] text-[#0F172A] font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Validating..." : "Validate Grid"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}
