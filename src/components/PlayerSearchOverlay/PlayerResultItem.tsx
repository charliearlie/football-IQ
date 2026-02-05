/**
 * PlayerResultItem Component
 *
 * Displays a single player search result with:
 * - Nationality emoji flag(s)
 * - Player name (Bebas Neue)
 * - Clubs list (Montserrat, truncated)
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { ParsedPlayer } from '@/types/database';
import { FlagIcon } from '@/components/FlagIcon';
import { triggerSelection } from '@/lib/haptics';

export interface PlayerResultItemProps {
  /** Player data to display */
  player: ParsedPlayer;
  /** Callback when item is pressed */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

/** Maximum number of clubs to display before truncating */
const MAX_CLUBS_DISPLAY = 4;

/**
 * PlayerResultItem
 *
 * A pressable row displaying player information in search results.
 * Shows nationality flags, full name, and a truncated list of clubs.
 */
export function PlayerResultItem({
  player,
  onPress,
  testID,
}: PlayerResultItemProps) {
  // Handle press with haptic feedback
  const handlePress = () => {
    triggerSelection();
    onPress();
  };

  // Filter valid nationality codes for flag rendering
  const nationalityCodes = player.nationalities.filter(Boolean);

  // Format clubs as comma-separated list with truncation
  const displayClubs = player.clubs.slice(0, MAX_CLUBS_DISPLAY);
  const clubsText =
    displayClubs.join(', ') +
    (player.clubs.length > MAX_CLUBS_DISPLAY ? '...' : '');

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      testID={testID}
    >
      <View style={styles.content}>
        {/* Player name with flags */}
        <View style={styles.nameRow}>
          {nationalityCodes.length > 0 && (
            <View style={styles.flagRow}>
              {nationalityCodes.map((code) => (
                <FlagIcon key={code} code={code} size={14} />
              ))}
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>
        </View>

        {/* Clubs */}
        {clubsText.length > 0 && (
          <Text style={styles.clubs} numberOfLines={1}>
            {clubsText}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    flex: 1,
  },
  clubs: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    paddingLeft: 29, // Align with name (flag width + gap)
  },
});

export default PlayerResultItem;
