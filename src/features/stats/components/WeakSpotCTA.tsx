/**
 * WeakSpotCTA - Personalized call-to-action targeting the user's weakest game mode.
 *
 * Surfaces the game mode with the lowest accuracy and invites the user to
 * play it today. Part of the Scout Report "Deep Dive" zone.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Target, ChevronRight } from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { WeakSpotInfo } from '../types/scoutReport.types';

export interface WeakSpotCTAProps {
  weakSpot: WeakSpotInfo;
  onPress: () => void;
  testID?: string;
}

export function WeakSpotCTA({ weakSpot, onPress, testID }: WeakSpotCTAProps) {
  const { displayName, accuracy } = weakSpot;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Improve your ${displayName} accuracy. Currently ${accuracy}%. Play today.`}
      testID={testID}
    >
      {/* Green accent border strip */}
      <View style={styles.accentBar} />

      {/* Leading icon */}
      <View style={styles.iconContainer}>
        <Target size={18} color={colors.pitchGreen} strokeWidth={2} />
      </View>

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text style={styles.primaryText}>
          Your {displayName} accuracy is {accuracy}%.
        </Text>
        <Text style={styles.secondaryText}>
          Play today's and level up your report.
        </Text>
      </View>

      {/* Trailing chevron */}
      <ChevronRight size={20} color={colors.pitchGreen} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
  containerPressed: {
    opacity: 0.75,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: colors.pitchGreen,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 252, 93, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  primaryText: {
    fontFamily: fonts.bodySemiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    color: colors.floodlightWhite,
    lineHeight: 20,
  },
  secondaryText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
