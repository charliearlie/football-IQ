"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
} from "@/components/ui/form";

import type { StartingXIContent, FormationName } from "@/lib/schemas";
import { FORMATION_POSITIONS } from "@/lib/schemas";

interface FormValues {
  content: StartingXIContent;
}

const FORMATIONS: { value: FormationName; label: string }[] = [
  { value: "4-3-3", label: "4-3-3" },
  { value: "4-2-3-1", label: "4-2-3-1" },
  { value: "4-4-2", label: "4-4-2" },
  { value: "4-4-1-1", label: "4-4-1-1" },
  { value: "3-5-2", label: "3-5-2" },
  { value: "3-4-3", label: "3-4-3" },
  { value: "5-3-2", label: "5-3-2" },
  { value: "5-4-1", label: "5-4-1" },
  { value: "4-1-4-1", label: "4-1-4-1" },
  { value: "4-3-2-1", label: "4-3-2-1" },
];

export function StartingXIForm() {
  const { control, setValue, getValues, watch } = useFormContext<FormValues>();

  const formation = useWatch({ control, name: "content.formation" });
  const players = watch("content.players");

  // Update player positions when formation changes
  useEffect(() => {
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS["4-3-3"];
    const currentPlayers = getValues("content.players") || [];

    // Update position keys for each player while preserving names
    const updatedPlayers = positions.map((posKey, index) => ({
      position_key: posKey as StartingXIContent["players"][0]["position_key"],
      player_name: currentPlayers[index]?.player_name || "",
      is_hidden: currentPlayers[index]?.is_hidden || false,
      override_x: null,
      override_y: null,
    }));

    setValue("content.players", updatedPlayers);
  }, [formation, setValue, getValues]);

  const hiddenCount = players?.filter((p) => p.is_hidden).length || 0;

  return (
    <div className="space-y-6">
      {/* Match Info */}
      <div className="glass-card p-4 space-y-4">
        <h3 className="text-sm font-medium text-floodlight">Match Information</h3>

        <FormField
          control={control}
          name="content.match_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Liverpool 4-0 Barcelona"
                  className="bg-white/5 border-white/10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="content.team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
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
            name="content.formation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formation</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORMATIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Players */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-floodlight">
            Starting XI ({formation})
          </h3>
          <Badge variant={hiddenCount > 0 ? "success" : "outline"}>
            {hiddenCount} hidden
          </Badge>
        </div>

        <FormDescription className="text-xs">
          Mark players as &quot;hidden&quot; for users to guess. Recommended: 3-5 hidden players.
        </FormDescription>

        <div className="space-y-2">
          {players?.map((player, index) => (
            <div
              key={index}
              className="glass-card p-3 flex items-center gap-4"
            >
              <Badge variant="outline" className="w-14 justify-center text-xs">
                {player.position_key}
              </Badge>

              <FormField
                control={control}
                name={`content.players.${index}.player_name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Player name"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`content.players.${index}.is_hidden`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                      Hidden
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
