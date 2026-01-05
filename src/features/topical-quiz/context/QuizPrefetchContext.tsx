import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePuzzleContext } from '@/features/puzzles';
import { extractImageUrls, prefetchQuizImages, PrefetchResult } from '../utils/imagePrefetch';
import { TopicalQuizContent } from '../types/topicalQuiz.types';

/**
 * Quiz prefetch status.
 */
type PrefetchStatus = 'idle' | 'prefetching' | 'ready' | 'error';

/**
 * Quiz prefetch context value.
 */
interface QuizPrefetchContextValue {
  /** Current prefetch status */
  status: PrefetchStatus;
  /** Whether images are prefetched and ready */
  isPrefetched: boolean;
  /** Last prefetch result */
  lastResult: PrefetchResult | null;
  /** Manually trigger prefetch */
  triggerPrefetch: () => Promise<void>;
}

const QuizPrefetchContext = createContext<QuizPrefetchContextValue | null>(null);

/**
 * QuizPrefetchProvider
 *
 * Prefetches topical quiz images when the app enters foreground.
 * Ensures quiz images are ready for instant display.
 */
export function QuizPrefetchProvider({ children }: { children: React.ReactNode }) {
  const { puzzles } = usePuzzleContext();
  const [status, setStatus] = useState<PrefetchStatus>('idle');
  const [lastResult, setLastResult] = useState<PrefetchResult | null>(null);
  const prefetchedRef = useRef(false);

  /**
   * Get today's topical quiz puzzle content.
   */
  const getTodaysQuizContent = useCallback((): TopicalQuizContent | null => {
    const today = new Date().toISOString().split('T')[0];
    const quizPuzzle = puzzles.find(
      (p) => p.game_mode === 'topical_quiz' && p.puzzle_date === today
    );

    if (!quizPuzzle?.content) {
      return null;
    }

    try {
      return typeof quizPuzzle.content === 'string'
        ? JSON.parse(quizPuzzle.content)
        : quizPuzzle.content;
    } catch {
      return null;
    }
  }, [puzzles]);

  /**
   * Trigger image prefetch.
   */
  const triggerPrefetch = useCallback(async () => {
    if (status === 'prefetching') {
      return;
    }

    const content = getTodaysQuizContent();
    if (!content) {
      return;
    }

    const urls = extractImageUrls(content);
    if (urls.length === 0) {
      setStatus('ready');
      prefetchedRef.current = true;
      return;
    }

    setStatus('prefetching');

    try {
      const result = await prefetchQuizImages(urls);
      setLastResult(result);
      setStatus(result.failed === urls.length ? 'error' : 'ready');
      prefetchedRef.current = true;
    } catch {
      setStatus('error');
    }
  }, [status, getTodaysQuizContent]);

  /**
   * Prefetch when app comes to foreground.
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !prefetchedRef.current) {
        triggerPrefetch();
      }
    };

    // Initial prefetch if puzzles are already loaded
    if (puzzles.length > 0 && !prefetchedRef.current) {
      triggerPrefetch();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [puzzles.length, triggerPrefetch]);

  /**
   * Reset prefetch status when puzzles change (new day).
   */
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasNewQuiz = puzzles.some(
      (p) => p.game_mode === 'topical_quiz' && p.puzzle_date === today
    );

    if (hasNewQuiz && prefetchedRef.current) {
      // Check if we need to re-prefetch for new content
      prefetchedRef.current = false;
      triggerPrefetch();
    }
  }, [puzzles, triggerPrefetch]);

  const value: QuizPrefetchContextValue = {
    status,
    isPrefetched: status === 'ready',
    lastResult,
    triggerPrefetch,
  };

  return (
    <QuizPrefetchContext.Provider value={value}>
      {children}
    </QuizPrefetchContext.Provider>
  );
}

/**
 * Hook to access quiz prefetch context.
 */
export function useQuizPrefetch(): QuizPrefetchContextValue {
  const context = useContext(QuizPrefetchContext);

  if (!context) {
    // Return default values if not in provider (graceful degradation)
    return {
      status: 'idle',
      isPrefetched: false,
      lastResult: null,
      triggerPrefetch: async () => {},
    };
  }

  return context;
}
