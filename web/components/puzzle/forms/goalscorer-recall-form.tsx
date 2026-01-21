"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import type { GoalscorerRecallContent } from "@/lib/schemas";

interface FormValues {
  content: GoalscorerRecallContent;
}

export function GoalscorerRecallForm() {
  const { control } = useFormContext<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.goals",
  });

  return (
    <div className="space-y-6">
      {/* Match Info */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">Match Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="content.home_team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Team</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Liverpool"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="content.away_team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Away Team</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Barcelona"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="content.home_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Home Score</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="content.away_score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Away Score</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="content.competition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competition</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., Champions League SF"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="content.match_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Date</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., 7 May 2019"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-floodlight">
            Goals ({fields.length})
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ scorer: "", minute: 1, team: "home", isOwnGoal: false })
            }
            className="border-white/10"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Goal
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-floodlight">
                  Goal {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-card"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={control}
                  name={`content.goals.${index}.scorer`}
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs text-muted-foreground">Scorer</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Mohamed Salah"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`content.goals.${index}.minute`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Minute</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          max={120}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-4">
                <FormField
                  control={control}
                  name={`content.goals.${index}.team`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs text-muted-foreground">Team</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`content.goals.${index}.isOwnGoal`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs text-muted-foreground cursor-pointer">
                        Own Goal
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
