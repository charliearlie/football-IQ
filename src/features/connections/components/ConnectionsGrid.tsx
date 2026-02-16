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
 * Build a map of full player name → stacked display name.
 * "Steven Gerrard" → "Steven\nGerrard" (first name on top, last name below).
 * Single names (e.g., "Rodri") are shown as-is.
 */
function buildDisplayNames(allPlayerNames: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const full of allPlayerNames) {
    const parts = full.trim().split(/\s+/);
    if (parts.length <= 1) {
      map[full] = full;
    } else {
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      map[full] = `${firstName}\n${lastName}`;
    }
  }
  return map;
}

export interface ConnectionsGridProps {
  solvedGroups: ConnectionsGroup[];
  remainingPlayers: string[];
  selectedPlayers: string[];
  shakingPlayers?: string[];
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
  shakingPlayers = [],
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
                isShaking={shakingPlayers.includes(playerName)}
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
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignSelf: 'center',
    width: '100%',
  },
  cellWrapper: {
    // 4 columns: ~23% each leaves room for 3 x 8px gaps
    width: '23%',
  },
});
