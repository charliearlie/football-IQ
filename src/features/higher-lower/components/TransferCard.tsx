/**
 * TransferCard Component
 *
 * Displays a player with their transfer fee.
 * Player 2's fee is hidden until the player answers.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '@/theme';
import { formatTransferFee } from '@/features/transfer-guess/utils/formatTransferFee';

export interface TransferCardProps {
  playerName: string;
  club: string;
  fee: number;
  /** Whether the fee is revealed (false = show "?") */
  revealed: boolean;
  /** When revealed, whether the answer was correct (affects highlight colour) */
  isCorrect?: boolean;
  testID?: string;
}

export function TransferCard({
  playerName,
  club,
  fee,
  revealed,
  isCorrect,
  testID,
}: TransferCardProps) {
  const feeString = formatTransferFee(`€${fee}m`);

  const feeColor = revealed
    ? isCorrect === true
      ? colors.pitchGreen
      : isCorrect === false
        ? colors.redCard
        : colors.cardYellow
    : colors.cardYellow;

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1} testID={testID ? `${testID}-name` : undefined}>
          {playerName}
        </Text>
        <Text style={styles.clubName} numberOfLines={1} testID={testID ? `${testID}-club` : undefined}>
          {club}
        </Text>
      </View>

      <View style={styles.feeContainer}>
        {revealed ? (
          <Text
            style={[styles.fee, { color: feeColor }]}
            testID={testID ? `${testID}-fee` : undefined}
          >
            {feeString}
          </Text>
        ) : (
          <View style={styles.hiddenFee} testID={testID ? `${testID}-fee-hidden` : undefined}>
            <Text style={styles.hiddenFeeText}>?</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  playerInfo: {
    alignItems: 'center',
    gap: 4,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 26,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  clubName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  feeContainer: {
    alignItems: 'center',
  },
  fee: {
    fontFamily: fonts.stats,
    fontSize: 28,
    letterSpacing: 1,
  },
  hiddenFee: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenFeeText: {
    fontFamily: fonts.stats,
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
