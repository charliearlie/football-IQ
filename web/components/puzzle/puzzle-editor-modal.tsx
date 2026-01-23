"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, subDays } from "date-fns";
import { Copy, Save, Send, Loader2, ArrowRight, Star, AlertTriangle, Check, X, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  GAME_MODE_DISPLAY_NAMES,
  PREMIUM_MODES,
  type GameMode,
  type PuzzleStatus,
} from "@/lib/constants";
import type { DailyPuzzle, ContentReport } from "@/types/supabase";
import {
  contentSchemaMap,
  getDefaultContent,
  type PuzzleContent,
} from "@/lib/schemas";
import { upsertPuzzle, copyFromPreviousDay } from "@/app/(dashboard)/calendar/actions";
import { useReportsForPuzzle } from "@/hooks/use-reports";

// Report type labels for display
const REPORT_TYPE_LABELS: Record<string, string> = {
  retired_moved: "Retired/Moved",
  incorrect_stats: "Incorrect Stats",
  name_visible: "Name Visible",
  wrong_club: "Wrong Club",
  other: "Other",
};

// Content metadata interface for AI-scouted puzzles
interface ContentMetadata {
  scouted_at?: string;
  wikipedia_revision_id?: string;
  wikipedia_revision_date?: string;
  generated_by?: "manual" | "ai_oracle" | "ai_scout";
  wikipedia_url?: string;
}

// Import form components
import { CareerPathForm } from "./forms/career-path-form";
import { TransferGuessForm } from "./forms/transfer-guess-form";
import { GoalscorerRecallForm } from "./forms/goalscorer-recall-form";
import { TheGridForm } from "./forms/the-grid-form";
import { TopicalQuizForm } from "./forms/topical-quiz-form";
import { TopTensForm } from "./forms/top-tens-form";
import { StartingXIForm } from "./forms/starting-xi-form";

// Import preview components
import { CareerPathPreview } from "./previews/career-path-preview";
import { TransferGuessPreview } from "./previews/transfer-guess-preview";
import { GoalscorerRecallPreview } from "./previews/goalscorer-recall-preview";
import { TheGridPreview } from "./previews/the-grid-preview";
import { TopicalQuizPreview } from "./previews/topical-quiz-preview";
import { TopTensPreview } from "./previews/top-tens-preview";
import { StartingXIPreview } from "./previews/starting-xi-preview";

// ============================================================================
// TYPES
// ============================================================================

interface PuzzleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleDate: string | null;
  gameMode: GameMode;
  puzzle?: DailyPuzzle | null;
  onSaveSuccess?: (puzzle: DailyPuzzle) => void;
  /** Callback for "Save & Next Gap" - saves then calls this with the saved puzzle */
  onSaveAndNextGap?: (puzzle: DailyPuzzle) => void;
  /** Whether to show the "Save & Next Gap" button */
  showNextGapButton?: boolean;
}

interface FormValues {
  content: PuzzleContent;
  difficulty: string | null;
  status: PuzzleStatus;
}

// ============================================================================
// FORM REGISTRY
// ============================================================================

const formRegistry: Record<GameMode, React.ComponentType> = {
  career_path: CareerPathForm,
  career_path_pro: CareerPathForm,
  the_grid: TheGridForm,
  guess_the_transfer: TransferGuessForm,
  guess_the_goalscorers: GoalscorerRecallForm,
  topical_quiz: TopicalQuizForm,
  top_tens: TopTensForm,
  starting_xi: StartingXIForm,
};

const previewRegistry: Record<GameMode, React.ComponentType<{ content: unknown }>> = {
  career_path: CareerPathPreview,
  career_path_pro: CareerPathPreview,
  the_grid: TheGridPreview,
  guess_the_transfer: TransferGuessPreview,
  guess_the_goalscorers: GoalscorerRecallPreview,
  topical_quiz: TopicalQuizPreview,
  top_tens: TopTensPreview,
  starting_xi: StartingXIPreview,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PuzzleEditorModal({
  isOpen,
  onClose,
  puzzleDate,
  gameMode,
  puzzle,
  onSaveSuccess,
  onSaveAndNextGap,
  showNextGapButton = false,
}: PuzzleEditorModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNextGap, setIsSavingNextGap] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const isEditMode = !!puzzle;
  const isPremium = PREMIUM_MODES.includes(gameMode);
  const isBacklogMode = puzzleDate === null;
  const contentSchema = contentSchemaMap[gameMode];

  // Fetch reports for this puzzle
  const {
    reports,
    pendingCount,
    resolve: resolveReport,
    isLoading: isLoadingReports,
  } = useReportsForPuzzle(puzzle?.id ?? null);

  // Extract metadata from puzzle content
  const contentMetadata = useMemo(() => {
    if (!puzzle?.content) return null;
    const content = puzzle.content as { _metadata?: ContentMetadata };
    return content._metadata ?? null;
  }, [puzzle?.content]);

  // Create form schema that wraps content validation
  const formSchema = useMemo(
    () =>
      z.object({
        content: contentSchema,
        difficulty: z.string().nullable(),
        status: z.enum(["draft", "live", "archived"]),
      }),
    [contentSchema]
  );

  // Initialize form
  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      content: (puzzle?.content as PuzzleContent) || getDefaultContent(gameMode),
      difficulty: puzzle?.difficulty || null,
      status: (puzzle?.status as PuzzleStatus) || "draft",
    },
    mode: "onChange",
  });

  const { watch, reset, setValue, formState } = form;
  const watchedContent = watch("content");
  const watchedDifficulty = watch("difficulty");
  const watchedStatus = watch("status");

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      reset({
        content: (puzzle?.content as PuzzleContent) || getDefaultContent(gameMode),
        difficulty: puzzle?.difficulty || null,
        status: (puzzle?.status as PuzzleStatus) || "draft",
      });
      setSaveError(null);
    }
  }, [isOpen, puzzle, gameMode, reset]);

  // Handle save
  const onSubmit = useCallback(
    async (status: PuzzleStatus) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const content = form.getValues("content");
        const difficulty = form.getValues("difficulty");

        const result = await upsertPuzzle({
          puzzle_date: puzzleDate,
          game_mode: gameMode,
          content,
          status,
          difficulty,
          source: "manual",
        });

        if (!result.success) {
          setSaveError(result.error || "Failed to save puzzle");
          return;
        }

        // Call success callback with the saved puzzle
        if (onSaveSuccess && result.data) {
          onSaveSuccess(result.data as DailyPuzzle);
        }

        onClose();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsSaving(false);
      }
    },
    [form, puzzleDate, gameMode, onSaveSuccess, onClose]
  );

  // Handle save and next gap
  const handleSaveAndNextGap = useCallback(async () => {
    if (!onSaveAndNextGap) return;

    setIsSavingNextGap(true);
    setSaveError(null);

    try {
      const content = form.getValues("content");
      const difficulty = form.getValues("difficulty");

      const result = await upsertPuzzle({
        puzzle_date: puzzleDate,
        game_mode: gameMode,
        content,
        status: "draft", // Always save as draft when using "Save & Next Gap"
        difficulty,
        source: "manual",
      });

      if (!result.success) {
        setSaveError(result.error || "Failed to save puzzle");
        return;
      }

      // Call the next gap callback with the saved puzzle
      onSaveAndNextGap(result.data as DailyPuzzle);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSavingNextGap(false);
    }
  }, [form, puzzleDate, gameMode, onSaveAndNextGap]);

  // Handle copy from yesterday
  const handleCopyFromYesterday = useCallback(async () => {
    if (!puzzleDate) return; // Can't copy for backlog puzzles

    setIsCopying(true);
    setSaveError(null);

    try {
      const yesterday = format(subDays(parseISO(puzzleDate), 1), "yyyy-MM-dd");
      const result = await copyFromPreviousDay(yesterday, gameMode);

      if (!result.success) {
        setSaveError(result.error || "Failed to copy from previous day");
        return;
      }

      const { content, difficulty } = result.data as { content: unknown; difficulty: string | null };

      setValue("content", content as PuzzleContent, { shouldValidate: true });
      if (difficulty) {
        setValue("difficulty", difficulty);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsCopying(false);
    }
  }, [puzzleDate, gameMode, setValue]);

  // Get the form component for this game mode
  const FormComponent = formRegistry[gameMode];
  const PreviewComponent = previewRegistry[gameMode];

  const formattedDate = puzzleDate
    ? format(parseISO(puzzleDate), "EEEE, MMM d, yyyy")
    : "Backlog (No Date)";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] w-[1400px] h-[90vh] p-0 bg-stadium-navy border-white/10"
        hideCloseButton
        onOpenAutoFocus={(e) => {
          // Prevent default focus behavior and let the form handle focus naturally
          e.preventDefault();
          // Focus the first input in the form after a brief delay
          setTimeout(() => {
            const firstInput = document.querySelector<HTMLInputElement>(
              '[role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select'
            );
            firstInput?.focus();
          }, 0);
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-semibold text-floodlight">
              {isEditMode ? "Edit" : "Create"} {GAME_MODE_DISPLAY_NAMES[gameMode]}
            </DialogTitle>
            {isPremium && (
              <Badge variant="warning" className="text-xs">Premium</Badge>
            )}
            {puzzle?.is_bonus && (
              <Badge
                variant="outline"
                className="text-xs bg-card-yellow/10 text-card-yellow border-card-yellow/30"
              >
                <Star className="h-3 w-3 mr-1" />
                Bonus
              </Badge>
            )}
            <span className="text-muted-foreground">{formattedDate}</span>
          </div>
        </DialogHeader>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column - Form */}
          <div className="w-1/2 border-r border-white/10 flex flex-col">
            {/* Form Meta Controls */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center gap-4 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Difficulty</Label>
                <Select
                  value={watchedDifficulty || ""}
                  onValueChange={(value) => setValue("difficulty", value || null)}
                >
                  <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <Badge
                  variant={watchedStatus === "live" ? "success" : "warning"}
                  className="cursor-default"
                >
                  {watchedStatus === "live" ? "Live" : "Draft"}
                </Badge>
              </div>
            </div>

            {/* Scrollable Form Area */}
            <ScrollArea className="flex-1 px-6 py-4">
              <FormProvider {...form}>
                <form className="space-y-6">
                  <FormComponent />
                </form>
              </FormProvider>

              {/* Reports Section - shown when there are pending reports */}
              {isEditMode && pendingCount > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-card" />
                    <span className="text-sm font-medium text-red-card">
                      {pendingCount} Pending Report{pendingCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {reports
                      .filter((r) => r.status === "pending")
                      .map((report) => (
                        <div
                          key={report.id}
                          className="p-3 rounded-lg bg-red-card/10 border border-red-card/20"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <Badge variant="outline" className="mb-2 text-xs border-red-card/30 text-red-card">
                                {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                              </Badge>
                              {report.comment && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {report.comment}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground/70 mt-2">
                                Reported {format(parseISO(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveReport(report.id, "resolved")}
                                className="h-7 px-2 text-pitch-green hover:bg-pitch-green/10"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveReport(report.id, "dismissed")}
                                className="h-7 px-2 text-muted-foreground hover:bg-white/5"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Metadata Footer - shown for AI-scouted content */}
              {isEditMode && contentMetadata && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3" />
                    <span>
                      Scouted{" "}
                      {contentMetadata.scouted_at
                        ? format(parseISO(contentMetadata.scouted_at), "MMM d, yyyy")
                        : "Unknown"}
                      {contentMetadata.generated_by && ` via ${contentMetadata.generated_by}`}
                    </span>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Column - Preview */}
          <div className="w-1/2 flex flex-col bg-[#0A1628]">
            <div className="px-6 py-3 border-b border-white/10">
              <span className="text-sm font-medium text-muted-foreground">
                Live Preview
              </span>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="flex items-center justify-center min-h-full">
                <div className="w-full max-w-md">
                  <PreviewComponent content={watchedContent} />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          {/* Error message */}
          {saveError && (
            <div className="text-sm text-red-card flex-1 mr-4">
              {saveError}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {/* Copy from Yesterday (only for scheduled puzzles) */}
            {!isBacklogMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyFromYesterday}
                disabled={isCopying || isSaving || isSavingNextGap}
                className="border-white/10"
              >
                {isCopying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy Yesterday
              </Button>
            )}

            {/* Cancel */}
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving || isSavingNextGap}
            >
              Cancel
            </Button>

            {/* Save as Draft */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onSubmit("draft")}
              disabled={isSaving || isSavingNextGap || !formState.isValid}
            >
              {isSaving && !isSavingNextGap ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>

            {/* Save & Next Gap (only shown when enabled and not in backlog mode) */}
            {showNextGapButton && !isBacklogMode && onSaveAndNextGap && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveAndNextGap}
                disabled={isSaving || isSavingNextGap || !formState.isValid}
                className="bg-card-yellow/20 hover:bg-card-yellow/30 text-card-yellow border-card-yellow/30"
              >
                {isSavingNextGap ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Save &amp; Next Gap
              </Button>
            )}

            {/* Publish */}
            <Button
              type="button"
              onClick={() => onSubmit("live")}
              disabled={isSaving || isSavingNextGap || !formState.isValid}
              className="bg-pitch-green hover:bg-pitch-green/90"
            >
              {isSaving && !isSavingNextGap ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
