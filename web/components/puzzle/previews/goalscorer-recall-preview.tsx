"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { GoalscorerRecallContent } from "@/lib/schemas";

interface GoalscorerRecallPreviewProps {
  content: unknown;
}

export function GoalscorerRecallPreview({ content }: GoalscorerRecallPreviewProps) {
  const data = content as GoalscorerRecallContent;

  if (!data?.home_team && !data?.away_team) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add match details to see preview
      </div>
    );
  }

  const homeGoals = data.goals?.filter((g) => g.team === "home") || [];
  const awayGoals = data.goals?.filter((g) => g.team === "away") || [];
  const totalScorers = new Set(
    data.goals?.filter((g) => !g.isOwnGoal).map((g) => g.scorer)
  ).size;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">Goalscorer Recall</h3>
        <p className="text-sm text-muted-foreground">
          Name all the goalscorers in 60 seconds
        </p>
      </div>

      {/* Match Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {data.competition || "Competition"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {data.match_date || "Date"}
          </span>
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="text-center flex-1">
            <p className="font-bold text-floodlight">
              {data.home_team || "Home"}
            </p>
          </div>
          <div className="text-3xl font-bold text-floodlight">
            {data.home_score ?? 0} - {data.away_score ?? 0}
          </div>
          <div className="text-center flex-1">
            <p className="font-bold text-floodlight">
              {data.away_team || "Away"}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-card-yellow">
          <Clock className="h-4 w-4" />
          <span className="font-mono text-lg">60s</span>
        </div>
      </div>

      {/* Goals Timeline */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">
          Goals to find: {totalScorers}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Home Goals */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Home</p>
            {homeGoals.length > 0 ? (
              homeGoals.map((goal, index) => (
                <div
                  key={index}
                  className="glass-card p-2 flex items-center justify-between"
                >
                  <span className="text-sm text-floodlight">
                    {goal.scorer || "Scorer"}
                    {goal.isOwnGoal && " (OG)"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {goal.minute}&apos;
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No goals</p>
            )}
          </div>

          {/* Away Goals */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Away</p>
            {awayGoals.length > 0 ? (
              awayGoals.map((goal, index) => (
                <div
                  key={index}
                  className="glass-card p-2 flex items-center justify-between"
                >
                  <span className="text-sm text-floodlight">
                    {goal.scorer || "Scorer"}
                    {goal.isOwnGoal && " (OG)"}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {goal.minute}&apos;
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No goals</p>
            )}
          </div>
        </div>
      </div>

      {/* Scoring Info */}
      <div className="text-center text-xs text-muted-foreground">
        Max Score: {totalScorers} + 3 bonus = {totalScorers + 3} points
      </div>
    </div>
  );
}
