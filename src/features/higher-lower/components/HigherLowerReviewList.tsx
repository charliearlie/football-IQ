/**
 * HigherLowerReviewList Component
 *
 * Review-mode UI for the Higher/Lower game. Shows each of the 10 rounds
 * with both entries revealed, the user's answer, and whether it was correct.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown, CircleCheck, CircleX } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';
import type { TransferPair } from '../types/higherLower.types';
import { formatStatValue } from '../utils/formatStatValue';

export interface HigherLowerReviewListProps {
  pairs: TransferPair[];
  answers: ('higher' | 'lower')[];
  results: boolean[];
  testID?: string;
}

export function HigherLowerReviewList({
  pairs,
  answers,
  results,
  testID,
}: HigherLowerReviewListProps) {
  return (
    <View style={styles.container} testID={testID}>
      {pairs.map((pair, index) => {
        const answer = answers[index];
        const isCorrect = results[index];
        const hasAnswer = answer !== undefined;

        return (
          <View
            key={index}
            style={[
              styles.roundCard,
              hasAnswer && (isCorrect ? styles.correctBorder : styles.wrongBorder),
            ]}
            testID={testID ? `${testID}-round-${index + 1}` : undefined}
          >
            <View style={styles.roundHeader}>
              <Text style={styles.roundLabel}>Round {index + 1}</Text>
              {hasAnswer && (
                <View style={styles.resultBadge}>
                  {isCorrect ? (
                    <CircleCheck size={16} color={colors.pitchGreen} strokeWidth={2.5} />
                  ) : (
                    <CircleX size={16} color={colors.redCard} strokeWidth={2.5} />
                  )}
                  <Text
                    style={[
                      styles.resultText,
                      { color: isCorrect ? colors.pitchGreen : colors.redCard },
                    ]}
                  >
                    {isCorrect ? 'CORRECT' : 'WRONG'}
                  </Text>
                </View>
              )}
            </View>

            {/* Player 1 row */}
            <ReviewEntry
              name={pair.player1.name}
              context={pair.player1.context}
              statLabel={pair.player1.statLabel}
              valueString={formatStatValue(pair.player1.value, pair.player1.statType)}
            />

            {/* Divider with user's answer */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              {hasAnswer ? (
                <View style={styles.answerPill}>
                  {answer === 'higher' ? (
                    <ArrowUp size={14} color={colors.floodlightWhite} strokeWidth={2.5} />
                  ) : (
                    <ArrowDown size={14} color={colors.floodlightWhite} strokeWidth={2.5} />
                  )}
                  <Text style={styles.answerPillText}>
                    YOU SAID {answer.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Text style={styles.answerPillMuted}>NOT PLAYED</Text>
              )}
              <View style={styles.dividerLine} />
            </View>

            {/* Player 2 row */}
            <ReviewEntry
              name={pair.player2.name}
              context={pair.player2.context}
              statLabel={pair.player2.statLabel}
              valueString={formatStatValue(pair.player2.value, pair.player2.statType)}
              emphasised
            />
          </View>
        );
      })}
    </View>
  );
}

interface ReviewEntryProps {
  name: string;
  context: string;
  statLabel: string;
  valueString: string;
  emphasised?: boolean;
}

function ReviewEntry({
  name,
  context,
  statLabel,
  valueString,
  emphasised = false,
}: ReviewEntryProps) {
  return (
    <View style={entryStyles.row}>
      <View style={entryStyles.left}>
        <Text
          style={[entryStyles.name, emphasised && entryStyles.nameEmphasised]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={entryStyles.detail} numberOfLines={1}>
          {context} · {statLabel}
        </Text>
      </View>
      <Text style={entryStyles.value}>{valueString}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  roundCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  correctBorder: {
    borderColor: 'rgba(57, 255, 20, 0.3)',
  },
  wrongBorder: {
    borderColor: 'rgba(255, 62, 62, 0.3)',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  answerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  answerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
  answerPillMuted: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    letterSpacing: 1,
    paddingHorizontal: spacing.sm,
  },
});

const entryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  left: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    letterSpacing: 0.3,
  },
  nameEmphasised: {
    fontSize: 17,
  },
  detail: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  value: {
    fontFamily: fonts.stats,
    fontSize: 22,
    color: colors.cardYellow,
    letterSpacing: 1,
  },
});
