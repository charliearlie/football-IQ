/**
 * CompletedGameModal Component
 *
 * Read-only result modal for viewing past game results.
 * Displayed when tapping a completed game card on the home screen.
 * Uses BaseResultModal with stored attempt data.
 */

import React from 'react';
import {
  Trophy,
  XCircle,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultType,
} from '@/components/GameResultModal/BaseResultModal';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { normalizeScoreForMode } from '@/features/stats/utils/distributionConfig';
import { colors } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { ParsedLocalAttempt } from '@/types/database';

interface CompletedGameModalProps {
  /**
   * Whether the modal is visible.
   */
  visible: boolean;
  /**
   * The game mode for icon selection.
   */
  gameMode: GameMode;
  /**
   * The stored attempt data with score and metadata.
   */
  attempt: ParsedLocalAttempt;
  /**
   * Callback when modal is closed.
   */
  onClose: () => void;
  /**
   * Callback to enter review mode (optional).
   */
  onReview?: () => void;
  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * Game mode metadata for each attempt type.
 */
interface GameMetadata {
  won?: boolean;
  totalSteps?: number;
  revealedCount?: number;
  [key: string]: unknown;
}

/**
 * Get the result icon based on game mode and win status.
 */
function getResultIcon(gameMode: GameMode, won: boolean): React.ReactNode {
  const iconSize = 32;
  const iconColor = colors.stadiumNavy;

  // Use trophy/x for win/loss states
  if (won) {
    return <Trophy size={iconSize} color={iconColor} />;
  } else {
    return <XCircle size={iconSize} color={iconColor} />;
  }
}

/**
 * Get game mode display name.
 */
function getGameModeName(gameMode: GameMode): string {
  switch (gameMode) {
    case 'career_path':
      return 'Career Path';
    case 'guess_the_transfer':
      return 'Transfer Guess';
    case 'guess_the_goalscorers':
      return 'Goalscorer Recall';
    case 'tic_tac_toe':
      return 'Tic Tac Toe';
    case 'the_grid':
      return 'The Grid';
    case 'topical_quiz':
      return 'Quiz';
    default:
      return 'Game';
  }
}

/**
 * CompletedGameModal - Shows past game results.
 *
 * Displays:
 * - Game-appropriate icon (trophy for win, x for loss)
 * - Title based on win/loss state
 * - Score from stored attempt
 * - Score distribution graph
 * - Share and Close buttons only (no replay)
 */
export function CompletedGameModal({
  visible,
  gameMode,
  attempt,
  onClose,
  onReview,
  testID,
}: CompletedGameModalProps) {
  // Parse metadata safely with type guard
  const metadata: GameMetadata = (() => {
    if (!attempt.metadata || typeof attempt.metadata !== 'object' || Array.isArray(attempt.metadata)) {
      return {};
    }
    return attempt.metadata as GameMetadata;
  })();
  const won = metadata.won ?? true; // Default to won if not specified

  // Extract display data
  const score = attempt.score ?? 0;
  const gameName = getGameModeName(gameMode);

  // For Career Path, use stepsRevealed as the score and pass totalSteps
  // For other modes, normalize score to 0-100
  const isCareerPath = gameMode === 'career_path';
  const totalSteps = metadata.totalSteps;
  const stepsRevealed = metadata.revealedCount;
  const userScore = isCareerPath && stepsRevealed && totalSteps
    ? totalSteps - stepsRevealed + 1
    : normalizeScoreForMode(gameMode, score);

  // Determine result type and title
  // Use neutral styling for viewing past results (not a fresh win/loss)
  const resultType: ResultType = 'complete';
  const title = 'YOUR RESULT';

  // Handle share - copy the full score_display to clipboard
  const handleShare = async () => {
    if (attempt.score_display) {
      await Clipboard.setStringAsync(attempt.score_display);
      return { success: true as const, method: 'clipboard' as const };
    }
    return { success: false as const };
  };

  return (
    <BaseResultModal
      visible={visible}
      resultType={resultType}
      icon={getResultIcon(gameMode, won)}
      title={title}
      onShare={handleShare}
      onReview={onReview}
      onClose={onClose}
      closeLabel="Close"
      showConfetti={false} // Don't celebrate again
      testID={testID}
    >
      {/* Career Path and Goalscorer Recall scores are shown via distribution graph */}
      {gameMode !== 'career_path' && gameMode !== 'guess_the_goalscorers' && (
        <ScoreDisplay label={gameName} value={score} />
      )}
      <ScoreDistributionContainer
        puzzleId={attempt.puzzle_id}
        gameMode={gameMode}
        userScore={userScore}
        maxSteps={totalSteps}
        testID={testID ? `${testID}-distribution` : undefined}
      />
    </BaseResultModal>
  );
}
