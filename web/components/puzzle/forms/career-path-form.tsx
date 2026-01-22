"use client";

import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GripVertical, Sparkles, Loader2 } from "lucide-react";

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
import { scoutPlayerCareer } from "@/app/(dashboard)/calendar/actions";

interface FormValues {
  content: CareerPathContent;
}

export function CareerPathForm() {
  const { control, setValue } = useFormContext<FormValues>();

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "content.career_steps",
  });

  // AI Scout state
  const [wikipediaUrl, setWikipediaUrl] = useState("");
  const [isScounting, setIsScounting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [stepConfidences, setStepConfidences] = useState<ConfidenceLevel[]>([]);

  const handleScout = async () => {
    if (!wikipediaUrl.trim()) return;

    setIsScounting(true);
    setScoutError(null);

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
      {/* AI Scout Section */}
      <div className="glass-card p-4 border-l-4 border-amber-500">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="font-semibold text-white">Scout with AI</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Paste a Wikipedia URL to auto-populate the career timeline
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
              <span className="w-2 h-2 rounded-full bg-red-500" /> Low (review)
            </span>
          </div>
        )}
      </div>

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
              append({ type: "club", text: "", year: "", apps: null, goals: null });
              // Clear confidence for manually added steps
              setStepConfidences((prev) => [...prev, undefined as unknown as ConfidenceLevel]);
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
                      setStepConfidences((prev) => prev.filter((_, i) => i !== index));
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
                        <FormLabel className="text-xs text-muted-foreground">Type</FormLabel>
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
                        <FormLabel className="text-xs text-muted-foreground">Year(s)</FormLabel>
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
                      <FormLabel className="text-xs text-muted-foreground">Club Name</FormLabel>
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
                        <FormLabel className="text-xs text-muted-foreground">Apps (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
                        <FormLabel className="text-xs text-muted-foreground">Goals (optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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
