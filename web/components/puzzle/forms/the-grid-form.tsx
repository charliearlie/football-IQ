"use client";

import { useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import type { TheGridContent, CategoryType } from "@/lib/schemas";

interface FormValues {
  content: TheGridContent;
}

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: "club", label: "Club" },
  { value: "nation", label: "Nation" },
  { value: "stat", label: "Stat" },
  { value: "trophy", label: "Trophy" },
];

export function TheGridForm() {
  const { control, watch, setValue, getValues } = useFormContext<FormValues>();

  const validAnswers = watch("content.valid_answers") || {};

  // Helper to add a valid answer for a cell
  const addValidAnswer = (cellIndex: string) => {
    const current = getValues(`content.valid_answers.${cellIndex}`) || [];
    setValue(`content.valid_answers.${cellIndex}`, [...current, ""], {
      shouldValidate: true,
    });
  };

  // Helper to remove a valid answer from a cell
  const removeValidAnswer = (cellIndex: string, answerIndex: number) => {
    const current = getValues(`content.valid_answers.${cellIndex}`) || [];
    setValue(
      `content.valid_answers.${cellIndex}`,
      current.filter((_, i) => i !== answerIndex),
      { shouldValidate: true }
    );
  };

  // Helper to update a valid answer
  const updateValidAnswer = (
    cellIndex: string,
    answerIndex: number,
    value: string
  ) => {
    const current = getValues(`content.valid_answers.${cellIndex}`) || [];
    const updated = [...current];
    updated[answerIndex] = value;
    setValue(`content.valid_answers.${cellIndex}`, updated, {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* X-Axis (Columns) */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">
          Column Headers (X-Axis)
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {([0, 1, 2] as const).map((index) => (
            <div key={`x-${index}`} className="space-y-2">
              <FormField
                control={control}
                name={`content.xAxis.${index}.type` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Type
                    </FormLabel>
                    <Select value={field.value as string} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`content.xAxis.${index}.value` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Value
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value as string}
                        placeholder="e.g., Real Madrid"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Y-Axis (Rows) */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">
          Row Headers (Y-Axis)
        </h3>

        <div className="grid grid-cols-3 gap-4">
          {([0, 1, 2] as const).map((index) => (
            <div key={`y-${index}`} className="space-y-2">
              <FormField
                control={control}
                name={`content.yAxis.${index}.type` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Type
                    </FormLabel>
                    <Select value={field.value as string} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`content.yAxis.${index}.value` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Value
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value as string}
                        placeholder="e.g., France"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Valid Answers Grid */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">
          Valid Answers (per cell)
        </h3>
        <p className="text-xs text-muted-foreground">
          Add player names that are valid for each cell intersection.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIndex) => {
            const row = Math.floor(cellIndex / 3);
            const col = cellIndex % 3;
            const cellAnswers = validAnswers[String(cellIndex)] || [];

            return (
              <div
                key={cellIndex}
                className="border border-white/10 rounded-lg p-3 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    Cell {cellIndex} (R{row + 1}C{col + 1})
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => addValidAnswer(String(cellIndex))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {cellAnswers.map((answer, answerIndex) => (
                    <div
                      key={answerIndex}
                      className="flex items-center gap-1"
                    >
                      <Input
                        value={answer}
                        onChange={(e) =>
                          updateValidAnswer(
                            String(cellIndex),
                            answerIndex,
                            e.target.value
                          )
                        }
                        placeholder="Player name"
                        className="h-8 text-xs bg-white/5 border-white/10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() =>
                          removeValidAnswer(String(cellIndex), answerIndex)
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  {cellAnswers.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No answers yet
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
