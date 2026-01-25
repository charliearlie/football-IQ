/**
 * RewardBanner Component
 *
 * Pitch Green banner displaying the Pro subscription reward incentive.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gift } from 'lucide-react-native';
import { colors, spacing, borderRadius, fonts } from '@/theme';

export interface RewardBannerProps {
  testID?: string;
}

export function RewardBanner({ testID }: RewardBannerProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Gift size={24} color={colors.stadiumNavy} strokeWidth={2.5} />
      <Text style={styles.text}>
        IF WE USE YOUR IDEA, YOU WIN 1 YEAR OF PRO.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.pitchGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.stadiumNavy,
    flex: 1,
    letterSpacing: 0.5,
  },
});
