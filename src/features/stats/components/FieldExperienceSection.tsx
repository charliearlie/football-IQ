/**
 * FieldExperienceSection Component
 *
 * Displays per-mode puzzle completion counts ("Field Experience")
 * on the Scout Report screen. Shows how many "Reports Filed" the
 * user has completed in each game mode.
 *
 * Uses the "Digital Pitch" neubrutalist style:
 * - Stadium Navy backgrounds
 * - Pitch Green text for counts
 * - Glass card styling
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  ShieldCheck,
  TrendingUp,
  Clock,
  Grid3X3,
  Newspaper,
  ListOrdered,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { FieldExperience, ALL_GAME_MODES } from '../utils/fieldExperience';
import { GAME_MODE_DISPLAY } from '../types/stats.types';

/**
 * Icon mapping for each game mode.
 */
const GAME_MODE_ICONS: Record<GameMode, LucideIcon> = {
  career_path: Search,
  career_path_pro: ShieldCheck,
  guess_the_transfer: TrendingUp,
  guess_the_goalscorers: Clock,
  the_grid: Grid3X3,
  topical_quiz: Newspaper,
  top_tens: ListOrdered,
  starting_xi: Users,
};

export interface FieldExperienceSectionProps {
  /** Field Experience data with per-mode counts */
  fieldExperience: FieldExperience;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Single row for a game mode showing icon, name, and count.
 */
function GameModeRow({
  gameMode,
  count,
  index,
}: {
  gameMode: GameMode;
  count: number;
  index: number;
}) {
  const Icon = GAME_MODE_ICONS[gameMode];
  const displayName = GAME_MODE_DISPLAY[gameMode].displayName;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      style={styles.row}
    >
      <View style={styles.iconContainer}>
        <Icon size={18} color={colors.pitchGreen} strokeWidth={2} />
      </View>
      <Text style={styles.modeName}>{displayName}</Text>
      <Text style={styles.count}>
        {count} <Text style={styles.countLabel}>Reports</Text>
      </Text>
    </Animated.View>
  );
}

/**
 * Field Experience section displaying per-mode completion counts.
 */
export function FieldExperienceSection({
  fieldExperience,
  testID,
}: FieldExperienceSectionProps) {
  // Only show modes that have been played
  const playedModes = ALL_GAME_MODES.filter(
    (mode) => fieldExperience.byMode[mode] > 0
  );

  // If no games played, don't render anything
  if (playedModes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Mode rows */}
      {playedModes.map((mode, index) => (
        <GameModeRow
          key={mode}
          gameMode={mode}
          count={fieldExperience.byMode[mode]}
          index={index}
        />
      ))}

      {/* Total appearances footer */}
      <Animated.View
        entering={FadeInDown.delay(playedModes.length * 50 + 100).duration(300)}
        style={styles.footer}
      >
        <Text style={styles.totalLabel}>Overall Appearances</Text>
        <Text style={styles.totalCount}>{fieldExperience.totalAppearances}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(88, 204, 2, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  modeName: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
  count: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.pitchGreen,
  },
  countLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  totalLabel: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalCount: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
  },
});
