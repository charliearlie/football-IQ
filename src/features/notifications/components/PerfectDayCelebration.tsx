/**
 * Perfect Day Celebration
 *
 * Full-screen celebration modal shown when user completes all daily puzzles.
 * Features:
 * - Confetti animation
 * - Unique haptic pattern (Success -> Success -> Heavy)
 * - Shareable card for social media
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import Animated, {
  FadeIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Trophy, Share2, X, Flame, Calendar } from 'lucide-react-native';
import { Confetti } from '@/components/Confetti';
import { ElevatedButton } from '@/components/ElevatedButton';
import { triggerPerfectDay } from '@/lib/haptics';
import { getAuthorizedDateUnsafe } from '@/lib/time';
import { colors, spacing, borderRadius, fonts, fontWeights, textStyles } from '@/theme';
import type { PerfectDayCelebrationProps } from '../types';

/**
 * Format date for display (e.g., "January 18, 2026")
 */
function formatDateForDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * The shareable Perfect Day card component.
 */
function PerfectDayCard({
  puzzleCount,
  streakCount,
}: {
  puzzleCount: number;
  streakCount: number;
}) {
  const today = getAuthorizedDateUnsafe();
  const formattedDate = formatDateForDisplay(today);

  return (
    <View style={styles.shareCard}>
      {/* Gradient-like background effect */}
      <View style={styles.cardGlow} />

      {/* Trophy Icon */}
      <View style={styles.trophyContainer}>
        <Trophy size={64} color={colors.cardYellow} strokeWidth={1.5} />
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>PERFECT DAY!</Text>

      {/* Date */}
      <View style={styles.dateRow}>
        <Calendar size={14} color={colors.textSecondary} />
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{puzzleCount}</Text>
          <Text style={styles.statLabel}>puzzles</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Flame size={16} color="#FF6B35" />
          <Text style={styles.statValue}>{streakCount}</Text>
          <Text style={styles.statLabel}>day streak</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Football IQ</Text>
      </View>
    </View>
  );
}

export function PerfectDayCelebration({
  visible,
  puzzleCount,
  streakCount,
  onDismiss,
  onShare,
  testID,
}: PerfectDayCelebrationProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const cardScale = useSharedValue(0.8);

  // Trigger haptics and confetti when modal appears
  useEffect(() => {
    if (visible) {
      // Trigger haptics
      triggerPerfectDay();

      // Start card spring animation
      cardScale.value = withSpring(1, {
        damping: 12,
        stiffness: 150,
      });

      // Start confetti after small delay
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      cardScale.value = 0.8;
    }
  }, [visible, cardScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      // Capture the card as image
      const uri = await viewShotRef.current?.capture?.();

      if (uri) {
        const today = getAuthorizedDateUnsafe();
        const message = `Perfect Day on Football IQ! Completed all ${puzzleCount} puzzles today. Can you beat my streak of ${streakCount} days?`;

        await Share.share(
          Platform.select({
            ios: { url: uri, message },
            default: { message: `${message}\n\nDownload: footballiq.app` },
          }) || { message }
        );
      }

      await onShare();
    } catch (error) {
      console.error('[PerfectDay] Share error:', error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, puzzleCount, streakCount, onShare]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID={testID}
    >
      <View style={styles.overlay}>
        {/* Confetti layer */}
        <Confetti active={showConfetti} testID={testID ? `${testID}-confetti` : undefined} />

        {/* Content */}
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.container}
        >
          {/* Close button */}
          <Pressable
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={16}
            testID={testID ? `${testID}-close` : undefined}
          >
            <X size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Card */}
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <PerfectDayCard puzzleCount={puzzleCount} streakCount={streakCount} />
            </ViewShot>
          </Animated.View>

          {/* Subtitle */}
          <Animated.Text
            entering={FadeIn.delay(300)}
            style={styles.subtitle}
          >
            You completed all {puzzleCount} puzzles today!
          </Animated.Text>

          {/* Buttons */}
          <Animated.View
            entering={FadeIn.delay(400)}
            style={styles.buttonContainer}
          >
            <ElevatedButton
              title={isSharing ? 'Sharing...' : 'Share'}
              onPress={handleShare}
              disabled={isSharing}
              icon={<Share2 size={18} color={colors.stadiumNavy} />}
              testID={testID ? `${testID}-share` : undefined}
            />
          </Animated.View>

          {/* Dismiss link */}
          <Animated.View entering={FadeIn.delay(500)}>
            <Pressable
              onPress={onDismiss}
              style={styles.dismissButton}
              testID={testID ? `${testID}-dismiss` : undefined}
            >
              <Text style={styles.dismissText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },

  // Share Card Styles
  shareCard: {
    width: 280,
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.cardYellow,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.cardYellow,
    opacity: 0.1,
  },
  trophyContainer: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  statValue: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.floodlightWhite,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.glassBorder,
  },
  cardFooter: {
    marginTop: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  // Modal Styles
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    marginBottom: spacing.md,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dismissText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
