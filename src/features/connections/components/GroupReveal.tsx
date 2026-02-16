/**
 * GroupReveal Component
 *
 * Displays a solved group with colored banner and player names.
 * Animates in when revealed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ConnectionsGroup, ConnectionsDifficulty } from '../types/connections.types';
import { colors, fonts, borderRadius, spacing } from '@/theme';

export interface GroupRevealProps {
  group: ConnectionsGroup;
  testID?: string;
}

/**
 * Color map for difficulty levels.
 */
const DIFFICULTY_COLORS: Record<ConnectionsDifficulty, string> = {
  yellow: '#FACC15',
  green: '#58CC02',
  blue: '#3B82F6',
  purple: '#A855F7',
};

/**
 * GroupReveal - Shows a solved group with difficulty color.
 */
export function GroupReveal({ group, testID }: GroupRevealProps) {
  const backgroundColor = DIFFICULTY_COLORS[group.difficulty];

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, { backgroundColor }]}
      testID={testID}
    >
      <Text style={styles.category}>{group.category}</Text>
      <View style={styles.playersContainer}>
        {group.players.map((player, index) => (
          <React.Fragment key={player}>
            <Text style={styles.playerName}>{player}</Text>
            {index < group.players.length - 1 && <Text style={styles.separator}>, </Text>}
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  category: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
    color: colors.stadiumNavy,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  playersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  playerName: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '500',
    color: colors.stadiumNavy,
  },
  separator: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.stadiumNavy,
  },
});
