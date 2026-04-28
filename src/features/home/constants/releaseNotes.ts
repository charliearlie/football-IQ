/**
 * Release notes shown in the "What's New" modal.
 *
 * Add an entry for each version that deserves a modal.
 * Versions without an entry here will silently skip the modal —
 * so minor patches don't need one.
 */

export interface ReleaseNote {
  title: string;
  notes: { emoji: string; text: string }[];
}

export const RELEASE_NOTES: Record<string, ReleaseNote> = {
  "3.6.1": {
    title: "New game mode: Higher/Lower",
    notes: [
      {
        emoji: "\u26BD",
        text: "New game mode — simply guess whether the next player's appearances/goals or transfer figure is higher or lower than the previous",
      },
      {
        emoji: "\u2705",
        text: "Second new game mode this month. They will keep on coming!",
      },
    ],
  },
};
