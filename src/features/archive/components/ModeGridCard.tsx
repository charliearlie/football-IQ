/**
 * ModeGridCard Component
 *
 * 2-column grid card showing a game mode's aggregate progress across
 * all puzzles of that type (played count, avg score, progress bar).
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { GameModeIcon } from '@/components';
import { triggerLight } from '@/lib/haptics';
import { GameMode } from '@/features/puzzles/types/puzzle.types';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };
const CARD_DEPTH = 5;

const { width: screenWidth } = Dimensions.get('window');

// 20px padding on each side + 8px gap between columns → each card gets half remainder
const CARD_WIDTH = (screenWidth - 48) / 2;

interface ModeGridCardProps {
  gameMode: GameMode;
  title: string;
  playedCount: number;
  totalCount: number;
  hasUnplayed: boolean;
  lockedCount: number;
  onPress: () => void;
  testID?: string;
}

function ModeGridCardComponent({
  gameMode,
  title,
  playedCount,
  totalCount,
  hasUnplayed,
  lockedCount,
  onPress,
  testID,
}: ModeGridCardProps) {
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    triggerLight();
    translateY.value = withSpring(CARD_DEPTH, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    translateY.value = withSpring(0, SPRING_CONFIG);
  };

  // Border colour reflects card state
  const isCompleted = playedCount === totalCount && totalCount > 0;
  const isFullyLocked = lockedCount === totalCount;
  const hasActiveUnplayed = hasUnplayed && lockedCount < totalCount;

  const borderColor = isCompleted
    ? 'rgba(88,204,2,0.5)'
    : hasActiveUnplayed
    ? 'rgba(88,204,2,0.3)'
    : isFullyLocked
    ? 'rgba(250,204,21,0.2)'
    : HOME_COLORS.border;

  // Progress bar fill width as a 0–100 number (used via flex / explicit width calculation)
  const progressFraction = totalCount > 0 ? playedCount / totalCount : 0;

  const subtitleText =
    playedCount > 0
      ? `${playedCount} of ${totalCount} played`
      : `${totalCount} puzzles`;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.outer}
    >
      {/* Shadow Layer */}
      <View style={styles.shadowLayer} />

      {/* Top/Face Layer */}
      <Animated.View
        testID={testID}
        style={[
          styles.card,
          { borderColor, opacity: 1 },
          animatedStyle,
        ]}
      >
        {/* Top row: icon */}
        <View style={styles.topRow}>
          {/* Icon container */}
          <View style={styles.iconContainer}>
            <GameModeIcon gameMode={gameMode} size={22} />

            {/* Completion badge */}
            {isCompleted && (
              <View style={styles.completeBadge}>
                <Check size={12} color="#58CC02" strokeWidth={3} />
              </View>
            )}
          </View>
        </View>

        {/* Title + Subtitle — flex:1 pushes progress bar to bottom */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            {subtitleText}
          </Text>
        </View>

        {/* Progress bar — sits at bottom of fixed-height card */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressFraction * 100}%` as `${number}%` },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: CARD_WIDTH,
    paddingBottom: CARD_DEPTH,
    overflow: 'visible',
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: CARD_DEPTH,
    backgroundColor: HOME_COLORS.surfaceShadow,
    borderRadius: 16,
  },
  card: {
    height: 130,
    backgroundColor: HOME_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'column',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  completeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: HOME_COLORS.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: HOME_COLORS.stadiumNavy,
  },
  titleBlock: {
    flex: 1,
    marginTop: 6,
  },
  title: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 17,
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: HOME_FONTS.body,
    fontSize: 11,
    color: HOME_COLORS.textSecondary,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#58CC02',
  },
});

export const ModeGridCard = memo(ModeGridCardComponent, (prev, next) => {
  return (
    prev.playedCount === next.playedCount &&
    prev.totalCount === next.totalCount &&
    prev.hasUnplayed === next.hasUnplayed &&
    prev.lockedCount === next.lockedCount
  );
});
