/**
 * CompletedStamp Component
 *
 * A badge for completed game cards that differentiates wins from losses.
 * - Win: Trophy on green background (celebratory)
 * - Loss: Check on gray background (completed but not victorious)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Trophy, Check } from 'lucide-react-native';
import { colors } from '@/theme';

interface CompletedStampProps {
  /**
   * Whether the user won/succeeded. Defaults to true.
   */
  won?: boolean;
  /**
   * Test ID for testing.
   */
  testID?: string;
}

/**
 * CompletedStamp - Completion badge with win/loss differentiation.
 *
 * Shows:
 * - Trophy on green for wins (celebratory)
 * - Checkmark on gray for losses (completed, not victorious)
 */
export function CompletedStamp({ won = true, testID }: CompletedStampProps) {
  return (
    <View
      style={[styles.container, won ? styles.winContainer : styles.lossContainer]}
      testID={testID}
    >
      {won ? (
        <Trophy size={20} color={colors.stadiumNavy} strokeWidth={2.5} />
      ) : (
        <Check size={20} color={colors.floodlightWhite} strokeWidth={2.5} />
      )}
    </View>
  );
}

const BADGE_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winContainer: {
    backgroundColor: colors.pitchGreen,
  },
  lossContainer: {
    backgroundColor: colors.textSecondary,
  },
});
