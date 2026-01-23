"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Sparkles, Loader2, Check, X, Circle, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  getOracleSuggestions,
  oracleScoutAndSave,
  revalidateCalendar,
} from "@/app/(dashboard)/calendar/actions";
import type { OracleTheme } from "@/types/ai";

export type OracleGameMode = "career_path" | "career_path_pro";

// Theme display names for the dropdown
const THEME_OPTIONS: { value: OracleTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "premier_league_legends", label: "Premier League Legends" },
  { value: "world_cup_icons", label: "World Cup Icons" },
  { value: "streets_wont_forget", label: "Streets Won't Forget" },
  { value: "journeymen", label: "Journeymen" },
  { value: "90s_2000s_nostalgia", label: "90s/2000s Nostalgia" },
  { value: "rising_stars", label: "Rising Stars" },
  { value: "custom", label: "Custom..." },
];

interface OracleModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: OracleGameMode;
  gapDates: string[];
  onComplete: () => void;
}

type ProcessPhase = "idle" | "getting-suggestions" | "scouting" | "done" | "error";

interface ProcessResult {
  date: string;
  playerName: string;
  success: boolean;
  error?: string;
}

export function OracleModal({
  isOpen,
  onClose,
  gameMode,
  gapDates,
  onComplete,
}: OracleModalProps) {
  // Date selection state
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set(gapDates));

  // Theme selection state
  const [selectedTheme, setSelectedTheme] = useState<OracleTheme>("default");
  const [customPrompt, setCustomPrompt] = useState("");

  // Processing state
  const [phase, setPhase] = useState<ProcessPhase>("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation ref
  const cancelledRef = useRef(false);

  // Reset state when modal opens with new dates
  useEffect(() => {
    if (isOpen) {
      setSelectedDates(new Set(gapDates));
      setSelectedTheme("default");
      setCustomPrompt("");
      setPhase("idle");
      setCurrentIndex(0);
      setResults([]);
      setErrorMessage(null);
      cancelledRef.current = false;
    }
  }, [isOpen, gapDates]);

  // Toggle date selection
  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }, []);

  // Select/deselect all
  const toggleAll = useCallback(() => {
    if (selectedDates.size === gapDates.length) {
      setSelectedDates(new Set());
    } else {
      setSelectedDates(new Set(gapDates));
    }
  }, [gapDates, selectedDates.size]);

  // Start the Oracle process
  const startOracle = useCallback(async () => {
    const datesToFill = Array.from(selectedDates).sort();
    if (datesToFill.length === 0) return;

    cancelledRef.current = false;
    setPhase("getting-suggestions");
    setErrorMessage(null);

    // Step 1: Get suggestions
    const suggestionsResult = await getOracleSuggestions({
      gameMode,
      count: datesToFill.length,
      theme: selectedTheme,
      customPrompt: selectedTheme === "custom" ? customPrompt : undefined,
    });

    if (!suggestionsResult.success || !suggestionsResult.data?.suggestions) {
      setPhase("error");
      setErrorMessage(suggestionsResult.error || "Failed to get suggestions");
      return;
    }

    const fetchedSuggestions = suggestionsResult.data.suggestions;

    // Check if we have enough suggestions
    if (fetchedSuggestions.length < datesToFill.length) {
      setPhase("error");
      setErrorMessage(
        `Oracle only generated ${fetchedSuggestions.length} suggestions for ${datesToFill.length} dates`
      );
      return;
    }

    // Step 2: Scout and save each player
    setPhase("scouting");
    const newResults: ProcessResult[] = [];

    for (let i = 0; i < datesToFill.length; i++) {
      if (cancelledRef.current) break;

      const targetDate = datesToFill[i];
      const suggestion = fetchedSuggestions[i];

      setCurrentIndex(i);

      const result = await oracleScoutAndSave({
        suggestion,
        gameMode,
        targetDate,
      });

      const processResult: ProcessResult = {
        date: targetDate,
        playerName: result.data?.playerName || suggestion.name,
        success: result.success,
        error: result.error,
      };

      newResults.push(processResult);
      setResults([...newResults]);
    }

    // Done - revalidate and notify
    await revalidateCalendar();
    setPhase("done");
  }, [selectedDates, gameMode, selectedTheme, customPrompt]);

  // Cancel the process
  const handleCancel = useCallback(() => {
    if (phase === "scouting") {
      cancelledRef.current = true;
    }
  }, [phase]);

  // Close and cleanup
  const handleClose = useCallback(() => {
    if (phase === "done") {
      onComplete();
    }
    onClose();
  }, [phase, onClose, onComplete]);

  // Derived values
  const selectedCount = selectedDates.size;
  const isProcessing = phase === "getting-suggestions" || phase === "scouting";
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  const gameModeLabel = gameMode === "career_path" ? "Career Path" : "Career Path Pro";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md" hideCloseButton={isProcessing}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Oracle: Fill {gameModeLabel} Gaps
          </DialogTitle>
          <DialogDescription>
            {phase === "idle" && "Select which dates to fill with AI-generated puzzles."}
            {phase === "getting-suggestions" && "Getting player suggestions from Oracle..."}
            {phase === "scouting" && `Scouting player ${currentIndex + 1} of ${selectedCount}...`}
            {phase === "done" && `Completed: ${successCount} created, ${failCount} failed.`}
            {phase === "error" && "An error occurred."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Date Selection (shown when idle) */}
          {phase === "idle" && (
            <>
              {/* Theme Selector */}
              <div className="space-y-3 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Theme (optional)</Label>
                  <Select
                    value={selectedTheme}
                    onValueChange={(v) => setSelectedTheme(v as OracleTheme)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom prompt input (shown when "custom" is selected) */}
                {selectedTheme === "custom" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Custom Prompt</Label>
                    <Textarea
                      placeholder="e.g., Players who played for both Man Utd and Liverpool"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} of {gapDates.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                  className="text-xs"
                >
                  {selectedDates.size === gapDates.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {gapDates.map((date) => (
                    <div
                      key={date}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5"
                    >
                      <Checkbox
                        id={date}
                        checked={selectedDates.has(date)}
                        onCheckedChange={() => toggleDate(date)}
                      />
                      <Label
                        htmlFor={date}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {format(parseISO(date), "EEEE, MMM d, yyyy")}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Progress (shown when processing) */}
          {(phase === "getting-suggestions" || phase === "scouting") && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {phase === "getting-suggestions"
                      ? "Generating suggestions..."
                      : `Scouting player ${currentIndex + 1}...`}
                  </span>
                  {phase === "scouting" && (
                    <span className="text-muted-foreground">
                      {currentIndex + 1} / {selectedCount}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{
                      width:
                        phase === "getting-suggestions"
                          ? "10%"
                          : `${((currentIndex + 1) / selectedCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Results list */}
              {results.length > 0 && (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-1">
                    {results.map((result, idx) => (
                      <div key={idx} className="py-1">
                        <div className="flex items-center gap-2 text-sm">
                          {result.success ? (
                            <Check className="h-4 w-4 text-pitch-green shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-red-card shrink-0" />
                          )}
                          <span className="text-muted-foreground">
                            {format(parseISO(result.date), "MMM d")}:
                          </span>
                          <span className={result.success ? "text-foreground" : "text-red-card"}>
                            Player {idx + 1}
                          </span>
                        </div>
                        {/* Show error message if failed */}
                        {!result.success && result.error && (
                          <p className="text-xs text-red-card/80 ml-6 mt-0.5">
                            {result.error}
                          </p>
                        )}
                      </div>
                    ))}
                    {/* Pending items */}
                    {Array.from(selectedDates)
                      .sort()
                      .slice(results.length)
                      .map((date, idx) => (
                        <div
                          key={date}
                          className="flex items-center gap-2 text-sm py-1 opacity-50"
                        >
                          <Circle className="h-4 w-4 shrink-0" />
                          <span className="text-muted-foreground">
                            {format(parseISO(date), "MMM d")}:
                          </span>
                          <span className="text-muted-foreground">
                            Player {results.length + idx + 1}
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}

              {phase === "getting-suggestions" && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              )}
            </div>
          )}

          {/* Done state */}
          {phase === "done" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pitch-green">{successCount}</div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
                {failCount > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-card">{failCount}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                )}
              </div>
              <ScrollArea className="h-[150px]">
                <div className="space-y-1">
                  {results.map((result, idx) => (
                    <div key={idx} className="py-1">
                      <div className="flex items-center gap-2 text-sm">
                        {result.success ? (
                          <Check className="h-4 w-4 text-pitch-green shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-card shrink-0" />
                        )}
                        <span className="text-muted-foreground">
                          {format(parseISO(result.date), "MMM d")}:
                        </span>
                        <span className={result.success ? "text-foreground" : "text-red-card"}>
                          Player {idx + 1}
                        </span>
                      </div>
                      {/* Show error message if failed */}
                      {!result.success && result.error && (
                        <p className="text-xs text-red-card/80 ml-6 mt-0.5">
                          {result.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Error state */}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle className="h-12 w-12 text-red-card" />
              <p className="text-sm text-center text-muted-foreground">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === "idle" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={startOracle}
                disabled={selectedCount === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Oracle ({selectedCount})
              </Button>
            </>
          )}

          {isProcessing && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelledRef.current}
            >
              {cancelledRef.current ? "Cancelling..." : "Cancel"}
            </Button>
          )}

          {(phase === "done" || phase === "error") && (
            <Button onClick={handleClose}>
              {phase === "done" ? "Done" : "Close"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
