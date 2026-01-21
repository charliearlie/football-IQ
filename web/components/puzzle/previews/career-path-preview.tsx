"use client";

import { Badge } from "@/components/ui/badge";
import type { CareerPathContent } from "@/lib/schemas";

interface CareerPathPreviewProps {
  content: unknown;
}

export function CareerPathPreview({ content }: CareerPathPreviewProps) {
  const data = content as CareerPathContent;

  if (!data?.career_steps?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add career steps to see preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">Career Path</h3>
        <p className="text-sm text-muted-foreground">
          Guess the player from their career history
        </p>
      </div>

      {/* Career Steps Preview */}
      <div className="space-y-2">
        {data.career_steps.map((step, index) => (
          <div
            key={index}
            className="glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Badge
                variant={index === 0 ? "success" : "outline"}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {index + 1}
              </Badge>
              <div>
                <p className="font-medium text-floodlight">
                  {step.text || "Club name"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{step.year || "Year"}</span>
                  {step.type === "loan" && (
                    <Badge variant="outline" className="text-xs">
                      Loan
                    </Badge>
                  )}
                  {(step.apps || step.goals) && (
                    <span>
                      {step.apps && `${step.apps} apps`}
                      {step.apps && step.goals && " • "}
                      {step.goals && `${step.goals} goals`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Preview */}
      {data.answer && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Answer
          </p>
          <div className="bg-pitch-green/20 border border-pitch-green rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-pitch-green">
              {data.answer}
            </span>
          </div>
        </div>
      )}

      {/* Score Preview */}
      <div className="text-center text-xs text-muted-foreground">
        Max Score: {data.career_steps.length} points
      </div>
    </div>
  );
}
