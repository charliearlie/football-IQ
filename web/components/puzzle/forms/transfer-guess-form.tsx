"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { CountryAutocomplete } from "@/components/ui/country-autocomplete";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import type { TransferGuessContent } from "@/lib/schemas";

interface FormValues {
  content: TransferGuessContent;
}

export function TransferGuessForm() {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="space-y-6">
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

        <div className="grid grid-cols-2 gap-4">
          {/* Year */}
          <FormField
            control={control}
            name="content.year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transfer Year</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1900}
                    max={2030}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="2019"
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
      </div>

      {/* Hints */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">Hints (Revealed on Request)</h3>
        <FormDescription className="text-xs">
          These hints are revealed one at a time when the player requests help.
        </FormDescription>

        {/* Hint 1: Shirt Number */}
        <FormField
          control={control}
          name="content.hints.0"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hint 1: Shirt Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., 10, 7, 9"
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
    </div>
  );
}
