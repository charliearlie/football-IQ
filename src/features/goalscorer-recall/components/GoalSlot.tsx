/**
 * Goal Slot component for Goalscorer Recall.
 *
 * Displays a single goal slot that can be:
 * - Locked: Shows "???" placeholder with minute badge
 * - Revealed/Found: Shows player name with minute badge (green, spring animation)
 * - Missed: Shows player name revealed in red (for end-of-game reveal)
 * - Own Goal: Always revealed with "OG" badge, dimmed styling
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import type { GoalWithState } from '../types/goalscorerRecall.types';

interface GoalSlotProps {
  goal: GoalWithState;
  isJustFound?: boolean;
  /** Show as missed (red) - reveals name in red styling */
  isMissed?: boolean;
}

const ENTRANCE_SPRING = {
  damping: 12,
  stiffness: 100,
  mass: 0.8,
};

export function GoalSlot({ goal, isJustFound = false, isMissed = false }: GoalSlotProps) {
  const { scorer, minute, found, isOwnGoal } = goal;

  // Determine if the scorer name should be visible
  const showName = found || isMissed || isOwnGoal;

  const animatedStyle = useAnimatedStyle(() => {
    if (found && isJustFound) {
      return {
        transform: [{ scale: withSpring(1, ENTRANCE_SPRING) }],
        opacity: withSpring(1, ENTRANCE_SPRING),
      };
    }
    return {
      transform: [{ scale: 1 }],
      opacity: 1,
    };
  }, [found, isJustFound]);

  // Format minute (e.g., "45'" or "90+3'")
  const formatMinute = (min: number): string => {
    if (min > 90) {
      return `90+${min - 90}'`;
    }
    if (min > 45 && min <= 48) {
      return `45+${min - 45}'`;
    }
    return `${min}'`;
  };

  // Determine container style based on state
  const getContainerStyle = () => {
    if (isOwnGoal) return styles.ownGoalContainer;
    if (found) return styles.foundContainer;
    if (isMissed) return styles.missedContainer;
    return null;
  };

  // Format scorer name (e.g., "Steven Gerrard" -> "S. Gerrard")
  const formatScorerName = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length < 2) return name;
    
    // Check if first part is a known exception (e.g. "De", "Van", "Di")
    // If so, we might want to keep it, but for now simple initial logic is usually sufficient
    // or just abbreviate the first name.
    
    const firstName = parts[0];
    const rest = parts.slice(1).join(' ');
    return `${firstName.charAt(0)}. ${rest}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getContainerStyle(),
        animatedStyle,
      ]}
      layout={Layout.springify()}
    >
      {/* Minute Badge */}
      <View
        style={[
          styles.minuteBadge,
          isOwnGoal && styles.ownGoalBadge,
          isMissed && !isOwnGoal && styles.missedBadge,
        ]}
      >
        <Text style={styles.minuteText}>{formatMinute(minute)}</Text>
      </View>

      {/* Scorer Name or Placeholder */}
      <View style={styles.scorerContainer}>
        {showName ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text
              style={[
                styles.scorerName,
                isOwnGoal && styles.ownGoalText,
                isMissed && !isOwnGoal && styles.missedText,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {formatScorerName(scorer)}
              {isOwnGoal && <Text style={styles.ownGoalLabel}> (OG)</Text>}
            </Text>
          </Animated.View>
        ) : (
          <Text style={styles.placeholder}>???</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6, // Reduced from standard spacing
    paddingHorizontal: spacing.sm,
    marginVertical: 2, // Reduced margin
  },
  foundContainer: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderColor: colors.pitchGreen,
  },
  missedContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.redCard,
  },
  ownGoalContainer: {
    opacity: 0.6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.redCard,
  },
  minuteBadge: {
    backgroundColor: colors.cardYellow,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedBadge: {
    backgroundColor: colors.redCard,
  },
  ownGoalBadge: {
    backgroundColor: colors.redCard,
  },
  minuteText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 12,
    color: colors.stadiumNavy,
  },
  scorerContainer: {
    flex: 1,
    marginLeft: spacing.sm, // Reduced spacing
  },
  scorerName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 15, // Slightly reduced from 16
    color: colors.floodlightWhite,
  },
  missedText: {
    color: colors.redCard,
  },
  ownGoalText: {
    color: colors.redCard,
  },
  ownGoalLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    opacity: 0.8,
  },
  placeholder: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 15,
    color: colors.floodlightWhite,
    opacity: 0.4,
  },
});
