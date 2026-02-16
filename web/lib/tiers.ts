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
  { tier: 1, name: "Intern", minPoints: 0, maxPoints: 24 },
  { tier: 2, name: "Match Analyst", minPoints: 25, maxPoints: 99 },
  { tier: 3, name: "Scout", minPoints: 100, maxPoints: 249 },
  { tier: 4, name: "Tactical Analyst", minPoints: 250, maxPoints: 499 },
  { tier: 5, name: "Chief Scout", minPoints: 500, maxPoints: 999 },
  { tier: 6, name: "Head of Analysis", minPoints: 1000, maxPoints: 1999 },
  { tier: 7, name: "Head of Recruitment", minPoints: 2000, maxPoints: 3999 },
  { tier: 8, name: "Technical Director", minPoints: 4000, maxPoints: 7999 },
  { tier: 9, name: "Director of Football", minPoints: 8000, maxPoints: 19999 },
  { tier: 10, name: "The Gaffer", minPoints: 20000, maxPoints: null },
];

export const TIER_COLORS: Record<number, string> = {
  1: "#94A3B8", // Intern - muted gray
  2: "#6B7280", // Match Analyst - gray
  3: "#3B82F6", // Scout - blue
  4: "#22C55E", // Tactical Analyst - green
  5: "#58CC02", // Chief Scout - pitch green
  6: "#58CC02", // Head of Analysis - pitch green
  7: "#FACC15", // Head of Recruitment - yellow
  8: "#F59E0B", // Technical Director - amber
  9: "#F97316", // Director of Football - orange
  10: "#FFD700", // The Gaffer - gold
};
