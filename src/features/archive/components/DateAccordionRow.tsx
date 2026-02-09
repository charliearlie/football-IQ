/**
 * DateAccordionRow Component
 *
 * Collapsed date row for the Match Calendar accordion.
 * Shows date, completion count, at-a-glance icons, and expand chevron.
 *
 * Layout: JAN 19 • 6/8 COMPLETED [icons...] ▶
 */

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, Trophy } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { triggerLight } from '@/lib/haptics';
import { ArchiveDateGroup } from '../types/archive.types';
import { AtAGlanceBar } from './AtAGlanceBar';

interface DateAccordionRowProps {
  /** Date group data */
  group: ArchiveDateGroup;
  /** Whether this row is currently expanded */
  isExpanded: boolean;
  /** Callback when row is tapped to toggle expansion */
  onToggle: () => void;
  /** Test ID for testing */
  testID?: string;
}

const SPRING_CONFIG = { damping: 12, stiffness: 150 };

/**
 * DateAccordionRow - Compact date row with at-a-glance status.
 *
 * Features:
 * - Animated chevron rotation on expand/collapse
 * - Subtle background highlight when expanded
 * - Perfect day indicator (trophy icon)
 * - Haptic feedback on tap
 */
function DateAccordionRowComponent({
  group,
  isExpanded,
  onToggle,
  testID,
}: DateAccordionRowProps) {
  // Animation values
  const rotation = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  // Animate on expansion state change
  useEffect(() => {
    rotation.value = withSpring(isExpanded ? 90 : 0, SPRING_CONFIG);
    bgOpacity.value = withTiming(isExpanded ? 0.08 : 0, { duration: 200 });
  }, [isExpanded, rotation, bgOpacity]);

  // Animated styles
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const rowBgStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(88, 204, 2, ${bgOpacity.value})`,
  }));

  // Handle press with haptic feedback
  const handlePress = () => {
    triggerLight();
    onToggle();
  };

  // Format completion text
  const completionText = `${group.completedCount}/${group.totalCount}`;

  return (
    <Pressable onPress={handlePress} testID={testID}>
      <Animated.View style={[styles.container, rowBgStyle]}>
        {/* Left: Date and completion count */}
        <View style={styles.leftSection}>
          <Text style={styles.dateLabel}>{group.dateLabel}</Text>
          <View style={styles.completionContainer}>
            {group.isPerfectDay ? (
              <>
                <Trophy size={12} color={colors.cardYellow} />
                <Text style={[styles.completionText, styles.perfectText]}>
                  PERFECT
                </Text>
              </>
            ) : (
              <Text style={styles.completionText}>{completionText}</Text>
            )}
          </View>
        </View>

        {/* Center: At-a-Glance icons */}
        <View style={styles.centerSection}>
          <AtAGlanceBar puzzles={group.puzzles} testID={`${testID}-icons`} />
        </View>

        {/* Right: Chevron */}
        <Animated.View style={[styles.chevronContainer, chevronStyle]}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Memoized DateAccordionRow to prevent re-renders when other rows change.
 */
export const DateAccordionRow = memo(DateAccordionRowComponent, (prev, next) => {
  return (
    prev.group.dateKey === next.group.dateKey &&
    prev.isExpanded === next.isExpanded &&
    prev.group.completedCount === next.group.completedCount &&
    prev.group.totalCount === next.group.totalCount
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  dateLabel: {
    ...textStyles.subtitle,
    color: colors.floodlightWhite,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  completionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: 4,
  },
  completionText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  perfectText: {
    color: colors.cardYellow,
    fontWeight: '600',
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
