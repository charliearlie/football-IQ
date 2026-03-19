/**
 * PlayToUnlockBanner Component
 *
 * Shows progress toward earning a free archive unlock:
 * - "Complete N more puzzles to unlock an archive game"
 * - Celebration state when unlock is granted
 *
 * Only visible for free users who haven't yet earned today's unlock.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Unlock, Gift, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { spacing } from '@/theme';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';

interface PlayToUnlockBannerProps {
  /** Number of puzzles completed today */
  completedToday: number;
  /** Number of completions still needed */
  remaining: number;
  /** Whether the unlock has been granted */
  unlockGranted: boolean;
  /** Whether an unlock was just granted (for celebration) */
  justUnlocked: boolean;
  /** Navigate to archive to play the unlocked puzzle */
  onGoToArchive?: () => void;
  testID?: string;
}

const REQUIRED = 3;

export function PlayToUnlockBanner({
  completedToday,
  remaining,
  unlockGranted,
  justUnlocked,
  onGoToArchive,
  testID,
}: PlayToUnlockBannerProps) {
  // Don't show if already granted and not in celebration state
  if (unlockGranted && !justUnlocked) return null;

  const progress = Math.min(completedToday, REQUIRED);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
      testID={testID}
    >
      {justUnlocked ? (
        // Celebration state
        <Pressable onPress={onGoToArchive}>
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.contentContainer}>
              <View style={styles.leftContent}>
                <View style={styles.headerRow}>
                  <Gift size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.headerText}>ARCHIVE UNLOCKED!</Text>
                </View>
                <Text style={styles.bodyText}>
                  You earned a free archive game. Go play it!
                </Text>
              </View>
              <View style={styles.ctaButton}>
                <ChevronRight size={20} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      ) : (
        // Progress state
        <LinearGradient
          colors={['#1E3A5F', '#2D4A6F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <View style={styles.leftContent}>
              <View style={styles.headerRow}>
                <Unlock size={18} color="#10B981" strokeWidth={2} />
                <Text style={styles.headerText}>PLAY TO UNLOCK</Text>
              </View>
              <Text style={styles.bodyText}>
                {remaining === 1
                  ? 'Complete 1 more puzzle to unlock an archive game'
                  : `Complete ${remaining} more puzzles to unlock an archive game`}
              </Text>
            </View>
          </View>

          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {Array.from({ length: REQUIRED }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < progress && styles.progressDotFilled,
                ]}
              />
            ))}
          </View>
        </LinearGradient>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  gradient: {
    padding: spacing.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  headerText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 18,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  bodyText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: HOME_COLORS.textMain,
    opacity: 0.85,
  },
  ctaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  progressDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotFilled: {
    backgroundColor: '#10B981',
  },
});
