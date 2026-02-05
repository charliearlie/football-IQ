"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  Loader2,
  Search,
  Database,
  AlertTriangle,
  Trophy,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { CareerPathContent } from "@/lib/schemas";
import type { ConfidenceLevel } from "@/types/ai";
import {
  scoutPlayerCareer,
  searchPlayersForForm,
  fetchCareerForForm,
  checkDuplicateAnswer,
} from "@/app/(dashboard)/calendar/actions";
import { syncPlayerAchievements } from "@/app/(dashboard)/player-scout/actions";

interface FormValues {
  content: CareerPathContent;
}

interface PlayerResult {
  id: string;
  name: string;
  birth_year: number | null;
  scout_rank: number;
}

export function CareerPathForm() {
  const { control, setValue, watch } = useFormContext<FormValues>();
  const answerQid = watch("content.answer_qid");

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "content.career_steps",
  });

  // Player search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingCareer, setIsFetchingCareer] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<
    { puzzle_date: string | null; game_mode: string }[] | null
  >(null);

  // AI Scout state
  const [wikipediaUrl, setWikipediaUrl] = useState("");
  const [isScounting, setIsScounting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [stepConfidences, setStepConfidences] = useState<ConfidenceLevel[]>(
    []
  );

  // Achievement sync state
  const [isSyncingAchievements, setIsSyncingAchievements] = useState(false);
  const [achievementResult, setAchievementResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

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
    setSearchQuery(value);
    setSearchError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchPlayersForForm(value);
        if (result.success && result.data) {
          setSearchResults(result.data);
          setShowDropdown(result.data.length > 0);
        } else {
          setSearchError(result.error ?? "Search failed");
        }
      } catch {
        setSearchError("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const runDuplicateCheck = useCallback(async (playerName: string) => {
    try {
      const dupResult = await checkDuplicateAnswer(playerName);
      if (dupResult.success && dupResult.data && dupResult.data.length > 0) {
        setDuplicateWarning(dupResult.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // Non-critical — don't block the flow
    }
  }, []);

  const handlePlayerSelect = useCallback(
    async (player: PlayerResult) => {
      setShowDropdown(false);
      setSearchQuery(player.name);
      setIsFetchingCareer(true);
      setSearchError(null);
      setStepConfidences([]);
      setDuplicateWarning(null);

      try {
        const result = await fetchCareerForForm(player.id, player.name);

        if (!result.success || !result.data) {
          setSearchError(
            result.error ?? "Failed to fetch career. Try the Wikipedia scout."
          );
          setValue("content.answer", player.name);
          setValue("content.answer_qid", player.id);
          return;
        }

        setValue("content.answer", result.data.answer);
        setValue("content.answer_qid", result.data.answer_qid);
        replace(result.data.career_steps);
      } catch {
        setSearchError("Failed to fetch career data");
        setValue("content.answer", player.name);
        setValue("content.answer_qid", player.id);
      } finally {
        setIsFetchingCareer(false);
      }

      // Check for duplicates after populating (non-blocking)
      runDuplicateCheck(player.name);
    },
    [setValue, replace, runDuplicateCheck]
  );

  const handleScout = async () => {
    if (!wikipediaUrl.trim()) return;

    setIsScounting(true);
    setScoutError(null);
    setDuplicateWarning(null);

    try {
      const result = await scoutPlayerCareer(wikipediaUrl);

      if (!result.success || !result.data?.data) {
        setScoutError(result.error || "Failed to scout player");
        return;
      }

      const { answer, career_steps } = result.data.data;

      // Update form with scouted data
      setValue("content.answer", answer);

      // Replace career steps
      replace(
        career_steps.map((step) => ({
          type: step.type,
          text: step.text,
          year: step.year,
          apps: step.apps,
          goals: step.goals,
        }))
      );

      // Store confidence data for UI indicators
      setStepConfidences(career_steps.map((s) => s.confidence));

      // Clear the URL field after successful scout
      setWikipediaUrl("");

      // Check for duplicates (non-blocking)
      runDuplicateCheck(answer);
    } catch (err) {
      setScoutError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsScounting(false);
    }
  };

  const getConfidenceColor = (confidence: ConfidenceLevel | undefined) => {
    switch (confidence) {
      case "high":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-red-500";
      default:
        return "";
    }
  };

  const getConfidenceLabel = (confidence: ConfidenceLevel | undefined) => {
    switch (confidence) {
      case "high":
        return "High confidence - data verified in source";
      case "medium":
        return "Medium confidence - some data inferred";
      case "low":
        return "Low confidence - review this data";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Database Search */}
      <div ref={dropdownRef}>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold text-white">
              Search Player Database
            </h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Search our database to auto-populate the career from Wikidata
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
              disabled={isFetchingCareer}
            />
            {(isSearching || isFetchingCareer) && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {isFetchingCareer && (
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Fetching career from Wikidata...
            </p>
          )}
          {searchError && (
            <p className="text-sm text-red-400 mt-2">{searchError}</p>
          )}

          {/* Dropdown inline within card — ScrollArea clips absolute positioning */}
          {showDropdown && searchResults.length > 0 && (
            <div className="mt-2 border border-white/10 rounded-md max-h-60 overflow-y-auto bg-[hsl(var(--card))]">
              {searchResults.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handlePlayerSelect(player)}
                  className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-white transition-colors"
                >
                  <span className="font-medium">{player.name}</span>
                  {player.birth_year && (
                    <span className="text-muted-foreground ml-2">
                      (b. {player.birth_year})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Scout Section */}
      <div className="glass-card p-4 border-l-4 border-amber-500">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-white">
            Or: Scout from Wikipedia
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Paste a Wikipedia URL for richer data (apps, goals, loan detection)
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://en.wikipedia.org/wiki/Andrea_Pirlo"
            value={wikipediaUrl}
            onChange={(e) => setWikipediaUrl(e.target.value)}
            className="flex-1 bg-white/5 border-white/10"
            disabled={isScounting}
          />
          <Button
            type="button"
            onClick={handleScout}
            disabled={isScounting || !wikipediaUrl.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {isScounting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Scouting...
              </>
            ) : (
              "Scout Player"
            )}
          </Button>
        </div>
        {scoutError && (
          <p className="text-sm text-red-400 mt-2">{scoutError}</p>
        )}
        {stepConfidences.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Low
              (review)
            </span>
          </div>
        )}
      </div>

      {/* Sync Achievements */}
      {answerQid && (
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-purple-500" />
            <h3 className="font-semibold text-white">Trophy Cabinet</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Fetch achievements from Wikidata and update the stats cache for Grid
            validation
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={async () => {
                setIsSyncingAchievements(true);
                setAchievementResult(null);
                try {
                  const result = await syncPlayerAchievements(answerQid);
                  if (result.success) {
                    setAchievementResult({
                      success: true,
                      message: `Synced ${result.count} achievement${result.count !== 1 ? "s" : ""}`,
                    });
                  } else {
                    setAchievementResult({
                      success: false,
                      message: result.error ?? "Sync failed",
                    });
                  }
                } catch (err) {
                  setAchievementResult({
                    success: false,
                    message:
                      err instanceof Error ? err.message : "Unknown error",
                  });
                } finally {
                  setIsSyncingAchievements(false);
                }
              }}
              disabled={isSyncingAchievements}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium"
            >
              {isSyncingAchievements ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                "Sync Achievements"
              )}
            </Button>
            <span className="text-xs text-muted-foreground font-mono">
              {answerQid}
            </span>
          </div>
          {achievementResult && (
            <p
              className={cn(
                "text-sm mt-2",
                achievementResult.success
                  ? "text-green-400"
                  : "text-red-400"
              )}
            >
              {achievementResult.message}
            </p>
          )}
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicateWarning && duplicateWarning.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-amber-500 bg-amber-500/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">
                This player already has a career path puzzle
              </p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {duplicateWarning.map((d, i) => (
                  <li key={i}>
                    {d.puzzle_date ?? "Backlog"} &mdash;{" "}
                    {d.game_mode === "career_path_pro"
                      ? "Career Path Pro"
                      : "Career Path"}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Player Name (Answer) */}
      <FormField
        control={control}
        name="content.answer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Player Name (Answer)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Zlatan Ibrahimovic"
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Career Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Career Steps ({fields.length})
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              append({
                type: "club",
                text: "",
                year: "",
                apps: null,
                goals: null,
              });
              // Clear confidence for manually added steps
              setStepConfidences((prev) => [
                ...prev,
                undefined as unknown as ConfidenceLevel,
              ]);
            }}
            className="border-white/10"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => {
            const confidence = stepConfidences[index];
            const hasConfidence = confidence !== undefined;

            return (
              <div
                key={field.id}
                className={cn(
                  "glass-card p-4 space-y-3",
                  confidence === "low" && "border-l-2 border-red-500"
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="text-sm font-medium text-floodlight">
                    Step {index + 1}
                  </span>
                  {hasConfidence && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full cursor-help",
                            getConfidenceColor(confidence)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getConfidenceLabel(confidence)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-card"
                    onClick={() => {
                      remove(index);
                      // Also remove confidence at this index
                      setStepConfidences((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                    disabled={fields.length <= 3}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Type */}
                  <FormField
                    control={control}
                    name={`content.career_steps.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Type
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="club">Club</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Year */}
                  <FormField
                    control={control}
                    name={`content.career_steps.${index}.year`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Year(s)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="2019-2023"
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Club Name */}
                <FormField
                  control={control}
                  name={`content.career_steps.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Club Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Manchester United"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Apps & Goals */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name={`content.career_steps.${index}.apps`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Apps (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="123"
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name={`content.career_steps.${index}.goals`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Goals (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="45"
                            className="bg-white/5 border-white/10"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {fields.length < 3 && (
          <p className="text-sm text-red-card">
            At least 3 career steps required
          </p>
        )}
      </div>
    </div>
  );
}
