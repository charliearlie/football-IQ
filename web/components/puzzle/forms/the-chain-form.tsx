"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  Loader2,
  Search,
  Route,
  CheckCircle,
  XCircle,
  Sparkles,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import type { TheChainContent, ChainPlayer } from "@/lib/schemas";
import {
  searchPlayersForForm,
  checkPlayersLinked,
  getChainPathSamples,
} from "@/app/(dashboard)/calendar/actions";

interface FormValues {
  content: TheChainContent;
}

interface PlayerResult {
  id: string;
  name: string;
  birth_year: number | null;
  scout_rank: number;
  nationality_code: string | null;
}

export function TheChainForm() {
  const { control, watch, setValue, getValues } = useFormContext<FormValues>();

  const [isCalculatingPar, setIsCalculatingPar] = useState(false);
  const [parResult, setParResult] = useState<{
    found: boolean;
    optimalLength?: number;
    suggestedPar?: number;
    paths?: Array<{ qids: string[]; names: string[] }>;
    depthCounts?: Record<string, number>;
    alternativePath?: { qids: string[]; names: string[] };
    error?: string;
  } | null>(null);

  const startPlayer = watch("content.start_player");
  const endPlayer = watch("content.end_player");

  const handleCalculatePar = useCallback(async () => {
    const start = getValues("content.start_player");
    const end = getValues("content.end_player");

    if (!start.qid || !end.qid) {
      return;
    }

    setIsCalculatingPar(true);
    setParResult(null);

    try {
      // First check if players are directly linked (invalid for The Chain)
      const linkResult = await checkPlayersLinked(start.qid, end.qid);
      if (linkResult.success && linkResult.data?.isLinked) {
        const data = linkResult.data;
        setParResult({
          found: false,
          error: `Invalid pair: ${start.name} and ${end.name} played together at ${data.sharedClubName} (${data.overlapStart}-${data.overlapEnd}). The Chain requires players who never shared a club.`,
        });
        setIsCalculatingPar(false);
        return;
      }

      // Get path samples and depth counts
      const result = await getChainPathSamples(start.qid, end.qid, 5);

      if (result.success && result.data) {
        const data = result.data;
        const pathFound = data.optimalLength !== null && data.paths.length > 0;

        setParResult({
          found: pathFound,
          optimalLength: data.optimalLength ?? undefined,
          suggestedPar: data.suggestedPar ?? undefined,
          paths: data.paths,
          depthCounts: data.depthCounts,
          alternativePath: data.alternativePath,
        });

        if (pathFound && data.suggestedPar !== null) {
          setValue("content.par", data.suggestedPar, { shouldValidate: true });

          // Store the first solution path
          if (data.paths.length > 0) {
            const firstPath = data.paths[0];
            const solutionPath: ChainPlayer[] = firstPath.qids.map((qid, i) => ({
              qid,
              name: firstPath.names[i],
            }));
            setValue("content.solution_path", solutionPath, { shouldValidate: true });
          }
        }
      }
    } catch (err) {
      console.error("PAR calculation failed:", err);
    } finally {
      setIsCalculatingPar(false);
    }
  }, [getValues, setValue]);

  return (
    <div className="space-y-6">
      {/* Start Player */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#58CC02] flex items-center justify-center text-xs text-black font-bold">
            A
          </span>
          Start Player
        </h3>
        <PlayerSelector
          control={control}
          namePrefix="content.start_player"
          placeholder="Search for starting player..."
          onSelect={() => setParResult(null)}
        />
      </div>

      {/* End Player */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center text-xs text-white font-bold">
            B
          </span>
          End Player
        </h3>
        <PlayerSelector
          control={control}
          namePrefix="content.end_player"
          placeholder="Search for target player..."
          onSelect={() => setParResult(null)}
        />
      </div>

      {/* PAR Calculation */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">PAR (Optimal Path)</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCalculatePar}
            disabled={!startPlayer?.qid || !endPlayer?.qid || isCalculatingPar}
          >
            {isCalculatingPar ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Route className="h-4 w-4 mr-2" />
            )}
            Calculate PAR
          </Button>
        </div>

        <FormField
          control={control}
          name="content.par"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PAR Value</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  {...field}
                  className="bg-white/5 border-white/10 w-24"
                />
              </FormControl>
              <FormDescription>
                Number of steps in the optimal path (2-10)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Loading State */}
        {isCalculatingPar && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <div>
                <p className="text-sm text-blue-400 font-medium">Calculating optimal paths...</p>
                <p className="text-xs text-blue-400/70 mt-1">This may take up to 2 minutes for complex connections</p>
              </div>
            </div>
          </div>
        )}

        {/* PAR Result Display */}
        {parResult && (
          <div
            className={cn(
              "p-4 rounded-lg space-y-3",
              parResult.found
                ? "bg-[#58CC02]/10 border border-[#58CC02]/30"
                : "bg-[#EF4444]/10 border border-[#EF4444]/30"
            )}
          >
            {parResult.found ? (
              <>
                {/* Header with optimal and suggested PAR */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-[#58CC02]" />
                    <span className="text-sm text-[#58CC02] font-medium">
                      Optimal path: {parResult.optimalLength} steps
                    </span>
                  </div>
                  <Badge className="bg-[#58CC02]/20 text-[#58CC02] border-[#58CC02]/30">
                    Suggested PAR: {parResult.suggestedPar}
                  </Badge>
                </div>

                {/* Sample Paths */}
                {parResult.paths && parResult.paths.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-gray-300">
                      Sample paths ({parResult.paths.length} found):
                    </span>
                    <div className="space-y-1 pl-2 border-l-2 border-white/10">
                      {parResult.paths.map((path, idx) => (
                        <div key={idx} className="text-xs text-gray-400">
                          {path.names.join(" → ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternative Longer Path */}
                {parResult.alternativePath && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs font-medium text-gray-300">
                      Alternative route ({parResult.alternativePath.qids.length - 1} steps):
                    </span>
                    <div className="text-xs text-gray-400 mt-1">
                      {parResult.alternativePath.names.join(" → ")}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-[#EF4444] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[#EF4444]">
                  {parResult.error || "No path found within 6 steps. Choose different players."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional Hint Player */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FACC15]" />
          Hint Player (Optional)
        </h3>
        <FormDescription>
          An intermediate player to help users if they get stuck
        </FormDescription>
        <PlayerSelector
          control={control}
          namePrefix="content.hint_player"
          placeholder="Search for hint player..."
          optional
        />
      </div>
    </div>
  );
}

// ============================================================================
// PLAYER SELECTOR COMPONENT
// ============================================================================

interface PlayerSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  namePrefix: string;
  placeholder: string;
  optional?: boolean;
  onSelect?: () => void;
}

function PlayerSelector({
  control,
  namePrefix,
  placeholder,
  optional,
  onSelect,
}: PlayerSelectorProps) {
  const { setValue, watch } = useFormContext<FormValues>();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Watch the current player value
  const currentPlayer = watch(namePrefix as "content.start_player");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchPlayersForForm(value);
        if (result.success && result.data) {
          setResults(result.data);
          setShowDropdown(result.data.length > 0);
        }
      } catch {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectPlayer = useCallback(
    (player: PlayerResult) => {
      setValue(
        namePrefix as "content.start_player",
        {
          qid: player.id,
          name: player.name,
          nationality_code: player.nationality_code ?? undefined,
        },
        { shouldValidate: true }
      );
      setQuery("");
      setShowDropdown(false);
      onSelect?.();
    },
    [setValue, namePrefix, onSelect]
  );

  const handleClear = useCallback(() => {
    if (optional) {
      setValue(namePrefix as "content.hint_player", undefined);
    } else {
      setValue(
        namePrefix as "content.start_player",
        { qid: "", name: "", nationality_code: undefined },
        { shouldValidate: true }
      );
    }
    setQuery("");
    onSelect?.();
  }, [setValue, namePrefix, optional, onSelect]);

  // Show selected player or search input
  if (currentPlayer?.qid && currentPlayer?.name) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10">
          <Badge variant="outline" className="text-xs">
            {currentPlayer.qid}
          </Badge>
          <span className="text-sm text-white">{currentPlayer.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white/5 border-white/10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-white/10 bg-[#1e293b] shadow-lg">
          {results.map((player) => (
            <button
              key={player.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
              onClick={() => handleSelectPlayer(player)}
            >
              <div>
                <span className="text-white">{player.name}</span>
                {player.birth_year && (
                  <span className="text-gray-400 ml-2">
                    ({player.birth_year})
                  </span>
                )}
              </div>
              <Badge variant="outline" className="text-[10px]">
                {player.id}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Hidden form fields for validation - only for required fields */}
      {!optional && (
        <>
          <FormField
            control={control}
            name={`${namePrefix}.qid`}
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${namePrefix}.name`}
            render={({ field }) => (
              <FormItem className="hidden">
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}
