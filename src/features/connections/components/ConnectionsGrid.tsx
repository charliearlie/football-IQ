/**
 * ConnectionsGrid Component
 *
 * Main grid layout for Connections game.
 * Shows solved groups at top, remaining players in 4-column grid below.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ConnectionsGroup } from '../types/connections.types';
import { GroupReveal } from './GroupReveal';
import { ConnectionsCell } from './ConnectionsCell';
import { spacing } from '@/theme';

/**
 * Build a map of full player name → short display name.
 * Surname only when unique, "F. Surname" when duplicates exist.
 */
function buildDisplayNames(allPlayerNames: string[]): Record<string, string> {
  const surnameCount: Record<string, number> = {};
  const parsed = allPlayerNames.map((full) => {
    const parts = full.trim().split(/\s+/);
    const surname = parts.length > 1 ? parts[parts.length - 1] : full;
    const firstInitial = parts.length > 1 ? parts[0][0] : '';
    return { full, surname, firstInitial };
  });
  for (const p of parsed) {
    surnameCount[p.surname] = (surnameCount[p.surname] || 0) + 1;
  }
  const map: Record<string, string> = {};
  for (const p of parsed) {
    map[p.full] = surnameCount[p.surname] > 1 && p.firstInitial
      ? `${p.firstInitial}. ${p.surname}`
      : p.surname;
  }
  return map;
}

export interface ConnectionsGridProps {
  solvedGroups: ConnectionsGroup[];
  remainingPlayers: string[];
  selectedPlayers: string[];
  onTogglePlayer: (name: string) => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * ConnectionsGrid - Main game grid layout.
 */
export function ConnectionsGrid({
  solvedGroups,
  remainingPlayers,
  selectedPlayers,
  onTogglePlayer,
  disabled = false,
  testID,
}: ConnectionsGridProps) {
  const allPlayerNames = useMemo(() => {
    const solved = solvedGroups.flatMap((g) => g.players as string[]);
    return [...solved, ...remainingPlayers];
  }, [solvedGroups, remainingPlayers]);

  const displayNames = useMemo(() => buildDisplayNames(allPlayerNames), [allPlayerNames]);

  return (
    <View style={styles.container} testID={testID}>
      {/* Solved groups stacked at top */}
      {solvedGroups.map((group) => (
        <GroupReveal key={group.category} group={group} testID={`${testID}-group-${group.difficulty}`} />
      ))}

      {/* Remaining players in 4-column grid */}
      {remainingPlayers.length > 0 && (
        <View style={styles.playersGrid}>
          {remainingPlayers.map((playerName) => (
            <View key={playerName} style={styles.cellWrapper}>
              <ConnectionsCell
                playerName={playerName}
                displayName={displayNames[playerName] || playerName}
                isSelected={selectedPlayers.includes(playerName)}
                disabled={disabled}
                onPress={onTogglePlayer}
                testID={`${testID}-cell-${playerName}`}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    maxWidth: 360,
    alignSelf: 'center',
    width: '100%',
  },
  cellWrapper: {
    // 4 columns with gap
    width: `${(100 - (3 * spacing.xs)) / 4}%`,
  },
});
