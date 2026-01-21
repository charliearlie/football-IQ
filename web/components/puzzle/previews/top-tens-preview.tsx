"use client";

import { Badge } from "@/components/ui/badge";
import { Crown, Trophy } from "lucide-react";
import type { TopTensContent } from "@/lib/schemas";

interface TopTensPreviewProps {
  content: unknown;
}

// Progressive scoring tiers
const TIER_POINTS = [1, 1, 2, 2, 3, 3, 4, 4, 5, 8];

export function TopTensPreview({ content }: TopTensPreviewProps) {
  const data = content as TopTensContent;

  if (!data?.answers?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add answers to see preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Crown className="h-5 w-5 text-card-yellow" />
          <h3 className="text-lg font-bold text-floodlight">Top Tens</h3>
        </div>
        <p className="text-sm text-card-yellow font-medium">
          {data.title || "List Title"}
        </p>
        {data.category && (
          <Badge variant="outline" className="mt-1 text-xs">
            {data.category}
          </Badge>
        )}
      </div>

      {/* Answers List */}
      <div className="space-y-2">
        {data.answers.map((answer, index) => {
          const isJackpot = index === 9;
          const points = TIER_POINTS[index];

          return (
            <div
              key={index}
              className={`glass-card p-3 flex items-center gap-3 ${
                isJackpot ? "border-card-yellow" : ""
              }`}
            >
              {/* Rank */}
              <Badge
                variant={isJackpot ? "warning" : "outline"}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {index + 1}
              </Badge>

              {/* Answer */}
              <div className="flex-1">
                <p className="font-medium text-floodlight">
                  {answer.name || `Answer ${index + 1}`}
                </p>
                {answer.info && (
                  <p className="text-xs text-muted-foreground">{answer.info}</p>
                )}
                {answer.aliases && answer.aliases.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Also: {answer.aliases.filter((a) => a).join(", ")}
                  </p>
                )}
              </div>

              {/* Points */}
              <div className="text-right">
                <Badge variant={isJackpot ? "warning" : "secondary"}>
                  +{points}
                </Badge>
                {isJackpot && (
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy className="h-3 w-3 text-card-yellow" />
                    <span className="text-xs text-card-yellow">Jackpot!</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scoring Info */}
      <div className="text-center space-y-1">
        <div className="text-xs text-muted-foreground">
          Progressive Scoring: 1, 1, 2, 2, 3, 3, 4, 4, 5, 8
        </div>
        <div className="text-xs text-muted-foreground">
          Max Score: 30 points (find all 10)
        </div>
      </div>
    </div>
  );
}
