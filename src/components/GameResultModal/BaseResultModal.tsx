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
  withTiming,
  withSequence,
  Easing,
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
import type { GameMode } from '@/features/puzzles/types/puzzle.types';
import { useChallenge } from '@/features/challenges';
import { getGameDisplayTitle } from '@/features/puzzles/constants/rules';
import { usePaywallExperiment } from '@/features/subscription/hooks/usePaywallExperiment';
import { useStoreReview } from '@/hooks/useStoreReview';

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

  /** Challenge button props — when all three are provided, renders ChallengeButton */
  puzzleId?: string;
  gameMode?: GameMode;
  challengeScore?: number;
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
 * Floating "+N IQ" animation that rises and fades above the title area.
 * Triggers once when the modal becomes visible, with a 500ms delay.
 */
function FloatingIQBadge({ iqEarned, visible }: { iqEarned: number; visible: boolean }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      translateY.value = 0;
      opacity.value = 0;
      return;
    }
    // Fade in quickly, float upward, then fade out
    opacity.value = withDelay(
      500,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
        withDelay(400, withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }))
      )
    );
    translateY.value = withDelay(
      500,
      withTiming(-48, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View testID="iq-badge" style={[floatingIQStyles.container, animatedStyle]} pointerEvents="none">
      <Text style={floatingIQStyles.text}>+{iqEarned} IQ</Text>
    </Animated.View>
  );
}

const floatingIQStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
  text: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.pitchGreen,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

/**
 * Tier progress bar shown in result modals after IQ gain.
 * When a tier change is detected, shows a "TIER UP!" celebration banner
 * below the bar with the new tier name highlighted in the tier color.
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
  const tierUpScale = useSharedValue(0.6);
  const tierUpOpacity = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withDelay(
      300,
      withSpring(newProgress, { damping: 15, stiffness: 80 })
    );
    if (tierChange.changed) {
      tierUpScale.value = withDelay(
        800,
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      tierUpOpacity.value = withDelay(
        800,
        withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
      );
    }
  }, [newProgress, tierChange.changed]);

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const tierUpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tierUpScale.value }],
    opacity: tierUpOpacity.value,
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
      {tierChange.changed ? (
        <Animated.View style={[tierBarStyles.tierUpContainer, tierUpAnimatedStyle]}>
          <Text style={tierBarStyles.tierUpLabel}>TIER UP!</Text>
          <Text style={[tierBarStyles.tierUpName, { color: tierColor }]}>
            {currentTier.name}
          </Text>
        </Animated.View>
      ) : (
        nextTier && (
          <Text style={tierBarStyles.nextTier}>
            {pointsToNext} to {nextTier.name}
          </Text>
        )
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
  tierUpContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 2,
  },
  tierUpLabel: {
    fontFamily: fonts.headline,
    fontSize: 13,
    color: colors.floodlightWhite,
    letterSpacing: 3,
  },
  tierUpName: {
    fontFamily: fonts.headline,
    fontSize: 20,
    letterSpacing: 1,
  },
});

const STREAK_MILESTONES = [7, 14, 30] as const;

interface UpsellBannerProps {
  oldIQ: number;
  newIQ: number | undefined;
  streakDays: number | undefined;
  percentile: number | undefined;
  onPress: () => void;
}

/**
 * Context-aware premium upsell shown inside the result modal.
 *
 * Priority order:
 * 1. Tier-up at tier 5+ — celebratory Gaffer-level copy
 * 2. Streak milestone (7/14/30 days) — freeze token pitch
 * 3. Default — accuracy/stats upsell
 */
function UpsellBanner({ oldIQ, newIQ, streakDays, percentile, onPress }: UpsellBannerProps) {
  const effectiveNewIQ = newIQ ?? oldIQ;
  const tierChange = didTierChange(oldIQ, effectiveNewIQ);
  const currentTier = getTierForPoints(effectiveNewIQ);
  const tierColor = getTierColor(currentTier.tier);

  const isHighTierUp = tierChange.changed && currentTier.tier >= 5;
  const isStreakMilestone =
    streakDays !== undefined &&
    STREAK_MILESTONES.some((m) => streakDays === m);

  if (isHighTierUp) {
    return (
      <Pressable onPress={onPress} style={upsellStyles.prominentContainer}>
        <Text style={[upsellStyles.prominentTitle, { color: tierColor }]}>
          You've reached {currentTier.name}.
        </Text>
        <Text style={upsellStyles.prominentBody}>
          Gaffer-level players use Pro to get ahead.{' '}
          <Text style={upsellStyles.link}>Unlock Pro</Text>
        </Text>
      </Pressable>
    );
  }

  if (isStreakMilestone) {
    return (
      <Pressable onPress={onPress} style={upsellStyles.prominentContainer}>
        <Text style={upsellStyles.prominentTitle}>
          {streakDays}-day streak!
        </Text>
        <Text style={upsellStyles.prominentBody}>
          Pro members protect their streak with freeze tokens.{' '}
          <Text style={upsellStyles.link}>Get Pro</Text>
        </Text>
      </Pressable>
    );
  }

  // Default upsell — slightly more prominent than the original small link
  return (
    <Pressable onPress={onPress} style={upsellStyles.defaultContainer}>
      <Text style={upsellStyles.defaultText}>
        {percentile !== undefined && percentile >= 75
          ? `You're in the top ${100 - percentile}% today. `
          : 'Track your accuracy across all modes. '}
        <Text style={upsellStyles.link}>Unlock your full stats with Pro.</Text>
      </Text>
    </Pressable>
  );
}

const upsellStyles = StyleSheet.create({
  prominentContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  prominentTitle: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
  prominentBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  defaultContainer: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  defaultText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.cardYellow,
    textAlign: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    fontFamily: fonts.body,
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
  puzzleId,
  gameMode,
  challengeScore,
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

  // Challenge a friend
  const canChallenge = !!(puzzleId && gameMode && challengeScore !== undefined);
  const { challengeState, createAndShare: createAndShareChallenge } = useChallenge();

  // Store review prompt at high-engagement moments
  const tierChanged = effectiveOldIQ !== undefined && effectiveNewIQ !== undefined
    ? didTierChange(effectiveOldIQ, effectiveNewIQ).changed
    : false;
  useStoreReview({ visible, resultType, streakDays: effectiveStreakDays, tierChanged });

  // A/B test: paywall after first win
  const { maybeTriggerPostWinPaywall } = usePaywallExperiment();

  // Trigger paywall experiment when modal becomes visible with a win result
  useEffect(() => {
    if (visible && (resultType === 'win' || resultType === 'complete') && iqEarned !== undefined) {
      maybeTriggerPostWinPaywall();
    }
  }, [visible, resultType, iqEarned, maybeTriggerPostWinPaywall]);

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
  }, [shareData, posthog]);

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
          entering={SlideInDown.springify().damping(20).mass(0.8).stiffness(100)}
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

          {/* Floating IQ animation — sits above the title, triggered on modal open */}
          {showRetention && iqEarned !== undefined && iqEarned > 0 && (
            <FloatingIQBadge iqEarned={iqEarned} visible={visible} />
          )}

          {/* Title */}
          <Text style={[styles.title, { color: accentColor }]}>{title}</Text>

          {/* Game-specific content */}
          {children}

          {/* Message (if provided) */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Streak badge — only on first completion */}
          {effectiveStreakDays !== undefined && effectiveStreakDays > 0 && (
            <View testID="streak-badge">
              <StreakBadge streakDays={effectiveStreakDays} />
            </View>
          )}

          {/* Tier progress bar — only when IQ was gained */}
          {effectiveOldIQ !== undefined && effectiveNewIQ !== undefined && effectiveNewIQ > effectiveOldIQ && (
            <View testID="tier-progress-bar">
              <TierProgressBar oldIQ={effectiveOldIQ} newIQ={effectiveNewIQ} />
            </View>
          )}

          {/* Context-sensitive premium upsell */}
          {!effectiveIsPremium && showRetention && effectiveOldIQ !== undefined && effectiveOldIQ >= 15 && (
            <View testID="upsell-banner">
              <UpsellBanner
                oldIQ={effectiveOldIQ}
                newIQ={effectiveNewIQ}
                streakDays={effectiveStreakDays}
                percentile={percentile}
                onPress={() => router.push('/premium-modal')}
              />
            </View>
          )}

          {/* All Done message when all puzzles completed */}
          {showNextPuzzle && nextPuzzle.allDone && (
            <View style={styles.nextPuzzleContainer}>
              <View style={styles.allDoneContainer}>
                <Text style={styles.allDoneText}>All Done!</Text>
                <Text style={styles.allDoneSubtext}>
                  You've completed all {nextPuzzle.totalCount} puzzles today
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons (unless custom layout in children) */}
          {!hideDefaultButtons && (
            <View style={styles.buttonColumnContainer}>
              {/* When next puzzle available: Share full width, then Next Game + Done side by side */}
              {showNextPuzzle && nextPuzzle.hasNext && !nextPuzzle.allDone ? (
                <>
                  <View style={styles.buttonContainer}>
                    <ElevatedButton
                      title={nextPuzzle.buttonLabel ?? 'Next Puzzle'}
                      onPress={nextPuzzle.goToNext}
                      size="small"
                      style={styles.buttonHalf}
                      variant="secondary"
                      testID="next-puzzle-button"
                    />
                    {effectiveOnShare ? (
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
                    ) : onClose ? (
                      <ElevatedButton
                        title={closeLabel}
                        onPress={onClose}
                        size="small"
                        style={styles.buttonHalf}
                        topColor={colors.textSecondary}
                        shadowColor={colors.stadiumNavy}
                        testID="close-button"
                      />
                    ) : null}
                  </View>
                  {effectiveOnShare && onClose && (
                    <Pressable onPress={onClose} style={styles.closeLinkContainer}>
                      <Text style={styles.closeLinkText}>{closeLabel}</Text>
                    </Pressable>
                  )}
                </>
              ) : (
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

              {/* Challenge a Friend button */}
              {canChallenge && resultType !== 'loss' && (
                <Pressable
                  testID="challenge-button"
                  onPress={() => {
                    if (challengeState === 'idle' || challengeState === 'error') {
                      createAndShareChallenge({
                        gameMode: gameMode!,
                        puzzleId: puzzleId!,
                        score: challengeScore!,
                        scoreDisplay: undefined,
                        gameModeName: getGameDisplayTitle(gameMode!),
                      });
                    }
                  }}
                  disabled={challengeState === 'creating' || challengeState === 'sharing'}
                  style={styles.challengeButton}
                >
                  <Text style={styles.challengeButtonText}>
                    {challengeState === 'creating' ? '⏳ Creating...' :
                     challengeState === 'sharing' ? '📤 Sharing...' :
                     challengeState === 'shared' ? '✅ Shared!' :
                     challengeState === 'error' ? '❌ Try again' :
                     '🏆 Challenge a Friend'}
                  </Text>
                </Pressable>
              )}

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    maxHeight: '95%',
    flexGrow: 0,
    flexShrink: 1,
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
  buttonColumnContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  closeLinkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  closeLinkText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
  challengeButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    alignItems: 'center' as const,
  },
  challengeButtonText: {
    fontFamily: fonts.headline,
    fontSize: 14,
    letterSpacing: 0.5,
    color: colors.cardYellow,
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
