"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerGeneration } from "@/app/(dashboard)/admin/blog/actions";
import { Loader2, Zap } from "lucide-react";

export function ManualGenerate() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!date) return;
    startTransition(async () => {
      const result = await triggerGeneration(date);
      if (result.success) {
        toast.success(
          `Generation started for ${date} — the article will appear in the list below. Refresh the page in a few minutes.`
        );
      } else {
        toast.error(result.error ?? "Generation failed");
      }
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="space-y-1.5">
        <label
          htmlFor="generate-date"
          className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50"
        >
          Match Date
        </label>
        <input
          id="generate-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={today}
          className="block rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-floodlight focus:border-pitch-green focus:outline-none focus:ring-1 focus:ring-pitch-green"
        />
      </div>
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={isPending || !date}
        className="bg-pitch-green/20 text-pitch-green hover:bg-pitch-green/30 border border-pitch-green/30"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        {isPending ? "Generating..." : "Generate Article"}
      </Button>
      {isPending && (
        <p className="text-xs text-muted-foreground">
          Pipeline running — fetching data, researching, writing, and reviewing. This can take 2-4 minutes.
        </p>
      )}
    </div>
  );
}
