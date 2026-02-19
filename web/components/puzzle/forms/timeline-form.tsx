"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import type { TimelineContent } from "@/lib/schemas";

interface FormValues {
  content: TimelineContent;
}

export function TimelineForm() {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="space-y-6">
      {/* Title / Theme */}
      <FormField
        control={control}
        name="content.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title / Theme</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder='e.g., "Premier League Moments"'
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Shown as the header. Leave blank if using Subject below.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Subject Name */}
      <FormField
        control={control}
        name="content.subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder='e.g., "Lionel Messi" (for player career timelines)'
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormDescription className="text-xs">
              Shows as &ldquo;CAREER OF &middot; NAME&rdquo;. Title takes priority if both set.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Subject ID */}
      <FormField
        control={control}
        name="content.subject_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subject ID (optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder='e.g., "Q615"'
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Events */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-floodlight">
          Events (chronological order)
        </h3>

        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="rounded-md border border-white/10 bg-white/[0.03] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                {index + 1}
              </Badge>
              <span className="text-sm font-medium text-floodlight">
                Event {index + 1}
              </span>
            </div>

            {/* Description */}
            <FormField
              control={control}
              name={`content.events.${index}.text`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Description *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='e.g., "Joined Barcelona youth academy"'
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year + Month row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`content.events.${index}.year`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Year *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
                        placeholder="2000"
                        min={1900}
                        max={2100}
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`content.events.${index}.month`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Month</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="1-12"
                        min={1}
                        max={12}
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
