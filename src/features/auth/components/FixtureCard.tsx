/**
 * FixtureCard Component
 *
 * Compact card displaying a single game mode fixture for the briefing screen.
 * Based on MiniGameCard styling with glass morphism effect.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProBadge } from '@/components/ProBadge';
import { GameModeIcon } from '@/components';
import { colors, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { BriefingFixture } from '../constants/briefingSchedule';

interface FixtureCardProps {
  /** Fixture data */
  fixture: BriefingFixture;
  /** Test ID for testing */
  testID?: string;
}

/**
 * FixtureCard - Compact fixture display card
 *
 * Shows game mode icon, label, and schedule days.
 * Premium modes display a crown badge.
 */
function FixtureCardComponent({ fixture, testID }: FixtureCardProps) {
  const { gameMode, label, days, isPremium } = fixture;

  return (
    <View style={styles.card} testID={testID}>
      {/* Icon container */}
      <View style={styles.iconContainer}>
        <GameModeIcon gameMode={gameMode} size={22} />

        {/* Premium badge */}
        {isPremium && (
          <View style={styles.premiumBadge}>
            <ProBadge size={7} color={colors.stadiumNavy} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.days, isPremium && styles.daysPremium]} numberOfLines={1}>
          {days}
        </Text>
      </View>
    </View>
  );
}

/**
 * Memoized FixtureCard to prevent unnecessary re-renders.
 */
export const FixtureCard = memo(FixtureCardComponent, (prev, next) => {
  return prev.fixture.gameMode === next.fixture.gameMode;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.stadiumNavy,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    color: colors.floodlightWhite,
    marginBottom: 2,
  },
  days: {
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
  },
  daysPremium: {
    color: colors.cardYellow,
  },
});
