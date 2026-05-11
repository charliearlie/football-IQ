import type { StatType } from "./types";

/**
 * Format a stat value for display based on its type.
 * Transfer fees get currency formatting (€Xm); all others are locale integers.
 */
export function formatStatValue(value: number, statType: StatType): string {
  if (statType === "transfer_fee") {
    return `€${value}m`;
  }
  return value.toLocaleString("en-GB");
}
