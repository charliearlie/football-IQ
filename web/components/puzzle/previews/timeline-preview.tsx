"use client";

import { Clock } from "lucide-react";
import type { TimelineContent } from "@/lib/schemas";

interface TimelinePreviewProps {
  content: unknown;
}

export function TimelinePreview({ content }: TimelinePreviewProps) {
  const data = content as TimelineContent;

  if (!data?.events?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add events to see preview
      </div>
    );
  }

  const heading = data.title || (data.subject ? `Career of ${data.subject}` : null);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-card-yellow" />
          <h3 className="text-lg font-bold text-floodlight">Timeline</h3>
        </div>
        {heading && (
          <p className="text-sm text-card-yellow font-medium uppercase tracking-wide">
            {heading}
          </p>
        )}
      </div>

      {/* Events */}
      <div className="space-y-2 relative">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/10" />

        {data.events.map((event, index) => {
          const hasText = event.text?.trim();

          return (
            <div
              key={index}
              className="relative pl-10 py-2"
            >
              {/* Timeline dot */}
              <div className="absolute left-[14px] top-[14px] w-[9px] h-[9px] rounded-full bg-white/60 ring-2 ring-white/20" />

              <div className="glass-card p-3">
                <span className="text-xs font-mono text-muted-foreground">
                  {event.year || "????"}
                  {event.month ? `.${String(event.month).padStart(2, "0")}` : ""}
                </span>
                <p className={`text-sm mt-1 ${hasText ? "text-floodlight" : "text-muted-foreground italic"}`}>
                  {hasText ? event.text : `Event ${index + 1}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring Info */}
      <div className="text-center space-y-1">
        <div className="text-xs text-muted-foreground">
          Place 6 events in chronological order
        </div>
        <div className="text-xs text-muted-foreground">
          +20 IQ per correct placement on first attempt
        </div>
      </div>
    </div>
  );
}
