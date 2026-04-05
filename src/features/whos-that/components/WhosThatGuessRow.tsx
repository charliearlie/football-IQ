/**
 * BalldeGuessRow Component
 *
 * A single row in the Balldle grid showing one guess with
 * colour-coded attribute cells: club, league, nationality, position, age.
 */

import { View, Text, StyleSheet } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { colors, spacing, fonts } from '@/theme';
import { GuessFeedback, FeedbackColor } from '../types/balldle.types';

const FEEDBACK_COLORS: Record<FeedbackColor, string> = {
  green: colors.pitchGreen,
  yellow: colors.cardYellow,
  red: colors.redCard,
};

const FEEDBACK_TEXT_COLORS: Record<FeedbackColor, string> = {
  green: colors.stadiumNavy,
  yellow: colors.stadiumNavy,
  red: colors.floodlightWhite,
};

const ATTRIBUTE_LABELS = ['Club', 'League', 'Nat.', 'Pos.', 'Age'];

export interface BalldeGuessRowProps {
  guess: GuessFeedback;
  testID?: string;
}

export function BalldeGuessRow({ guess, testID }: BalldeGuessRowProps) {
  const attributes = [
    guess.club,
    guess.league,
    guess.nationality,
    guess.position,
    guess.age,
  ];

  return (
    <View style={styles.row} testID={testID}>
      {/* Player name */}
      <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
        {guess.playerName}
      </Text>

      {/* Attribute cells */}
      <View style={styles.cellsRow}>
        {attributes.map((attr, index) => {
          const bg = FEEDBACK_COLORS[attr.color];
          const textColor = FEEDBACK_TEXT_COLORS[attr.color];
          return (
            <View
              key={ATTRIBUTE_LABELS[index]}
              style={[styles.cell, { backgroundColor: bg }]}
              testID={testID ? `${testID}-cell-${index}` : undefined}
            >
              <Text style={[styles.cellLabel, { color: textColor }]}>
                {ATTRIBUTE_LABELS[index]}
              </Text>
              <View style={styles.cellValueRow}>
                <Text
                  style={[styles.cellValue, { color: textColor }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {attr.value}
                </Text>
                {attr.direction === 'up' && (
                  <ArrowUp size={10} color={textColor} strokeWidth={2.5} />
                )}
                {attr.direction === 'down' && (
                  <ArrowDown size={10} color={textColor} strokeWidth={2.5} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.xs,
  },
  playerName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.floodlightWhite,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  cellsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cellLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  cellValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  cellValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    textAlign: 'center',
  },
});
