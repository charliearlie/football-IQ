"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getGridSchedule, publishGrid } from "../actions";
import type { GeneratedGrid, CellSolvability } from "../_lib/types";
import type { ScheduleDay } from "../actions";

interface PublishGridModalProps {
  grid: GeneratedGrid;
  solvability: CellSolvability[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishGridModal({
  grid,
  solvability,
  open,
  onOpenChange,
}: PublishGridModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch schedule when modal opens
  useEffect(() => {
    if (!open) {
      setPublishError(null);
      setPublishSuccess(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    startTransition(async () => {
      const result = await getGridSchedule(today, 7);
      if (result.success && result.data) {
        setSchedule(result.data);
        // Default to first open date
        const firstOpen = result.data.find((d) => !d.hasGrid);
        if (firstOpen) setSelectedDate(firstOpen.date);
      }
    });
  }, [open]);

  const allCellsSolvable = solvability.every((s) => s.playerCount > 0);

  const handlePublish = () => {
    if (!selectedDate) return;
    setPublishError(null);

    startTransition(async () => {
      const result = await publishGrid(
        grid,
        selectedDate,
        title || undefined,
        description || undefined
      );

      if (result.success) {
        setPublishSuccess(true);
      } else {
        setPublishError(result.error ?? "Publish failed");
      }
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (publishSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Grid Published
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="text-4xl mb-3">&#9917;</div>
            <p className="text-slate-300">
              Grid scheduled for{" "}
              <span className="font-semibold text-[#58CC02]">
                {formatDate(selectedDate)}
              </span>
            </p>
          </div>
          <DialogFooter>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Publish Grid</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Schedule Window */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
              Next 7 Days
            </label>
            <div className="grid grid-cols-7 gap-1">
              {schedule.map((day) => (
                <button
                  key={day.date}
                  onClick={() => !day.hasGrid && setSelectedDate(day.date)}
                  disabled={day.hasGrid}
                  className={`flex flex-col items-center py-2 px-1 rounded-md text-xs transition-colors ${
                    selectedDate === day.date
                      ? "bg-[#58CC02]/20 border border-[#58CC02]/50 text-[#58CC02]"
                      : day.hasGrid
                        ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  }`}
                >
                  <span className="font-medium">
                    {new Date(day.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "narrow" }
                    )}
                  </span>
                  <span className="text-[10px] mt-0.5">
                    {new Date(day.date + "T12:00:00").getDate()}
                  </span>
                  <span
                    className={`text-[9px] mt-1 font-medium ${
                      day.hasGrid ? "text-red-400" : "text-[#58CC02]"
                    }`}
                  >
                    {day.hasGrid ? "TAKEN" : "OPEN"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date picker fallback for dates beyond 7 days */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
              Or pick a date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/5 border-white/10 text-slate-200"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
              Title (optional)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. El Clasico Special"
              className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 block">
              Description (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the grid theme..."
              rows={2}
              className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600"
            />
          </div>

          {publishError && (
            <p className="text-sm text-red-400">{publishError}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={!selectedDate || !allCellsSolvable || isPending}
            className="px-4 py-2 bg-[#58CC02] hover:bg-[#46A302] text-[#0F172A] font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Publishing..." : "Publish"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
