import type { ComponentType, ReactNode } from "react";

/**
 * Result a game reports when it ends. Drives post-game CTA rendering.
 */
export interface GameResult {
  won: boolean;
  answer: string;
  shareText: string;
}

export type OnGameComplete = (result: GameResult) => void;

/**
 * Contract every game UI implements. The orchestrator passes today's puzzle
 * content + the date, and listens for completion via onComplete.
 */
export interface GameProps<TContent> {
  content: TContent;
  puzzleDate: string;
  onComplete: OnGameComplete;
}

/**
 * Registry entry per playable game mode. Lives client-side because it carries
 * a React component reference. The server-side <DailyPuzzleGame> only reads
 * `dbMode`, `title`, and `fallbackContent` (all serializable).
 */
export interface GameRegistryEntry<TContent> {
  /** URL slug, e.g. "career-path". */
  slug: string;
  /** Database game_mode value, e.g. "career_path". */
  dbMode: string;
  /** Display title, used by GamePageShell. */
  title: string;
  /** Fallback content rendered when no live puzzle exists for the date. */
  fallbackContent: TContent;
  /** The game UI component conforming to GameProps<TContent>. */
  component: ComponentType<GameProps<TContent>>;
  /** Optional how-to-play / SEO node rendered below the game. */
  howToPlay?: ReactNode;
}
