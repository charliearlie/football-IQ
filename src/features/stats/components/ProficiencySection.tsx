/**
 * Proficiency Section Component
 *
 * Groups all 5 proficiency bars in a GlassCard.
 */

import { View, Text, StyleSheet } from 'react-native';
import { textStyles, spacing } from '@/theme';
import { GlassCard } from '@/components';
import { GameProficiency } from '../types/stats.types';
import { ProficiencyBar } from './ProficiencyBar';

interface ProficiencySectionProps {
  proficiencies: GameProficiency[];
}

export function ProficiencySection({ proficiencies }: ProficiencySectionProps) {
  return (
    <GlassCard style={styles.container}>
      <Text style={[textStyles.h3, styles.title]}>Skills Breakdown</Text>
      <View style={styles.barsContainer}>
        {proficiencies.map((proficiency) => (
          <ProficiencyBar
            key={proficiency.gameMode}
            gameMode={proficiency.gameMode}
            displayName={proficiency.displayName}
            percentage={proficiency.percentage}
            gamesPlayed={proficiency.gamesPlayed}
          />
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  barsContainer: {
    // Last bar shouldn't have bottom margin
  },
});
