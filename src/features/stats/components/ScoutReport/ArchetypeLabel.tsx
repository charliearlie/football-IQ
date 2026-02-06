/**
 * ArchetypeLabel - Displays the user's "Scouting Archetype"
 *
 * The archetype is determined by the user's highest weighted proficiency
 * across all game modes, giving them a character-like identity.
 *
 * Archetype Mapping (Scouting/Intelligence Theme):
 * - career_path: Detective
 * - career_path_pro: Master Detective
 * - guess_the_transfer: Market Analyst
 * - guess_the_goalscorers: Historian
 * - the_grid: Pattern Master
 * - topical_quiz: News Hound
 * - top_tens: Statistician
 * - starting_xi: Tactical Mind
 */

import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Search,
  ShieldCheck,
  TrendingUp,
  Clock,
  Grid3X3,
  Link,
  Newspaper,
  ListOrdered,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { colors, fonts, fontWeights, spacing, borderRadius } from '@/theme';
import { GameMode } from '@/features/puzzles/types/puzzle.types';
import { GameProficiency } from '../../types/stats.types';

interface ArchetypeInfo {
  name: string;
  icon: LucideIcon;
  description: string;
}

/**
 * Archetype definitions for each game mode.
 */
const ARCHETYPES: Record<GameMode, ArchetypeInfo> = {
  career_path: {
    name: 'Detective',
    icon: Search,
    description: 'Uncovers player histories with precision',
  },
  career_path_pro: {
    name: 'Master Detective',
    icon: ShieldCheck,
    description: 'Expert at identifying obscure talents',
  },
  guess_the_transfer: {
    name: 'Market Analyst',
    icon: TrendingUp,
    description: 'Knows every transfer inside out',
  },
  guess_the_goalscorers: {
    name: 'Historian',
    icon: Clock,
    description: 'Remembers every goal ever scored',
  },
  the_grid: {
    name: 'Pattern Master',
    icon: Grid3X3,
    description: 'Sees connections others miss',
  },
  the_chain: {
    name: 'Chain Linker',
    icon: Link,
    description: 'Links players through shared histories',
  },
  topical_quiz: {
    name: 'News Hound',
    icon: Newspaper,
    description: 'Always up to date with football news',
  },
  top_tens: {
    name: 'Statistician',
    icon: ListOrdered,
    description: 'Lives and breathes football rankings',
  },
  starting_xi: {
    name: 'Tactical Mind',
    icon: Users,
    description: 'Knows every historic lineup by heart',
  },
};

export interface ArchetypeLabelProps {
  proficiencies: GameProficiency[];
  testID?: string;
}

/**
 * Determines the dominant archetype based on weighted proficiency.
 * Uses (gamesPlayed × percentage) as the weight to favor both
 * skill and experience in a game mode.
 */
function getDominantArchetype(proficiencies: GameProficiency[]): GameMode {
  let bestMode: GameMode = 'career_path';
  let bestScore = 0;

  for (const prof of proficiencies) {
    // Weight = games played × proficiency percentage
    // This rewards both playing a lot and being good at a mode
    const score = prof.gamesPlayed * prof.percentage;
    if (score > bestScore) {
      bestScore = score;
      bestMode = prof.gameMode;
    }
  }

  return bestMode;
}

export function ArchetypeLabel({ proficiencies, testID }: ArchetypeLabelProps) {
  const dominantMode = useMemo(
    () => getDominantArchetype(proficiencies),
    [proficiencies]
  );

  const archetype = ARCHETYPES[dominantMode];
  const Icon = archetype.icon;

  // Check if user has played any games
  const hasPlayed = proficiencies.some((p) => p.gamesPlayed > 0);

  if (!hasPlayed) {
    return null; // Don't show archetype if no games played
  }

  return (
    <Animated.View
      entering={FadeIn.delay(300).duration(400)}
      style={styles.container}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <Icon size={18} color={colors.cardYellow} strokeWidth={2} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Scouting Archetype</Text>
        <Text style={styles.archetypeName}>{archetype.name}</Text>
        <Text style={styles.description}>{archetype.description}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  archetypeName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.cardYellow,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  description: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
