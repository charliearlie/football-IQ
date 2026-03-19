/**
 * ClueCard Component
 *
 * Displays a single clue in the Who Am I? game.
 * Each clue is shown in a numbered card with progressive reveal styling.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, fonts } from '@/theme';
import { WhoAmIClue } from '../types/whoAmI.types';

interface ClueCardProps {
  clue: WhoAmIClue;
  index: number;
  isLatest: boolean;
  testID?: string;
}

export function ClueCard({ clue, index, isLatest, testID }: ClueCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={[styles.container, isLatest && styles.latestContainer]}
      testID={testID}
    >
      <View style={[styles.numberBadge, isLatest && styles.latestBadge]}>
        <Text style={[styles.numberText, isLatest && styles.latestNumberText]}>
          {clue.number}
        </Text>
      </View>
      <Text style={[styles.clueText, isLatest && styles.latestClueText]}>
        {clue.text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  latestContainer: {
    borderColor: colors.cardYellow,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  latestBadge: {
    backgroundColor: colors.cardYellow,
  },
  numberText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  latestNumberText: {
    color: colors.stadiumNavy,
  },
  clueText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    lineHeight: 22,
  },
  latestClueText: {
    color: colors.floodlightWhite,
  },
});
