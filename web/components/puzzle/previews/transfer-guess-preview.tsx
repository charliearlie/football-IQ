"use client";

import { Badge } from "@/components/ui/badge";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FlagIcon } from "@/components/ui/flag-icon";
import type { TransferGuessContent } from "@/lib/schemas";

interface TransferGuessPreviewProps {
  content: unknown;
}

function getAbbreviation(clubName: string, abbreviation?: string): string {
  if (abbreviation) return abbreviation.toUpperCase();
  return clubName.slice(0, 3).toUpperCase();
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

  const fromAbbr = getAbbreviation(data.from_club || "", data.from_club_abbreviation);
  const toAbbr = getAbbreviation(data.to_club || "", data.to_club_abbreviation);
  const fromColor = data.from_club_color || undefined;
  const toColor = data.to_club_color || undefined;

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
        {/* Fee */}
        {data.fee && (
          <div className="text-center mb-2">
            <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold mb-1">
              Transfer Fee
            </p>
            <p className="text-2xl font-bold text-floodlight font-display">
              {data.fee}
            </p>
          </div>
        )}

        {/* Clubs */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: fromColor || "rgba(255,255,255,0.1)",
                backgroundColor: fromColor ? `${fromColor}15` : "rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="text-lg font-display font-bold"
                style={{ color: fromColor || "rgba(248,250,252,0.7)" }}
              >
                {fromAbbr}
              </span>
            </div>
            <p className="font-medium text-floodlight text-xs uppercase">
              {data.from_club || "From Club"}
            </p>
          </div>

          <ArrowRight className="h-5 w-5 text-green-500" />

          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-2 mx-auto"
              style={{
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: toColor || "rgba(255,255,255,0.1)",
                backgroundColor: toColor ? `${toColor}15` : "rgba(255,255,255,0.05)",
              }}
            >
              <span
                className="text-lg font-display font-bold"
                style={{ color: toColor || "rgba(248,250,252,0.7)" }}
              >
                {toAbbr}
              </span>
            </div>
            <p className="font-medium text-floodlight text-xs uppercase">
              {data.to_club || "To Club"}
            </p>
          </div>
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
                {["Year", "Position", "Nationality"][index]}
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
