"use client";

import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
} from "@/components/ui/form";
import { goalscorerRecallContentSchema } from "@/lib/schemas";

import type { GoalscorerRecallContent } from "@/lib/schemas";

interface FormValues {
  content: GoalscorerRecallContent;
}

export function GoalscorerRecallForm() {
  const { control, setValue, trigger } = useFormContext<FormValues>();
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "content.goals",
  });

  function handleJsonImport() {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = goalscorerRecallContentSchema.safeParse(parsed);
      if (!result.success) {
        setJsonError(result.error.issues.map((i) => i.message).join(", "));
        return;
      }
      const data = result.data;
      setValue("content.home_team", data.home_team);
      setValue("content.away_team", data.away_team);
      setValue("content.home_score", data.home_score);
      setValue("content.away_score", data.away_score);
      setValue("content.competition", data.competition);
      setValue("content.match_date", data.match_date);
      replace(data.goals);
      trigger("content");
      setJsonInput("");
      setJsonMode(false);
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setJsonMode(!jsonMode)}
        >
          {jsonMode ? "Manual Input" : "Paste JSON"}
        </Button>
      </div>

      {jsonMode ? (
        <div className="space-y-3">
          <FormDescription>
            Paste the goalscorer recall JSON below and click Import.
          </FormDescription>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={'{\n  "home_team": "Liverpool",\n  "away_team": "Barcelona",\n  "home_score": 4,\n  "away_score": 0,\n  "competition": "Champions League SF",\n  "match_date": "7 May 2019",\n  "goals": [\n    { "scorer": "Divock Origi", "minute": 7, "team": "home" },\n    { "scorer": "Georginio Wijnaldum", "minute": 54, "team": "home" },\n    { "scorer": "Georginio Wijnaldum", "minute": 56, "team": "home" },\n    { "scorer": "Divock Origi", "minute": 79, "team": "home" }\n  ]\n}'}
            rows={14}
            className="bg-white/5 border-white/10 font-mono text-sm"
          />
          {jsonError && (
            <p className="text-sm text-destructive">{jsonError}</p>
          )}
          <Button type="button" onClick={handleJsonImport}>
            Import JSON
          </Button>
        </div>
      ) : (
      <>
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
      </>
      )}
    </div>
  );
}
