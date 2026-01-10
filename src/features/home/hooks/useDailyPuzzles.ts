import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { usePuzzleContext } from '@/features/puzzles';
import { getAttemptByPuzzleId } from '@/lib/database';
import { GameMode, ParsedLocalPuzzle } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt } from '@/types/database';

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
 * Get today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Ordered list of game modes for consistent display.
 */
const GAME_MODE_ORDER: GameMode[] = [
  'career_path',
  'guess_the_transfer',
  'guess_the_goalscorers',
  'the_grid',
  'topical_quiz',
];

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

  const loadCards = useCallback(async () => {
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

      setCards(validCards);
    } catch (error) {
      console.error('Failed to load daily puzzle cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [puzzles]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await syncPuzzles();
    await refreshLocalPuzzles();
    await loadCards();
  }, [syncPuzzles, refreshLocalPuzzles, loadCards]);

  // Load cards when puzzles change
  useEffect(() => {
    if (syncStatus !== 'syncing') {
      loadCards();
    }
  }, [puzzles, syncStatus, loadCards]);

  // Reload cards when screen gains focus (e.g., after completing a game)
  // This ensures attempt status is refreshed from SQLite when navigating back
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
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
