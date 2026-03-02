/**
 * Type definitions for the Scout Report upgrade features.
 *
 * These types support the Form Guide, Scouting Verdict, Strength/Weakness
 * analysis, Monthly Report, Formation Classification, Milestones, and
 * other enhanced Scout Report features.
 */

import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { IQTier } from '../utils/tierProgression';

// ─── Form Guide ──────────────────────────────────────────────────

export type FormGuideResult = 'perfect' | 'completed' | 'failed';

export interface FormGuideEntry {
  gameMode: GameMode;
  result: FormGuideResult;
  completedAt: string;
}

// ─── Strength / Weakness ─────────────────────────────────────────

export interface StrengthWeaknessItem {
  mode: GameMode;
  accuracy: number;
  flavourText: string;
}

export interface StrengthWeaknessAnalysis {
  strength: StrengthWeaknessItem;
  weakness: StrengthWeaknessItem;
}

// ─── Monthly Report ──────────────────────────────────────────────

export interface MonthReport {
  gamesPlayed: number;
  perfectScores: number;
  iqEarned: number;
  daysPlayed: number;
  totalDaysInMonth: number;
  monthLabel: string;
}

// ─── Formation Classification ────────────────────────────────────

export type FormationClassification =
  | 'Total Football'
  | 'The Scout'
  | 'The Pundit'
  | 'The Specialist';

export interface FormationClassificationResult {
  label: FormationClassification;
  description: string;
}

// ─── Next Milestone ──────────────────────────────────────────────

export type MilestoneType = 'streak' | 'perfects' | 'games';

export interface MilestoneInfo {
  type: MilestoneType;
  current: number;
  target: number;
  label: string;
  distance: number;
}

// ─── Best Day ────────────────────────────────────────────────────

export interface BestDayInfo {
  date: string;
  perfectCount: number;
  totalGames: number;
}

// ─── Weak Spot ───────────────────────────────────────────────────

export interface WeakSpotInfo {
  mode: GameMode;
  displayName: string;
  accuracy: number;
}

// ─── Scouting Verdict ────────────────────────────────────────────

export type StreakCategory = 'high' | 'medium' | 'low';
export type Trajectory = 'improving' | 'declining' | 'stable';

export interface VerdictInput {
  tier: IQTier;
  dominantMode: GameMode | null;
  secondMode: GameMode | null;
  formationLabel: FormationClassification;
  streakCategory: StreakCategory;
  trajectory: Trajectory;
  perfectRate: number;
  totalGames: number;
  strengthMode: GameMode | null;
  weaknessMode: GameMode | null;
}

// ─── Career Timeline ─────────────────────────────────────────────

export interface TierHistoryEntry {
  id: number;
  tierNumber: number;
  tierName: string;
  reachedAt: string;
  totalIqAtTransition: number;
}
