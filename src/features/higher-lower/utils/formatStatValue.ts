/**
 * Format a stat value for display based on the stat type.
 *
 * Transfer fees get currency formatting (€Xm).
 * All other stats are plain locale-formatted integers.
 */

import type { StatType } from '../types/higherLower.types';

export function formatStatValue(value: number, statType: StatType): string {
  if (statType === 'transfer_fee') {
    return `€${value}m`;
  }
  return value.toLocaleString('en-GB');
}
