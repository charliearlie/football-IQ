/**
 * TimelineCard Component
 *
 * A single event card in the Timeline draggable list.
 * Supports 5 visual states: default, dragging, revealing-correct, revealing-incorrect, locked.
 * Year is hidden during play and revealed after submission.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GripVertical, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import type { TimelineEvent, TimelineEventType } from '../types/timeline.types';

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
 * Event type colors for badge chips.
 */
const EVENT_TYPE_COLORS: Record<TimelineEventType, string> = {
  transfer: colors.pitchGreen,
  achievement: colors.cardYellow,
  milestone: '#3B82F6',
  international: '#A855F7',
};

/**
 * Event type display labels.
 */
const EVENT_TYPE_LABELS: Record<TimelineEventType, string> = {
  transfer: 'Transfer',
  achievement: 'Achievement',
  milestone: 'Milestone',
  international: 'International',
};

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
  let cardBorder: string = colors.glassBorder;

  if (isLocked) {
    cardBg = 'rgba(88, 204, 2, 0.1)';
    cardBorder = colors.pitchGreen;
  } else if (isRevealing && isCorrect === true) {
    cardBg = 'rgba(88, 204, 2, 0.15)';
    cardBorder = colors.pitchGreen;
  } else if (isRevealing && isCorrect === false) {
    cardBg = 'rgba(239, 68, 68, 0.15)';
    cardBorder = colors.redCard;
  }

  const badgeColor = EVENT_TYPE_COLORS[event.type];
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
      {/* Left handle or lock icon */}
      <View style={styles.leftSection}>
        {isLocked ? (
          <Lock size={18} color={colors.pitchGreen} strokeWidth={2} />
        ) : drag ? (
          <View onStartShouldSetResponder={() => true} onResponderGrant={handleDragStart}>
            <GripVertical size={18} color={colors.textSecondary} strokeWidth={2} />
          </View>
        ) : null}
      </View>

      {/* Event content */}
      <View style={styles.content}>
        <Text style={styles.eventText} numberOfLines={2}>
          {event.text}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: `${badgeColor}20`, borderColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {EVENT_TYPE_LABELS[event.type]}
            </Text>
          </View>
        </View>
      </View>

      {/* Year — only shown after reveal/lock */}
      {showYear && (
        <View style={styles.yearSection}>
          <Text style={[styles.yearText, { color: yearColor }]}>{event.year}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  leftSection: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});
