/**
 * PercentileTag - Small inline "Top X%" pill badge.
 *
 * Annotates stats with a user's percentile standing. Designed to sit
 * inline beside stat values inside Scout Report cards.
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontWeights, borderRadius } from '@/theme';

export interface PercentileTagProps {
  /** e.g. 15 renders "Top 15%" */
  percentile: number;
  testID?: string;
}

export function PercentileTag({ percentile, testID }: PercentileTagProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>Top {percentile}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(46, 252, 93, 0.15)',
    borderRadius: borderRadius.full,
    height: 20,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontWeight: fontWeights.bold,
    fontSize: 11,
    color: colors.pitchGreen,
    lineHeight: 14,
  },
});
