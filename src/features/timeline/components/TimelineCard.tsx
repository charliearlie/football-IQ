/**
 * TimelineCard Component
 *
 * A single event card in the Timeline draggable list.
 * Supports 5 visual states: default, dragging, revealing-correct, revealing-incorrect, locked.
 * Year is hidden during play and revealed after submission.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GripVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import type { TimelineEvent } from '../types/timeline.types';

// Use the app's primary green for accents — purple was too disconnected
const accentColor = {
  primary: colors.pitchGreen,
  tint: 'rgba(46, 252, 93, 0.10)',
  border: 'rgba(46, 252, 93, 0.20)',
};

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export interface TimelineCardProps {
  event: TimelineEvent;
  index: number;
  isLocked: boolean;
  isRevealing: boolean;
  isCorrect: boolean | null;
  isDragging: boolean;
  showYear: boolean;
  drag?: () => void;
  testID?: string;
}

/**
 * TimelineCard - Draggable career event card with reveal animations.
 */
export function TimelineCard({
  event,
  index,
  isLocked,
  isRevealing,
  isCorrect,
  isDragging,
  showYear,
  drag,
  testID,
}: TimelineCardProps) {
  // Animation values
  const shakeX = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Shake animation for incorrect reveal
  useEffect(() => {
    if (isRevealing && isCorrect === false) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isRevealing, isCorrect]);

  // Pulse animation for correct reveal
  useEffect(() => {
    if (isRevealing && isCorrect === true) {
      pulseScale.value = withSequence(
        withTiming(1.03, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [isRevealing, isCorrect]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { scale: isDragging ? 1.03 : pulseScale.value },
    ],
  }));

  // Haptic feedback on drag start
  const handleDragStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    drag?.();
  };

  // Determine card state color
  let cardBg: string = colors.glassBackground;
  let cardBorder: string = 'rgba(255, 255, 255, 0.08)';

  if (isLocked) {
    cardBg = 'rgba(46, 252, 93, 0.1)';
    cardBorder = colors.pitchGreen;
  } else if (isRevealing && isCorrect === true) {
    cardBg = 'rgba(46, 252, 93, 0.15)';
    cardBorder = colors.pitchGreen;
  } else if (isRevealing && isCorrect === false) {
    cardBg = 'rgba(239, 68, 68, 0.15)';
    cardBorder = colors.redCard;
  } else if (isDragging) {
    cardBg = accentColor.tint;
    cardBorder = accentColor.primary;
  }

  const yearColor = isCorrect === false ? colors.redCard : colors.pitchGreen;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          shadowOpacity: isDragging ? 0.3 : 0,
        },
        animatedStyle,
      ]}
      testID={testID}
    >
      <Pressable
        onLongPress={!isLocked && drag ? handleDragStart : undefined}
        delayLongPress={150}
        disabled={isLocked || !drag}
        style={styles.pressableContent}
      >
        {/* Left: position number + drag handle */}
        <View style={styles.leftSection}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionText}>{index + 1}</Text>
          </View>
          {!isLocked && drag ? (
            <View onStartShouldSetResponder={() => true} onResponderGrant={handleDragStart}>
              <GripVertical size={16} color={accentColor.primary} strokeWidth={2} />
            </View>
          ) : null}
        </View>

        {/* Event content */}
        <View style={styles.content}>
          <Text style={styles.eventText} numberOfLines={2}>
            {event.text}
          </Text>
        </View>

        {/* Year + month — only shown after reveal/lock */}
        {showYear && (
          <View style={styles.yearSection}>
            {event.month && (
              <Text style={[styles.monthText, { color: yearColor }]}>
                {MONTH_ABBR[event.month - 1]}
              </Text>
            )}
            <Text style={[styles.yearText, { color: yearColor }]}>{event.year}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftSection: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    gap: 4,
  },
  positionBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: accentColor.tint,
    borderWidth: 1,
    borderColor: accentColor.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontFamily: fonts.stats,
    fontSize: 10,
    color: accentColor.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  eventText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.floodlightWhite,
    lineHeight: 19,
  },
  yearSection: {
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  yearText: {
    fontFamily: fonts.headline,
    fontSize: 18,
    fontWeight: '700',
  },
  monthText: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
