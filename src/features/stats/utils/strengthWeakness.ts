import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { DetailedModeStats } from '../types/stats.types';
import { StrengthWeaknessAnalysis } from '../types/scoutReport.types';

const MIN_GAMES_FOR_ANALYSIS = 5;

/**
 * Football-flavoured descriptions for each game mode.
 */
const MODE_FLAVOUR: Record<GameMode, { strengthText: string; weaknessText: string }> = {
  career_path: {
    strengthText: 'Reads careers like a seasoned chief scout.',
    weaknessText: 'Struggles to trace a player\'s journey.',
  },
  career_path_pro: {
    strengthText: 'An elite-level detective with an eye for the obscure.',
    weaknessText: 'The deeper cuts prove too tricky.',
  },
  guess_the_transfer: {
    strengthText: 'Thrives in transfer windows.',
    weaknessText: 'Lost in the transfer market.',
  },
  guess_the_goalscorers: {
    strengthText: 'Knows every goalscorer from memory.',
    weaknessText: 'Goalscoring records remain a blind spot.',
  },
  the_grid: {
    strengthText: 'A master of finding the overlap.',
    weaknessText: 'Grid connections don\'t come naturally.',
  },
  the_chain: {
    strengthText: 'Links players like a transfer broker.',
    weaknessText: 'The chain of connections breaks too easily.',
  },
  the_thread: {
    strengthText: 'A walking football fashion archive.',
    weaknessText: 'Kit history isn\'t a strong suit.',
  },
  topical_quiz: {
    strengthText: 'Always across the latest football news.',
    weaknessText: 'Current affairs tend to pass them by.',
  },
  top_tens: {
    strengthText: 'An encyclopaedic knowledge of the game\'s elite.',
    weaknessText: 'Ranking the greats isn\'t their forte.',
  },
  starting_xi: {
    strengthText: 'Can recall any starting lineup from memory.',
    weaknessText: 'Squad recall needs sharpening.',
  },
  connections: {
    strengthText: 'Spots hidden patterns instantly.',
    weaknessText: 'Group connections remain elusive.',
  },
  timeline: {
    strengthText: 'Has an innate sense of football chronology.',
    weaknessText: 'Timelines get tangled up.',
  },
  who_am_i: {
    strengthText: 'Identifies players from the smallest of clues.',
    weaknessText: 'Mystery clues prove too cryptic.',
  },
  balldle: {
    strengthText: 'Connects player attributes with remarkable precision.',
    weaknessText: 'Attribute-based deduction still needs work.',
  },
  higher_lower: {
    strengthText: 'Has an intuitive feel for transfer market valuations.',
    weaknessText: 'Transfer fee comparisons trip them up.',
  },
};

/**
 * Analyze the user's strongest and weakest game modes.
 * Returns null if fewer than 2 modes have enough games.
 */
export function analyzeStrengthWeakness(
  detailedModeStats: DetailedModeStats[]
): StrengthWeaknessAnalysis | null {
  const qualifying = detailedModeStats.filter(s => s.gamesPlayed >= MIN_GAMES_FOR_ANALYSIS);

  if (qualifying.length < 2) return null;

  const sorted = [...qualifying].sort((a, b) => b.accuracyPercent - a.accuracyPercent);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Don't show if they're basically the same
  if (strongest.accuracyPercent - weakest.accuracyPercent < 5) return null;

  const strengthFlavour = MODE_FLAVOUR[strongest.gameMode];
  const weaknessFlavour = MODE_FLAVOUR[weakest.gameMode];

  return {
    strength: {
      mode: strongest.gameMode,
      accuracy: strongest.accuracyPercent,
      flavourText: strengthFlavour.strengthText,
    },
    weakness: {
      mode: weakest.gameMode,
      accuracy: weakest.accuracyPercent,
      flavourText: weaknessFlavour.weaknessText,
    },
  };
}
