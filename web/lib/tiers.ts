/**
 * Tier data for the landing page, ported from the mobile app's tierProgression.ts.
 * Colors are hardcoded hex values (mobile uses theme imports).
 */

export interface IQTier {
  tier: number;
  name: string;
  minPoints: number;
  maxPoints: number | null;
}

export const IQ_TIERS: IQTier[] = [
  { tier: 1, name: "Trialist", minPoints: 0, maxPoints: 24 },
  { tier: 2, name: "Youth Team", minPoints: 25, maxPoints: 99 },
  { tier: 3, name: "Reserve Team", minPoints: 100, maxPoints: 249 },
  { tier: 4, name: "Impact Sub", minPoints: 250, maxPoints: 499 },
  { tier: 5, name: "Rotation Player", minPoints: 500, maxPoints: 999 },
  { tier: 6, name: "First Team Regular", minPoints: 1000, maxPoints: 1999 },
  { tier: 7, name: "Key Player", minPoints: 2000, maxPoints: 3999 },
  { tier: 8, name: "Club Legend", minPoints: 4000, maxPoints: 7999 },
  { tier: 9, name: "National Treasure", minPoints: 8000, maxPoints: 19999 },
  { tier: 10, name: "GOAT", minPoints: 20000, maxPoints: null },
];

export const TIER_COLORS: Record<number, string> = {
  1: "#94A3B8", // Trialist - muted gray
  2: "#6B7280", // Youth Team - gray
  3: "#3B82F6", // Reserve Team - blue
  4: "#22C55E", // Impact Sub - green
  5: "#58CC02", // Rotation Player - pitch green
  6: "#58CC02", // First Team Regular - pitch green
  7: "#FACC15", // Key Player - yellow
  8: "#F59E0B", // Club Legend - amber
  9: "#F97316", // National Treasure - orange
  10: "#FFD700", // GOAT - gold
};
