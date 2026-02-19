/**
 * CompletedGameModal Component
 *
 * Read-only result modal for viewing past game results.
 * Displayed when tapping a completed game card on the home screen.
 * Uses BaseResultModal with stored attempt data and standard button layout.
 */

import React from 'react';
import { Trophy, XCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultType,
} from '@/components/GameResultModal/BaseResultModal';
import type { ShareResult } from '@/components/GameResultModal';
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
    case 'career_path_pro':
      return 'Career Path Pro';
    case 'guess_the_transfer':
      return 'Transfer Guess';
    case 'guess_the_goalscorers':
      return 'Goalscorer Recall';
    case 'the_grid':
      return 'The Grid (beta)';
    case 'the_chain':
      return 'The Chain';
    case 'the_thread':
      return 'Threads';
    case 'topical_quiz':
      return 'Quiz';
    case 'top_tens':
      return 'Top Tens';
    case 'starting_xi':
      return 'Starting XI';
    case 'connections':
      return 'Connections';
    case 'timeline':
      return 'Timeline';
    default:
      return 'Game';
  }
}

/**
 * CompletedGameModal - Shows past game results.
 *
 * Uses BaseResultModal's standard button layout for consistency
 * with first-time result modals.
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

  // Top Tens: derive foundCount from metadata.foundIndices
  const foundIndices = metadata.foundIndices as number[] | undefined;
  const topTensFoundCount = gameMode === 'top_tens' && Array.isArray(foundIndices)
    ? foundIndices.length
    : null;

  // For Career Path, use stepsRevealed as the score and pass totalSteps
  // For Top Tens, use foundCount * 10 (0-100 scale matching X/10 labels)
  // For other modes, normalize score to 0-100
  const isCareerPath = gameMode === 'career_path' || gameMode === 'career_path_pro';
  const totalSteps = metadata.totalSteps;
  const stepsRevealed = metadata.revealedCount;
  const userScore = isCareerPath && stepsRevealed && totalSteps
    ? totalSteps - stepsRevealed + 1
    : topTensFoundCount !== null
      ? topTensFoundCount * 10
      : normalizeScoreForMode(gameMode, score);

  // Determine result type and title
  // Use neutral styling for viewing past results (not a fresh win/loss)
  const resultType: ResultType = 'complete';
  const title = 'YOUR RESULT';

  // Handle share - copy the full score_display to clipboard
  const handleShare = async (): Promise<ShareResult> => {
    if (attempt.score_display) {
      await Clipboard.setStringAsync(attempt.score_display);
      return { success: true, method: 'clipboard' };
    }
    return { success: false };
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
      showConfetti={false}
      testID={testID}
    >
      {/* Career Path and Goalscorer Recall scores are shown via distribution graph */}
      {gameMode !== 'career_path' && gameMode !== 'career_path_pro' && gameMode !== 'guess_the_goalscorers' && (
        <ScoreDisplay
          label={gameName}
          value={topTensFoundCount !== null ? `${topTensFoundCount}/10` : score}
        />
      )}

      {/* Score distribution */}
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
