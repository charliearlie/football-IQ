/**
 * ModeGrid Component
 *
 * Renders all game modes as a 2-column grid of ModeGridCard tiles.
 * Chunks the mode list into pairs and renders explicit rows so that
 * a lone card in an odd-length list gets a sibling spacer, keeping
 * the layout symmetrical.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ModeGridCard } from './ModeGridCard';
import { ModeStats } from '../hooks/useModeStats';

const { width: screenWidth } = Dimensions.get('window');

// Must match the constant in ModeGridCard so widths align exactly
const CARD_WIDTH = (screenWidth - 48) / 2;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModeGridProps {
  modeStats: ModeStats[];
  onModePress: (mode: ModeStats) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModeGrid({ modeStats, onModePress }: ModeGridProps) {
  // Chunk the flat list into pairs for row-based layout
  const rows: ModeStats[][] = [];
  for (let i = 0; i < modeStats.length; i += 2) {
    rows.push(modeStats.slice(i, i + 2));
  }

  return (
    <View style={styles.section}>
      {/* Section label */}
      <Text style={styles.sectionLabel}>GAME MODES</Text>

      {/* Grid rows */}
      <View style={styles.grid}>
        {rows.map((pair, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {pair.map((mode) => (
              <ModeGridCard
                key={mode.gameMode}
                gameMode={mode.gameMode}
                title={mode.title}
                playedCount={mode.playedCount}
                totalCount={mode.totalCount}
                hasUnplayed={mode.hasUnplayed}
                lockedCount={mode.lockedCount}
                onPress={() => onModePress(mode)}
              />
            ))}

            {/* Spacer fills the right column when there is an odd card */}
            {pair.length === 1 && (
              <View style={[styles.spacer, { width: CARD_WIDTH }]} />
            )}
          </View>
        ))}
      </View>

      {/* Breathing room at the bottom of the scroll */}
      <View style={styles.bottomPadding} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  section: {
    // No horizontal padding here — grid handles its own padding
  },
  sectionLabel: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 13,
    color: 'rgba(248,250,252,0.5)',
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  spacer: {
    // Invisible placeholder that mirrors a card's width
  },
  bottomPadding: {
    height: 24,
  },
});
