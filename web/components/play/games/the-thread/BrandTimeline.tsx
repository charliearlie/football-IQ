"use client";

import { cn } from "@/lib/utils";
import type { ThreadBrand } from "@/lib/schemas/puzzle-schemas";

interface BrandTimelineProps {
  brands: ThreadBrand[];
  /** How many hidden brands the player has revealed (0-3). */
  hintsRevealed: number;
  /** When the game is over, all hidden brands are unmasked. */
  gameOver: boolean;
}

/**
 * Renders the brand chronology. Hidden cells progressively unmask as
 * hints are revealed (or when the game ends).
 */
export function BrandTimeline({ brands, hintsRevealed, gameOver }: BrandTimelineProps) {
  let hiddenSeen = 0;

  return (
    <ol className="space-y-2">
      {brands.map((brand, idx) => {
        const isHidden = brand.is_hidden ?? false;
        let unmasked = !isHidden;
        if (isHidden) {
          hiddenSeen++;
          unmasked = gameOver || hiddenSeen <= hintsRevealed;
        }
        return (
          <li
            key={`${brand.brand_name}-${idx}`}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              unmasked
                ? "bg-white/[0.04] border-white/10"
                : "bg-white/[0.02] border-dashed border-white/10"
            )}
          >
            <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 text-xs font-bold text-white/70">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-semibold truncate",
                  unmasked ? "text-floodlight" : "text-white/30"
                )}
              >
                {unmasked ? brand.brand_name : "???"}
              </p>
              <p className="text-xs text-white/50">{brand.years}</p>
            </div>
            {!unmasked && (
              <span className="text-xs text-white/40 shrink-0">Hidden</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
