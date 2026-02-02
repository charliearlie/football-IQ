"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CountryAutocomplete } from "@/components/ui/country-autocomplete";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { transferGuessContentSchema } from "@/lib/schemas";

import type { TransferGuessContent } from "@/lib/schemas";

interface FormValues {
  content: TransferGuessContent;
}

export function TransferGuessForm() {
  const { control, setValue, trigger } = useFormContext<FormValues>();
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  function handleJsonImport() {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const result = transferGuessContentSchema.safeParse(parsed);
      if (!result.success) {
        setJsonError(result.error.issues.map((i) => i.message).join(", "));
        return;
      }
      const data = result.data;
      setValue("content.answer", data.answer);
      setValue("content.from_club", data.from_club);
      setValue("content.to_club", data.to_club);
      setValue("content.fee", data.fee);
      setValue("content.hints.0", data.hints[0]);
      setValue("content.hints.1", data.hints[1]);
      setValue("content.hints.2", data.hints[2]);
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
            Paste the transfer guess JSON below and click Import.
          </FormDescription>
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={'{\n  "answer": "Eden Hazard",\n  "from_club": "Chelsea",\n  "to_club": "Real Madrid",\n  "fee": "€100M",\n  "hints": ["2019", "ATT", "BE"]\n}'}
            rows={10}
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
                    placeholder="e.g., Eden Hazard"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Transfer Details */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-medium text-floodlight">Transfer Details</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* From Club */}
              <FormField
                control={control}
                name="content.from_club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Club</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Chelsea"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* To Club */}
              <FormField
                control={control}
                name="content.to_club"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Club</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Real Madrid"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fee */}
            <FormField
              control={control}
              name="content.fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Fee</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., €100M, Free, Undisclosed"
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Hints */}
          <div className="glass-card p-4 space-y-4">
            <h3 className="text-sm font-medium text-floodlight">Hints (Revealed on Request)</h3>
            <FormDescription className="text-xs">
              These hints are revealed one at a time when the player requests help.
            </FormDescription>

            {/* Hint 1: Transfer Year */}
            <FormField
              control={control}
              name="content.hints.0"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint 1: Transfer Year</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 2019, 2023"
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hint 2: Position */}
            <FormField
              control={control}
              name="content.hints.1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint 2: Position</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., ATT, MID, DEF, GK"
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hint 3: Nationality */}
            <FormField
              control={control}
              name="content.hints.2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint 3: Nationality</FormLabel>
                  <FormControl>
                    <CountryAutocomplete
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Search country..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
