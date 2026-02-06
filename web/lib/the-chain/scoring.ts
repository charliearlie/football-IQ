/**
 * Scoring System for The Chain
 *
 * Inverse PAR scoring where completing in fewer steps earns more points.
 *
 * Formula:
 * - At PAR: par points (e.g., 5 steps on Par 5 = 5 points)
 * - Under PAR: +1 point per step saved (e.g., 3 steps on Par 5 = 7 points)
 * - Over PAR: -1 point per step extra (e.g., 6 steps on Par 5 = 4 points)
 * - Floor: Minimum score is 0
 *
 * Examples (Par 5):
 * - 3 steps (2 under) = 5 + 2 = 7 points (Eagle!)
 * - 4 steps (1 under) = 5 + 1 = 6 points (Birdie!)
 * - 5 steps (at par)  = 5 points
 * - 6 steps (1 over)  = 5 - 1 = 4 points (Bogey)
 * - 7 steps (2 over)  = 5 - 2 = 3 points (Double Bogey)
 * - 10+ steps         = 0 points (max penalty)
 */

export type ChainScoreLabel =
  | "Eagle"
  | "Birdie"
  | "Par"
  | "Bogey"
  | "Double Bogey"
  | "Triple Bogey+"
  | "Did Not Finish";

export interface ChainScore {
  /** Points earned (0 to maxPoints) */
  points: number;
  /** Maximum possible points (par + 2, for eagle) */
  maxPoints: number;
  /** Steps taken to complete */
  stepsTaken: number;
  /** PAR for this puzzle */
  par: number;
  /** Difference from par (-2 = Eagle, -1 = Birdie, 0 = Par, +1 = Bogey, etc.) */
  parDifference: number;
  /** Whether the player completed the chain */
  completed: boolean;
  /** Golf-style label */
  label: ChainScoreLabel;
}

/**
 * Calculate the score for a Chain puzzle attempt.
 *
 * @param stepsTaken - Number of steps the player used to complete the chain
 * @param par - The optimal number of steps (PAR value)
 * @param completed - Whether the player successfully completed the chain
 * @returns ChainScore object with points and metadata
 */
export function calculateChainScore(
  stepsTaken: number,
  par: number,
  completed: boolean
): ChainScore {
  const maxPoints = par + 2; // Eagle is the maximum

  if (!completed) {
    return {
      points: 0,
      maxPoints,
      stepsTaken,
      par,
      parDifference: stepsTaken - par,
      completed: false,
      label: "Did Not Finish",
    };
  }

  const parDifference = stepsTaken - par;

  // Formula: points = par - parDifference = par - (stepsTaken - par) = 2*par - stepsTaken
  // This gives: at par = par pts, under par = more pts, over par = fewer pts
  const rawPoints = par - parDifference;
  const points = Math.max(0, rawPoints);

  const label = getScoreLabel(parDifference);

  return {
    points,
    maxPoints,
    stepsTaken,
    par,
    parDifference,
    completed: true,
    label,
  };
}

/**
 * Get the golf-style label for a par difference.
 */
function getScoreLabel(parDifference: number): ChainScoreLabel {
  if (parDifference <= -2) return "Eagle";
  if (parDifference === -1) return "Birdie";
  if (parDifference === 0) return "Par";
  if (parDifference === 1) return "Bogey";
  if (parDifference === 2) return "Double Bogey";
  return "Triple Bogey+";
}

/**
 * Format a ChainScore for display.
 *
 * @param score - The ChainScore to format
 * @returns Formatted string like "7pts (-2)" or "DNF"
 */
export function formatChainScore(score: ChainScore): string {
  if (!score.completed) {
    return "DNF";
  }

  // Format par difference: -2, -1, E (even), +1, +2, etc.
  let parDisplay: string;
  if (score.parDifference === 0) {
    parDisplay = "E"; // Even (golf convention)
  } else if (score.parDifference > 0) {
    parDisplay = `+${score.parDifference}`;
  } else {
    parDisplay = `${score.parDifference}`;
  }

  return `${score.points}pts (${parDisplay})`;
}

/**
 * Get an emoji representing the score performance.
 *
 * @param score - The ChainScore
 * @returns Emoji string
 */
export function getChainScoreEmoji(score: ChainScore): string {
  if (!score.completed) return "💀";

  switch (score.label) {
    case "Eagle":
      return "🦅";
    case "Birdie":
      return "🐦";
    case "Par":
      return "⛳";
    case "Bogey":
      return "😐";
    case "Double Bogey":
      return "😟";
    case "Triple Bogey+":
      return "😰";
    default:
      return "⛳";
  }
}

/**
 * Generate an emoji grid for sharing results.
 *
 * @param score - The ChainScore
 * @returns String of emojis representing the performance
 */
export function generateChainEmojiGrid(score: ChainScore): string {
  if (!score.completed) {
    return "💀 DNF";
  }

  const emoji = getChainScoreEmoji(score);
  const parDisplay =
    score.parDifference === 0
      ? "E"
      : score.parDifference > 0
        ? `+${score.parDifference}`
        : `${score.parDifference}`;

  return `${emoji} ${score.stepsTaken} steps (${parDisplay})`;
}
