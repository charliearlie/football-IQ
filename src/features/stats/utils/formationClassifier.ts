import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GameProficiency } from '../types/stats.types';
import { FormationClassification, FormationClassificationResult } from '../types/scoutReport.types';

// Mode groups for classification
const SCOUT_MODES: GameMode[] = ['career_path', 'career_path_pro', 'guess_the_transfer'];
const PUNDIT_MODES: GameMode[] = ['topical_quiz', 'top_tens', 'guess_the_goalscorers'];

const FORMATION_DESCRIPTIONS: Record<FormationClassification, string> = {
  'Total Football': 'No weak spots — reads the game from every angle.',
  'The Scout': 'Eye for talent, market knowledge, career instinct.',
  'The Pundit': 'Deep knowledge of stats, records, and current form.',
  'The Specialist': 'Exceptional in one area, developing elsewhere.',
};

/**
 * Classify the user's knowledge profile into a named formation.
 */
export function classifyFormation(proficiencies: GameProficiency[]): FormationClassificationResult {
  const played = proficiencies.filter(p => p.gamesPlayed > 0);

  // Default for new users
  if (played.length < 2) {
    return { label: 'The Specialist', description: FORMATION_DESCRIPTIONS['The Specialist'] };
  }

  const percentages = played.map(p => p.percentage);
  const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;

  // Coefficient of variation - how spread out are the scores?
  const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Even coverage across 4+ modes = Total Football
  if (cv < 0.25 && played.length >= 4) {
    return { label: 'Total Football', description: FORMATION_DESCRIPTIONS['Total Football'] };
  }

  // Check if top modes are concentrated in Scout or Pundit groups
  const sortedByAccuracy = [...played].sort((a, b) => b.percentage - a.percentage);
  const topTwo = sortedByAccuracy.slice(0, 2).map(p => p.gameMode);

  const scoutCount = topTwo.filter(m => SCOUT_MODES.includes(m)).length;
  const punditCount = topTwo.filter(m => PUNDIT_MODES.includes(m)).length;

  if (scoutCount >= 2) {
    return { label: 'The Scout', description: FORMATION_DESCRIPTIONS['The Scout'] };
  }
  if (punditCount >= 2) {
    return { label: 'The Pundit', description: FORMATION_DESCRIPTIONS['The Pundit'] };
  }

  // Check for specialist pattern: 1-2 modes dominate (>70%) while rest are low (<40%)
  const highModes = played.filter(p => p.percentage >= 70);
  const lowModes = played.filter(p => p.percentage < 40);
  if (highModes.length <= 2 && lowModes.length >= 2) {
    return { label: 'The Specialist', description: FORMATION_DESCRIPTIONS['The Specialist'] };
  }

  // Fallback: if moderate spread, classify based on where the top mode falls
  if (topTwo.some(m => SCOUT_MODES.includes(m))) {
    return { label: 'The Scout', description: FORMATION_DESCRIPTIONS['The Scout'] };
  }
  if (topTwo.some(m => PUNDIT_MODES.includes(m))) {
    return { label: 'The Pundit', description: FORMATION_DESCRIPTIONS['The Pundit'] };
  }

  return { label: 'Total Football', description: FORMATION_DESCRIPTIONS['Total Football'] };
}
