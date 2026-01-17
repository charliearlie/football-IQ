import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePuzzleContext } from '@/features/puzzles';
import { getAttemptByPuzzleId, getValidAdUnlocks } from '@/lib/database';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { GameMode, ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt, UnlockedPuzzle } from '@/types/database';

/**
 * Card status for Home Screen display.
 */
export type CardStatus = 'play' | 'resume' | 'done';

/**
 * A daily puzzle card with its current status.
 */
export interface DailyPuzzleCard {
  puzzleId: string;
  gameMode: GameMode;
  status: CardStatus;
  score?: number;
  scoreDisplay?: string;
  difficulty?: string | null;
  attempt?: ParsedLocalAttempt;
  /** Whether this game mode is premium-only (locked for free users) */
  isPremiumOnly?: boolean;
  /** Whether this puzzle has been permanently unlocked via ad */
  isAdUnlocked?: boolean;
}

/**
 * Result of the useDailyPuzzles hook.
 */
export interface UseDailyPuzzlesResult {
  cards: DailyPuzzleCard[];
  completedCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 * Uses the time integrity system for authorized date.
 */
function getTodayDate(): string {
  return getAuthorizedDateUnsafe();
}

/**
 * Ordered list of game modes for consistent display.
 */
const GAME_MODE_ORDER: GameMode[] = [
  'career_path',
  'career_path_pro',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'the_grid',
  'topical_quiz',
  'top_tens',
  'starting_xi',
];

/**
 * Game modes that require premium subscription.
 * These are shown as locked for free users.
 */
const PREMIUM_ONLY_MODES: Set<GameMode> = new Set(['career_path_pro', 'top_tens']);

/**
 * Hook to get today's puzzles with their completion status.
 *
 * Returns cards for each game mode with:
 * - 'play': No attempt exists (show Play button)
 * - 'resume': Attempt exists but not completed (show Resume button)
 * - 'done': Attempt completed (show score/emoji grid)
 *
 * @example
 * ```tsx
 * function DailyStack() {
 *   const { cards, completedCount, isLoading, refresh } = useDailyPuzzles();
 *
 *   if (isLoading) return <Text>Loading puzzles...</Text>;
 *
 *   return (
 *     <View>
 *       <Text>Completed: {completedCount}/5</Text>
 *       {cards.map(card => (
 *         <DailyStackCard key={card.puzzleId} {...card} />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useDailyPuzzles(): UseDailyPuzzlesResult {
  const { puzzles, syncStatus, refreshLocalPuzzles, syncPuzzles } = usePuzzleContext();
  const [cards, setCards] = useState<DailyPuzzleCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adUnlocks, setAdUnlocks] = useState<UnlockedPuzzle[]>([]);

  const loadCards = useCallback(async (currentAdUnlocks: UnlockedPuzzle[]) => {
    try {
      const today = getTodayDate();

      // Filter puzzles for today
      const todaysPuzzles = puzzles.filter((p) => p.puzzle_date === today);

      // Create a map for quick lookup
      const puzzleMap = new Map<GameMode, ParsedLocalPuzzle>();
      for (const puzzle of todaysPuzzles) {
        puzzleMap.set(puzzle.game_mode as GameMode, puzzle);
      }

      // Build cards in order, checking attempt status for each
      const cardPromises = GAME_MODE_ORDER.map(async (gameMode): Promise<DailyPuzzleCard | null> => {
        const puzzle = puzzleMap.get(gameMode);

        if (!puzzle) {
          // No puzzle for this mode today - will show as unavailable
          return null;
        }

        // Check for existing attempt
        const attempt = await getAttemptByPuzzleId(puzzle.id);

        let status: CardStatus;
        if (!attempt) {
          status = 'play';
        } else if (attempt.completed) {
          status = 'done';
        } else {
          status = 'resume';
        }

        return {
          puzzleId: puzzle.id,
          gameMode,
          status,
          score: attempt?.score ?? undefined,
          scoreDisplay: attempt?.score_display ?? undefined,
          difficulty: puzzle.difficulty,
          attempt: attempt ?? undefined,
          isPremiumOnly: PREMIUM_ONLY_MODES.has(gameMode),
          isAdUnlocked: currentAdUnlocks.some((u) => u.puzzle_id === puzzle.id),
        };
      });

      const resolvedCards = await Promise.all(cardPromises);

      // Filter out null cards (no puzzle for that mode)
      // but keep topical_quiz as "coming soon" placeholder
      const validCards = resolvedCards.filter((card): card is DailyPuzzleCard => {
        if (card !== null) return true;
        return false;
      });

      // If topical_quiz has no puzzle, add a placeholder
      if (!puzzleMap.has('topical_quiz')) {
        // Find where to insert (maintain order)
        const quizIndex = GAME_MODE_ORDER.indexOf('topical_quiz');
        const placeholderCard: DailyPuzzleCard = {
          puzzleId: 'coming-soon-quiz',
          gameMode: 'topical_quiz',
          status: 'play', // Will be handled specially in the component
          difficulty: null,
        };
        // Insert at correct position
        validCards.splice(quizIndex, 0, placeholderCard);
      }

      // If career_path_pro has no puzzle, add a placeholder (premium-only)
      if (!puzzleMap.has('career_path_pro')) {
        const proIndex = GAME_MODE_ORDER.indexOf('career_path_pro');
        const placeholderCard: DailyPuzzleCard = {
          puzzleId: 'coming-soon-career-pro',
          gameMode: 'career_path_pro',
          status: 'play', // Will be handled specially in the component
          difficulty: null,
          isPremiumOnly: true,
        };
        // Insert at correct position
        validCards.splice(proIndex, 0, placeholderCard);
      }

      // If top_tens has no puzzle, add a placeholder (premium-only)
      if (!puzzleMap.has('top_tens')) {
        const topTensIndex = GAME_MODE_ORDER.indexOf('top_tens');
        const placeholderCard: DailyPuzzleCard = {
          puzzleId: 'coming-soon-top-tens',
          gameMode: 'top_tens',
          status: 'play', // Will be handled specially in the component
          difficulty: null,
          isPremiumOnly: true,
        };
        // Insert at correct position
        validCards.splice(topTensIndex, 0, placeholderCard);
      }

      setCards(validCards);
    } catch (error) {
      console.error('Failed to load daily puzzle cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [puzzles]);

  /**
   * Load cards with fresh ad unlocks from database.
   * This is the primary loading function that fetches everything needed.
   */
  const loadCardsWithFreshUnlocks = useCallback(async () => {
    try {
      const freshUnlocks = await getValidAdUnlocks();
      setAdUnlocks(freshUnlocks);
      await loadCards(freshUnlocks);
    } catch (error) {
      console.error('Failed to load ad unlocks:', error);
      // Still try to load cards with empty unlocks
      await loadCards([]);
    }
  }, [loadCards]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await syncPuzzles();
    await refreshLocalPuzzles();
    await loadCardsWithFreshUnlocks();
  }, [syncPuzzles, refreshLocalPuzzles, loadCardsWithFreshUnlocks]);

  // Load cards when puzzles change
  useEffect(() => {
    if (syncStatus !== 'syncing') {
      loadCardsWithFreshUnlocks();
    }
  }, [puzzles, syncStatus, loadCardsWithFreshUnlocks]);

  // Reload cards when screen gains focus (e.g., after completing a game or unlocking via ad)
  // This ensures both attempt status AND ad unlocks are refreshed from SQLite when navigating back
  useFocusEffect(
    useCallback(() => {
      loadCardsWithFreshUnlocks();
    }, [loadCardsWithFreshUnlocks])
  );

  // Count completed cards
  const completedCount = cards.filter((c) => c.status === 'done').length;

  return {
    cards,
    completedCount,
    isLoading: isLoading || syncStatus === 'syncing',
    refresh,
  };
}
