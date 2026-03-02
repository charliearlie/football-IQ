import { Badge } from '../types/stats.types';
import { MilestoneInfo } from '../types/scoutReport.types';

const MAX_DISTANCE = 20;

interface MilestoneTarget {
  type: 'streak' | 'perfects' | 'games';
  target: number;
  label: string;
}

const MILESTONE_TARGETS: MilestoneTarget[] = [
  // Streak milestones
  { type: 'streak', target: 7, label: '7-Day Streak' },
  { type: 'streak', target: 14, label: '14-Day Streak' },
  { type: 'streak', target: 30, label: '30-Day Streak' },
  // Game milestones
  { type: 'games', target: 10, label: '10 Games' },
  { type: 'games', target: 50, label: '50 Games' },
  { type: 'games', target: 100, label: '100 Games' },
  { type: 'games', target: 250, label: '250 Games' },
  { type: 'games', target: 500, label: '500 Games' },
  // Perfect score milestones
  { type: 'perfects', target: 5, label: '5 Perfects' },
  { type: 'perfects', target: 10, label: '10 Perfects' },
  { type: 'perfects', target: 25, label: '25 Perfects' },
  { type: 'perfects', target: 50, label: '50 Perfects' },
];

/**
 * Find the closest upcoming milestone within reach (distance <= 20).
 * Returns null if all milestones are too far away or already achieved.
 */
export function calculateNextMilestone(
  totalPuzzles: number,
  totalPerfects: number,
  currentStreak: number
): MilestoneInfo | null {
  let closest: MilestoneInfo | null = null;

  for (const target of MILESTONE_TARGETS) {
    let current: number;
    switch (target.type) {
      case 'streak':
        current = currentStreak;
        break;
      case 'games':
        current = totalPuzzles;
        break;
      case 'perfects':
        current = totalPerfects;
        break;
    }

    const distance = target.target - current;

    // Skip already achieved or too far away
    if (distance <= 0 || distance > MAX_DISTANCE) continue;

    // Track closest
    if (!closest || distance < closest.distance) {
      closest = {
        type: target.type,
        current,
        target: target.target,
        label: target.label,
        distance,
      };
    }
  }

  return closest;
}
