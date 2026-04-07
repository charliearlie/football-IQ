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
  '3.5.0': {
    title: "Who's That? is here",
    notes: [
      {
        emoji: '\u26BD',
        text: "New game mode — guess the footballer from attribute clues in 6 tries. Club, league, nationality, position, and birth year narrow down your search, Wordle-style.",
      },
      {
        emoji: '\u2705',
        text: "We manually verified 5,000+ player records to make sure club data is accurate. The data is solid.",
      },
      {
        emoji: '\uD83D\uDEE0\uFE0F',
        text: "Bug fix: retired players no longer sneak into the search results.",
      },
    ],
  },
};
