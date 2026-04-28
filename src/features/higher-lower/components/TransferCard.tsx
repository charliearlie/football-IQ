/**
 * TransferCard Component
 *
 * Displays a player with their stat value (transfer fee, appearances, caps, etc.).
 *
 * Two variants:
 * - `compact`: Horizontal strip for the reference card (Player 1). Already-known value.
 * - `hero`: Large prominent card for the guess card (Player 2). The focus of the round.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleCheck, CircleX } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';
import type { StatType } from '../types/higherLower.types';
import { formatStatValue } from '../utils/formatStatValue';

export interface TransferCardProps {
  playerName: string;
  context: string;
  statLabel: string;
  statType: StatType;
  value: number;
  /** Whether the value is revealed (false = show "?") */
  revealed: boolean;
  /** When revealed, whether the answer was correct (affects highlight colour) */
  isCorrect?: boolean;
  /** 'compact' for reference card, 'hero' for guess card */
  variant?: 'compact' | 'hero';
  testID?: string;
}

export function TransferCard({
  playerName,
  context,
  statLabel,
  statType,
  value,
  revealed,
  isCorrect,
  variant = 'hero',
  testID,
}: TransferCardProps) {
  const valueString = formatStatValue(value, statType);

  const valueColor = revealed
    ? isCorrect === true
      ? colors.pitchGreen
      : isCorrect === false
        ? colors.redCard
        : colors.cardYellow
    : colors.cardYellow;

  if (variant === 'compact') {
    return (
      <View style={compactStyles.card} testID={testID}>
        <View style={compactStyles.left}>
          <Text style={compactStyles.playerName} numberOfLines={1} testID={testID ? `${testID}-name` : undefined}>
            {playerName}
          </Text>
          <Text style={compactStyles.detail} numberOfLines={1}>
            {context} · {statLabel}
          </Text>
        </View>
        <Text
          style={[compactStyles.value, { color: valueColor }]}
          testID={testID ? `${testID}-value` : undefined}
        >
          {valueString}
        </Text>
      </View>
    );
  }

  return (
    <View style={heroStyles.card} testID={testID}>
      <View style={heroStyles.playerInfo}>
        <Text style={heroStyles.playerName} numberOfLines={1} testID={testID ? `${testID}-name` : undefined}>
          {playerName}
        </Text>
        <Text style={heroStyles.contextName} numberOfLines={1} testID={testID ? `${testID}-context` : undefined}>
          {context}
        </Text>
        <Text style={heroStyles.statLabel} numberOfLines={1} testID={testID ? `${testID}-stat-label` : undefined}>
          {statLabel}
        </Text>
      </View>

      <View style={heroStyles.valueContainer}>
        {revealed ? (
          <>
            <Text
              style={[heroStyles.value, { color: valueColor }]}
              testID={testID ? `${testID}-value` : undefined}
            >
              {valueString}
            </Text>
            {isCorrect !== undefined && (
              <View style={heroStyles.feedbackRow}>
                {isCorrect ? (
                  <CircleCheck size={18} color={colors.pitchGreen} strokeWidth={2.5} />
                ) : (
                  <CircleX size={18} color={colors.redCard} strokeWidth={2.5} />
                )}
                <Text style={[heroStyles.feedbackText, { color: isCorrect ? colors.pitchGreen : colors.redCard }]}>
                  {isCorrect ? 'CORRECT' : 'WRONG'}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={heroStyles.hiddenValue} testID={testID ? `${testID}-value-hidden` : undefined}>
            <Text style={heroStyles.hiddenValueText}>?</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const compactStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
    marginRight: spacing.md,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    letterSpacing: 0.3,
  },
  detail: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  value: {
    fontFamily: fonts.stats,
    fontSize: 22,
    letterSpacing: 1,
  },
});

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  playerInfo: {
    alignItems: 'center',
    gap: 4,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 30,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  contextName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.cardYellow,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  value: {
    fontFamily: fonts.stats,
    fontSize: 36,
    letterSpacing: 1,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  feedbackText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 1,
  },
  hiddenValue: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenValueText: {
    fontFamily: fonts.stats,
    fontSize: 40,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
