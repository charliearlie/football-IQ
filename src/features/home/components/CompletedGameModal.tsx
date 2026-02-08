/**
 * CompletedGameModal Component
 *
 * Read-only result modal for viewing past game results.
 * Displayed when tapping a completed game card on the home screen.
 * Uses BaseResultModal with stored attempt data.
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Trophy,
  XCircle,
  Share2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import {
  BaseResultModal,
  ScoreDisplay,
  ResultType,
} from '@/components/GameResultModal/BaseResultModal';
import { ElevatedButton, IconButton } from '@/components';
import { ScoreDistributionContainer } from '@/features/stats/components/ScoreDistributionContainer';
import { normalizeScoreForMode } from '@/features/stats/utils/distributionConfig';
import { colors, spacing } from '@/theme';
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
  const isCareerPath = gameMode === 'career_path' || gameMode === 'career_path_pro';
  const totalSteps = metadata.totalSteps;
  const stepsRevealed = metadata.revealedCount;
  const userScore = isCareerPath && stepsRevealed && totalSteps
    ? totalSteps - stepsRevealed + 1
    : normalizeScoreForMode(gameMode, score);

  // Determine result type and title
  // Use neutral styling for viewing past results (not a fresh win/loss)
  const resultType: ResultType = 'complete';
  const title = 'YOUR RESULT';

  // Share label state for feedback
  const [shareLabel, setShareLabel] = useState<string | undefined>(undefined);

  // Handle share - copy the full score_display to clipboard
  const handleShare = async () => {
    if (attempt.score_display) {
      await Clipboard.setStringAsync(attempt.score_display);
      setShareLabel('Copied!');
      setTimeout(() => setShareLabel(undefined), 2000);
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
      onClose={onClose}
      showConfetti={false} // Don't celebrate again
      hideDefaultButtons // Use custom button layout
      testID={testID}
    >
      {/* Career Path and Goalscorer Recall scores are shown via distribution graph */}
      {gameMode !== 'career_path' && gameMode !== 'career_path_pro' && gameMode !== 'guess_the_goalscorers' && (
        <ScoreDisplay label={gameName} value={score} />
      )}

      {/* Share icon button - centered */}
      <View style={styles.shareContainer}>
        <IconButton
          icon={<Share2 size={20} color={colors.stadiumNavy} />}
          onPress={handleShare}
          label={shareLabel}
          variant="primary"
          size="medium"
          testID="share-icon-button"
        />
      </View>

      {/* Score distribution */}
      <ScoreDistributionContainer
        puzzleId={attempt.puzzle_id}
        gameMode={gameMode}
        userScore={userScore}
        maxSteps={totalSteps}
        testID={testID ? `${testID}-distribution` : undefined}
      />

      {/* Action buttons row */}
      <View style={styles.buttonRow}>
        {onReview && (
          <ElevatedButton
            title="Review"
            onPress={onReview}
            variant="secondary"
            size="small"
            style={styles.buttonHalf}
            testID="review-button"
          />
        )}
        <ElevatedButton
          title="Close"
          onPress={onClose}
          variant="primary"
          size="small"
          style={onReview ? styles.buttonHalf : styles.buttonFull}
          testID="close-button"
        />
      </View>
    </BaseResultModal>
  );
}

const styles = StyleSheet.create({
  shareContainer: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
});
