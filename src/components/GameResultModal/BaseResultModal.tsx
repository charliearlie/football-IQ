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
 * - Image-based sharing with ViewShot capture
 *
 * Game-specific content is passed via children.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';
import { X, Flame } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ElevatedButton } from '@/components/ElevatedButton';
import { Confetti } from '@/components/Confetti';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';
import { usePostHog } from 'posthog-react-native';
import { useHaptics } from '@/hooks/useHaptics';
import { ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import { useShareStatus, ShareResult } from './useShareStatus';
import { useNextPuzzle } from '@/hooks/useNextPuzzle';
import {
  ResultShareData,
  captureResultCard,
  shareResultCard,
} from './useResultShare';
import {
  getTierForPoints,
  getProgressToNextTier,
  getPointsToNextTier,
  getNextTier,
  getTierColor,
  didTierChange,
} from '@/features/stats/utils/tierProgression';
import { useAuth } from '@/features/auth';
import { useCurrentStreak } from '@/hooks/useCurrentStreak';

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

  /** Callback to share result (optional, legacy text-based) */
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
  /** Show the "Next Puzzle" session-chaining button below the action buttons */
  showNextPuzzle?: boolean;
  /** Test ID for testing */
  testID?: string;

  /** IQ points earned in this game (triggers TierProgressBar + StreakBadge) */
  iqEarned?: number;

  /** Previous cumulative IQ (before this game) — overrides iqEarned-based calculation */
  oldIQ?: number;
  /** New cumulative IQ (after this game) — overrides iqEarned-based calculation */
  newIQ?: number;
  /** Current daily streak count — overrides auto-detected streak */
  streakDays?: number;

  /** Whether the user has a premium subscription — overrides auth-based detection */
  isPremium?: boolean;
  /** User's percentile ranking for today's puzzle */
  percentile?: number;

  /**
   * Image-based sharing props (takes precedence over onShare when provided)
   */
  /** Content to render in the shareable image card */
  shareCardContent?: React.ReactNode;
  /** Data for generating share text alongside the image */
  shareData?: ResultShareData;
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
 * Streak badge shown in result modals when the user has an active streak.
 */
function StreakBadge({ streakDays }: { streakDays: number }) {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[streakStyles.container, animatedStyle]}>
      <Flame size={20} color={colors.cardYellow} />
      <Text style={streakStyles.count}>{streakDays}</Text>
      <Text style={streakStyles.label}>day streak</Text>
    </Animated.View>
  );
}

const streakStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  count: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

/**
 * Tier progress bar shown in result modals after IQ gain.
 */
function TierProgressBar({ oldIQ, newIQ }: { oldIQ: number; newIQ: number }) {
  const iqGained = newIQ - oldIQ;
  const tierChange = didTierChange(oldIQ, newIQ);
  const currentTier = getTierForPoints(newIQ);
  const tierColor = getTierColor(currentTier.tier);
  const nextTier = getNextTier(currentTier);
  const pointsToNext = getPointsToNextTier(newIQ);

  const oldProgress = getProgressToNextTier(oldIQ);
  const newProgress = tierChange.changed ? 100 : getProgressToNextTier(newIQ);

  const barWidth = useSharedValue(oldProgress);

  useEffect(() => {
    barWidth.value = withDelay(
      300,
      withSpring(newProgress, { damping: 15, stiffness: 80 })
    );
  }, [newProgress]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View style={tierBarStyles.container}>
      <View style={tierBarStyles.header}>
        <Text style={[tierBarStyles.tierName, { color: tierColor }]}>
          {currentTier.name}
        </Text>
        <Text style={tierBarStyles.iqGained}>+{iqGained} IQ</Text>
      </View>
      <View style={tierBarStyles.track}>
        <Animated.View
          style={[tierBarStyles.fill, { backgroundColor: tierColor }, barAnimatedStyle]}
        />
      </View>
      {nextTier && (
        <Text style={tierBarStyles.nextTier}>
          {pointsToNext} to {nextTier.name}
        </Text>
      )}
    </View>
  );
}

const tierBarStyles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierName: {
    fontFamily: fonts.headline,
    fontSize: 18,
  },
  iqGained: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.pitchGreen,
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  nextTier: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

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
  showNextPuzzle = false,
  testID,
  iqEarned,
  oldIQ,
  newIQ,
  streakDays,
  isPremium,
  percentile,
  shareCardContent,
  shareData,
}: BaseResultModalProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const { triggerNotification } = useHaptics();

  // Self-hydrate retention data from auth + streak hooks
  const { totalIQ: authTotalIQ, profile } = useAuth();
  const computedStreakDays = useCurrentStreak();

  // iqEarned gates all retention features (undefined = revisit, don't show)
  const showRetention = iqEarned !== undefined;

  // Allow explicit props to override computed values (backwards compat)
  const effectiveStreakDays = streakDays ?? (showRetention ? computedStreakDays : undefined);
  const effectiveIsPremium = isPremium ?? (profile?.is_premium ?? false);
  const effectiveOldIQ = oldIQ ?? (showRetention ? authTotalIQ - iqEarned : undefined);
  const effectiveNewIQ = newIQ ?? (showRetention ? authTotalIQ : undefined);

  // Session chaining — finds next unplayed daily puzzle
  const nextPuzzle = useNextPuzzle(showNextPuzzle);

  // ViewShot ref for image capture
  const viewShotRef = useRef<ViewShot>(null!);

  // Image sharing state
  const [isImageSharing, setIsImageSharing] = useState(false);
  const [imageShareStatus, setImageShareStatus] = useState<'idle' | 'shared' | 'error'>('idle');

  // Image-based share handler
  const handleImageShare = useCallback(async (): Promise<ShareResult> => {
    if (!shareData) {
      return { success: false, method: 'share' };
    }

    setIsImageSharing(true);
    setImageShareStatus('idle');

    const imageUri = await captureResultCard(viewShotRef);
    const result = await shareResultCard(imageUri, shareData);

    setIsImageSharing(false);

    if (result.success) {
      setImageShareStatus('shared');
      setTimeout(() => setImageShareStatus('idle'), 2000);
      try {
        posthog?.capture(ANALYTICS_EVENTS.SHARE_COMPLETED, {
          game_mode: shareData.gameMode,
          method: result.method,
        });
      } catch { /* analytics should never crash the app */ }
    } else {
      setImageShareStatus('error');
    }

    return result;
  }, [shareData]);

  // Determine which share handler to use
  const useImageSharing = !!(shareCardContent && shareData);
  const effectiveOnShare = useImageSharing ? handleImageShare : onShare;

  // Use share status hook for text-based sharing
  const { handleShare, buttonTitle: textButtonTitle, buttonColors: textButtonColors } = useShareStatus(
    useImageSharing ? undefined : onShare,
    {
      activeTopColor: colors.pitchGreen,
      activeShadowColor: colors.grassShadow,
      sharedTopColor: colors.glassBackground,
      sharedShadowColor: colors.glassBorder,
    }
  );

  // Compute button state for image sharing
  const imageButtonTitle = isImageSharing
    ? 'Sharing...'
    : imageShareStatus === 'shared'
    ? 'Shared!'
    : 'Share Result';

  const imageButtonColors = imageShareStatus === 'shared'
    ? { topColor: colors.glassBackground, shadowColor: colors.glassBorder }
    : { topColor: colors.pitchGreen, shadowColor: colors.grassShadow };

  // Select which button state to use
  const finalButtonTitle = useImageSharing ? imageButtonTitle : textButtonTitle;
  const finalButtonColors = useImageSharing ? imageButtonColors : textButtonColors;
  const finalHandleShare = useImageSharing ? handleImageShare : handleShare;

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
      setImageShareStatus('idle');
      triggerNotification(resultType === 'win' || resultType === 'complete' ? 'success' : 'error');
    }
  }, [visible, resultType, triggerNotification]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
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

          {/* Streak badge — only on first completion */}
          {effectiveStreakDays !== undefined && effectiveStreakDays > 0 && (
            <StreakBadge streakDays={effectiveStreakDays} />
          )}

          {/* Tier progress bar — only when IQ was gained */}
          {effectiveOldIQ !== undefined && effectiveNewIQ !== undefined && effectiveNewIQ > effectiveOldIQ && (
            <TierProgressBar oldIQ={effectiveOldIQ} newIQ={effectiveNewIQ} />
          )}

          {/* Context-sensitive premium upsell — shown after user has some experience */}
          {!effectiveIsPremium && showRetention && effectiveOldIQ !== undefined && effectiveOldIQ >= 15 && (
            <Pressable
              onPress={() => router.push('/premium-modal')}
              style={styles.upsellContainer}
            >
              <Text style={styles.upsellText}>
                {percentile !== undefined && percentile >= 75
                  ? `You're in the top ${100 - percentile}% today. `
                  : 'Track your accuracy across all modes. '}
                <Text style={styles.upsellLink}>
                  Unlock your full stats with Pro.
                </Text>
              </Text>
            </Pressable>
          )}

          {/* Action Buttons (unless custom layout in children) */}
          {!hideDefaultButtons && (
            <View style={styles.buttonContainer}>
              {effectiveOnShare && (
                <ElevatedButton
                  title={finalButtonTitle}
                  onPress={finalHandleShare}
                  size="small"
                  style={styles.buttonHalf}
                  topColor={finalButtonColors.topColor}
                  shadowColor={finalButtonColors.shadowColor}
                  disabled={isImageSharing}
                  testID="share-button"
                />
              )}
              {onReview ? (
                <ElevatedButton
                  title="Review"
                  onPress={onReview}
                  size="small"
                  style={styles.buttonHalf}
                  topColor={colors.cardYellow}
                  shadowColor="#B8960F"
                  testID="review-button"
                />
              ) : onClose && (
                <ElevatedButton
                  title={closeLabel}
                  onPress={onClose}
                  size="small"
                  style={effectiveOnShare ? styles.buttonHalf : styles.buttonFull}
                  topColor={colors.textSecondary}
                  shadowColor={colors.stadiumNavy}
                  testID="close-button"
                />
              )}
            </View>
          )}

          {/* Next Puzzle / Session Chaining */}
          {showNextPuzzle && (
            <View style={styles.nextPuzzleContainer}>
              {nextPuzzle.allDone ? (
                <View style={styles.allDoneContainer}>
                  <Text style={styles.allDoneText}>All Done!</Text>
                  <Text style={styles.allDoneSubtext}>
                    You've completed all {nextPuzzle.totalCount} puzzles today
                  </Text>
                </View>
              ) : nextPuzzle.hasNext ? (
                <ElevatedButton
                  title={nextPuzzle.buttonLabel!}
                  onPress={nextPuzzle.goToNext}
                  size="small"
                  style={styles.buttonFull}
                  topColor={colors.pitchGreen}
                  shadowColor="#1B7A3D"
                  testID="next-puzzle-button"
                />
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* Hidden ViewShot for image capture */}
        {shareCardContent && (
          <View style={styles.hiddenShareCard}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: 'png', quality: 1 }}
            >
              {shareCardContent}
            </ViewShot>
          </View>
        )}
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
    fontSize: 40,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scoreLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
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
  hiddenShareCard: {
    position: 'absolute',
    left: -10000,
    top: 0,
  },
  upsellContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  upsellText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  upsellLink: {
    textDecorationLine: 'underline',
  },
  nextPuzzleContainer: {
    width: '100%',
    marginTop: spacing.sm,
  },
  allDoneContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
  },
  allDoneText: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.pitchGreen,
    marginBottom: 4,
  },
  allDoneSubtext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
