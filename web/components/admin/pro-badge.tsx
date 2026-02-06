import { Badge } from "@/components/ui/badge";

/**
 * Pro Badge component for elite players.
 * Displays a gold (#FFBF00) badge indicating the player is in the top ~5000 by scout_rank.
 */
export function ProBadge() {
  return (
    <Badge
      data-testid="pro-badge"
      className="bg-[#FFBF00] text-stadium-navy border-[#FFBF00] font-bold hover:bg-[#FFBF00]/90"
    >
      PRO
    </Badge>
  );
}

/**
 * Elite threshold constant.
 * Players with scout_rank >= this value are considered "elite" and show the Pro Badge.
 * Based on top ~5000 players by Wikipedia sitelinks count.
 */
export const ELITE_THRESHOLD = 50;

/**
 * Check if a player is elite based on their scout_rank.
 */
export function isElitePlayer(scoutRank: number | null | undefined): boolean {
  return (scoutRank ?? 0) >= ELITE_THRESHOLD;
}
