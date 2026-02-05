"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FlagIcon } from "@/components/ui/flag-icon";
import type { TransferGuessContent } from "@/lib/schemas";

interface TransferGuessPreviewProps {
  content: unknown;
}

export function TransferGuessPreview({ content }: TransferGuessPreviewProps) {
  const data = content as TransferGuessContent;

  if (!data?.from_club && !data?.to_club) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add transfer details to see preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">Transfer Guess</h3>
        <p className="text-sm text-muted-foreground">
          Identify the player from this transfer
        </p>
      </div>

      {/* Transfer Card */}
      <div className="glass-card p-4 space-y-4">
        {/* Clubs */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🏟️</span>
            </div>
            <p className="font-medium text-floodlight text-sm">
              {data.from_club || "From Club"}
            </p>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground" />

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🏟️</span>
            </div>
            <p className="font-medium text-floodlight text-sm">
              {data.to_club || "To Club"}
            </p>
          </div>
        </div>

        {/* Fee */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="secondary">{data.fee || "Fee"}</Badge>
        </div>
      </div>

      {/* Hints Preview */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Hints (revealed on request)
        </p>

        {data.hints?.map((hint, index) => (
          <div
            key={index}
            className="glass-card p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {index + 1}
              </Badge>
              <span className="text-sm text-floodlight">
                {["Nationality", "Position", "Achievement"][index]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hint ? (
                <>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  {index === 2 ? (
                    <FlagIcon code={hint} size={16} />
                  ) : (
                    <span className="text-sm text-muted-foreground">{hint}</span>
                  )}
                </>
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
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
    </div>
  );
}
