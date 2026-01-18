/**
 * Base Result Modal Component
 *
 * Unified modal structure for all game result screens.
 * Handles:
 * - Modal overlay and animation
 * - Confetti on win
 * - Icon and title header
 * - Emoji grid display
 * - Share and close buttons
 *
 * Game-specific content is passed via children.
 */

import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/components/Confetti';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useShareStatus, ShareResult } from './useShareStatus';

export type ResultType = 'win' | 'loss' | 'draw' | 'complete';

export interface BaseResultModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Result type for styling */
  resultType: ResultType;

  /** Header icon (e.g., Trophy, XCircle) */
  icon: React.ReactNode;
  /** Title text (e.g., "CORRECT!", "GAME OVER") */
  title: string;
  /** Optional custom title color (defaults based on resultType) */
  titleColor?: string;

  /** Game-specific content (scores, answers, stats) */
  children: React.ReactNode;
  /** Optional message below content */
  message?: string;

  /** Callback to share result (optional) */
  onShare?: () => Promise<ShareResult>;
  /** Callback to review the game (optional) */
  onReview?: () => void;
  /** Callback to close modal (optional) */
  onClose?: () => void;
  /** Close button label (default: "Done") */
  closeLabel?: string;

  /** Whether to show confetti (default: true for win) */
  showConfetti?: boolean;
  /** Hide the default button container (for custom button layouts in children) */
  hideDefaultButtons?: boolean;
  /** Hide the close X button (when using custom Home button) */
  hideCloseButton?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Get accent color based on result type.
 */
function getAccentColor(resultType: ResultType): string {
  switch (resultType) {
    case 'win':
      return colors.pitchGreen;
    case 'loss':
      return colors.redCard;
    case 'draw':
      return colors.cardYellow;
    case 'complete':
      return colors.pitchGreen;
    default:
      return colors.pitchGreen;
  }
}

/**
 * Base result modal with shared structure and behavior.
 *
 * @example
 * ```tsx
 * <BaseResultModal
 *   visible={visible}
 *   resultType={won ? 'win' : 'loss'}
 *   icon={won ? <Trophy /> : <XCircle />}
 *   title={won ? 'CORRECT!' : 'GAME OVER'}
 *   onShare={handleShare}
 *   onClose={handleClose}
 * >
 *   <ScoreDisplay value={score.points} />
 *   <Text>{message}</Text>
 * </BaseResultModal>
 * ```
 */
export function BaseResultModal({
  visible,
  resultType,
  icon,
  title,
  titleColor,
  children,
  message,
  onShare,
  onReview,
  onClose,
  closeLabel = 'Done',
  showConfetti,
  hideDefaultButtons = false,
  hideCloseButton = false,
  testID,
}: BaseResultModalProps) {
  const { triggerNotification } = useHaptics();
  const { handleShare, buttonTitle, buttonColors } = useShareStatus(onShare, {
    activeTopColor: colors.pitchGreen,
    activeShadowColor: colors.grassShadow,
    sharedTopColor: colors.glassBackground,
    sharedShadowColor: colors.glassBorder,
  });

  // Track if we should reset share status
  const [, setResetTrigger] = useState(0);

  // Determine if we should show confetti
  const shouldShowConfetti = showConfetti ?? resultType === 'win';

  // Get colors
  const accentColor = titleColor ?? getAccentColor(resultType);
  const borderColor = accentColor;

  // Trigger haptics and reset state when modal opens
  useEffect(() => {
    if (visible) {
      setResetTrigger((prev) => prev + 1);
      triggerNotification(resultType === 'win' || resultType === 'complete' ? 'success' : 'error');
    }
  }, [visible, resultType, triggerNotification]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Confetti for win/completion */}
        {shouldShowConfetti && <Confetti active={visible} testID="confetti" />}

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={[styles.modal, { borderColor }]}
        >
          {/* Close X button */}
          {onClose && !hideCloseButton && (
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={8}
              testID="close-button"
            >
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
            {icon}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>

          {/* Game-specific content */}
          {children}

          {/* Message (if provided) */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Action Buttons (unless custom layout in children) */}
          {!hideDefaultButtons && (
            <View style={styles.buttonContainer}>
              {onShare && (
                <ElevatedButton
                  title={buttonTitle}
                  onPress={handleShare}
                  size="small"
                  style={onReview ? styles.buttonHalf : styles.buttonFull}
                  topColor={buttonColors.topColor}
                  shadowColor={buttonColors.shadowColor}
                  testID="share-button"
                />
              )}
              {onReview && (
                <ElevatedButton
                  title="Review"
                  onPress={onReview}
                  size="small"
                  style={onShare ? styles.buttonHalf : styles.buttonFull}
                  topColor={colors.cardYellow}
                  shadowColor="#B8960F"
                  testID="review-button"
                />
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Score display component for win states.
 */
export function ScoreDisplay({
  label = 'Score',
  value,
}: {
  label?: string;
  value: string | number;
}) {
  return (
    <View style={styles.scoreContainer}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

/**
 * Answer reveal component for loss states.
 */
export function AnswerReveal({
  label = 'The answer was:',
  value,
}: {
  label?: string;
  value: string;
}) {
  return (
    <View style={styles.answerContainer}>
      <Text style={styles.answerLabel}>{label}</Text>
      <Text style={styles.answerValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 48,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.floodlightWhite,
    letterSpacing: 2,
  },
  answerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  answerLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  answerValue: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
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
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
    padding: spacing.xs,
  },
});
