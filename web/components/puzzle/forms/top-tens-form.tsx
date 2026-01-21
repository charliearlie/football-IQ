"use client";

import { useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

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

import type { TopTensContent } from "@/lib/schemas";

interface FormValues {
  content: TopTensContent;
}

export function TopTensForm() {
  const { control, watch, setValue, getValues } = useFormContext<FormValues>();

  // Helper to add an alias for an answer
  const addAlias = (answerIndex: number) => {
    const current = getValues(`content.answers.${answerIndex}.aliases`) || [];
    setValue(`content.answers.${answerIndex}.aliases`, [...current, ""], {
      shouldValidate: true,
    });
  };

  // Helper to remove an alias
  const removeAlias = (answerIndex: number, aliasIndex: number) => {
    const current = getValues(`content.answers.${answerIndex}.aliases`) || [];
    setValue(
      `content.answers.${answerIndex}.aliases`,
      current.filter((_, i) => i !== aliasIndex),
      { shouldValidate: true }
    );
  };

  // Helper to update an alias
  const updateAlias = (
    answerIndex: number,
    aliasIndex: number,
    value: string
  ) => {
    const current = getValues(`content.answers.${answerIndex}.aliases`) || [];
    const updated = [...current];
    updated[aliasIndex] = value;
    setValue(`content.answers.${answerIndex}.aliases`, updated, {
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* List Title */}
      <FormField
        control={control}
        name="content.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>List Title</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Top 10 Premier League All-Time Goalscorers"
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Category (optional) */}
      <FormField
        control={control}
        name="content.category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category (optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Premier League, World Cup, Champions League"
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Used for display and filtering purposes
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Answers */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-floodlight">
          Top 10 Answers (Rank Order)
        </h3>

        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((answerIndex) => {
          const aliases = watch(`content.answers.${answerIndex}.aliases`) || [];

          return (
            <div key={answerIndex} className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={answerIndex === 9 ? "warning" : "outline"}
                  className="w-8 justify-center"
                >
                  #{answerIndex + 1}
                </Badge>
                {answerIndex === 9 && (
                  <span className="text-xs text-card-yellow">Jackpot!</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Main Name */}
                <FormField
                  control={control}
                  name={`content.answers.${answerIndex}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Alan Shearer"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info/Stat */}
                <FormField
                  control={control}
                  name={`content.answers.${answerIndex}.info`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Info (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 260 goals"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Aliases */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Aliases (alternative accepted names)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => addAlias(answerIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Alias
                  </Button>
                </div>

                {aliases.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aliases.map((alias, aliasIndex) => (
                      <div
                        key={aliasIndex}
                        className="flex items-center gap-1"
                      >
                        <Input
                          value={alias}
                          onChange={(e) =>
                            updateAlias(answerIndex, aliasIndex, e.target.value)
                          }
                          placeholder="Alias"
                          className="h-7 w-32 text-xs bg-white/5 border-white/10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeAlias(answerIndex, aliasIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
