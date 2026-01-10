/**
 * DailyStackCard Component
 *
 * Thin wrapper around UniversalGameCard for backwards compatibility.
 * Used on the Home screen daily puzzle stack.
 */

import React from 'react';
import { UniversalGameCard } from '@/components';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { CardStatus } from '../hooks/useDailyPuzzles';

interface DailyStackCardProps {
  /**
   * Game mode type.
   */
  gameMode: GameMode;
  /**
   * Current status of the puzzle attempt.
   */
  status: CardStatus;
  /**
   * Callback when card/button is pressed.
   */
  onPress: () => void;
  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * Individual game card for the Home Screen daily stack.
 *
 * Shows different states:
 * - play: "Play" button (green)
 * - resume: "Resume" button (yellow)
 * - done: "Result" button (yellow)
 */
export function DailyStackCard({
  gameMode,
  status,
  onPress,
  testID,
}: DailyStackCardProps) {
  return (
    <UniversalGameCard
      gameMode={gameMode}
      status={status}
      onPress={onPress}
      variant="daily"
      testID={testID}
    />
  );
}
