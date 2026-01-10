import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { normalizeString } from '@/lib/validation';
import { colors, spacing, fonts, textStyles, borderRadius } from '@/theme';
import { Goal } from '../types/goalscorerRecall.types';

export interface RecallComparisonViewProps {
  /** All goals from the puzzle */
  goals: Goal[];
  /** Normalized names of found scorers from metadata */
  foundScorerNames: string[];
  /** Test ID for testing */
  testID?: string;
}

type ScorerVariant = 'found' | 'missed' | 'ownGoal';

interface ScorerRowProps {
  goal: Goal;
  variant: ScorerVariant;
  testID?: string;
}

/**
 * ScorerRow - Displays a single scorer with styling based on variant.
 */
function ScorerRow({ goal, variant, testID }: ScorerRowProps) {
  const containerStyle = [
    styles.scorerRow,
    variant === 'found' && styles.scorerRowFound,
    variant === 'missed' && styles.scorerRowMissed,
    variant === 'ownGoal' && styles.scorerRowOwnGoal,
  ];

  const nameStyle = [
    styles.scorerName,
    variant === 'found' && styles.scorerNameFound,
    variant === 'missed' && styles.scorerNameMissed,
    variant === 'ownGoal' && styles.scorerNameOwnGoal,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <Text style={styles.scorerMinute}>{goal.minute}'</Text>
      <Text style={nameStyle} numberOfLines={2}>
        {goal.scorer}
        {goal.isOwnGoal ? ' (OG)' : ''}
      </Text>
      <Text style={styles.scorerTeam}>{goal.team}</Text>
      {variant === 'found' && (
        <CheckCircle size={16} color={colors.pitchGreen} strokeWidth={2} />
      )}
      {variant === 'missed' && (
        <XCircle size={16} color={colors.redCard} strokeWidth={2} />
      )}
    </View>
  );
}

interface EmptyStateProps {
  text: string;
}

/**
 * EmptyState - Displays when a section has no items.
 */
function EmptyState({ text }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

/**
 * RecallComparisonView - Displays found vs missed scorers in separate sections.
 *
 * Partitions goals into Found, Missed, and Own Goals sections with
 * appropriate styling and icons for each.
 */
export function RecallComparisonView({
  goals,
  foundScorerNames,
  testID,
}: RecallComparisonViewProps) {
  const foundScorerSet = new Set(foundScorerNames);

  // Helper to check if a scorer was found (normalize before comparison)
  const wasFound = (scorer: string) =>
    foundScorerSet.has(normalizeString(scorer));

  // Partition goals into found, missed, and own goals
  const foundGoals = goals.filter((g) => !g.isOwnGoal && wasFound(g.scorer));
  const missedGoals = goals.filter((g) => !g.isOwnGoal && !wasFound(g.scorer));
  const ownGoals = goals.filter((g) => g.isOwnGoal);

  return (
    <View testID={testID}>
      {/* Found Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CheckCircle size={20} color={colors.pitchGreen} strokeWidth={2} />
          <Text style={styles.sectionTitle}>FOUND ({foundGoals.length})</Text>
        </View>
        {foundGoals.length > 0 ? (
          foundGoals.map((goal, index) => (
            <ScorerRow
              key={`found-${goal.scorer}-${goal.minute}-${index}`}
              goal={goal}
              variant="found"
              testID={`scorer-row-found-${index}`}
            />
          ))
        ) : (
          <EmptyState text="No scorers found" />
        )}
      </View>

      {/* Missed Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <XCircle size={20} color={colors.redCard} strokeWidth={2} />
          <Text style={styles.sectionTitle}>MISSED ({missedGoals.length})</Text>
        </View>
        {missedGoals.length > 0 ? (
          missedGoals.map((goal, index) => (
            <ScorerRow
              key={`missed-${goal.scorer}-${goal.minute}-${index}`}
              goal={goal}
              variant="missed"
              testID={`scorer-row-missed-${index}`}
            />
          ))
        ) : (
          <EmptyState text="None missed!" />
        )}
      </View>

      {/* Own Goals Section (if any) */}
      {ownGoals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OWN GOALS</Text>
          </View>
          {ownGoals.map((goal, index) => (
            <ScorerRow
              key={`og-${goal.scorer}-${goal.minute}-${index}`}
              goal={goal}
              variant="ownGoal"
              testID={`scorer-row-og-${index}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  scorerRowFound: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  scorerRowMissed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  scorerRowOwnGoal: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  scorerMinute: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.textSecondary,
    width: 32,
  },
  scorerName: {
    ...textStyles.body,
    flex: 1,
    color: colors.floodlightWhite,
  },
  scorerNameFound: {
    color: colors.pitchGreen,
  },
  scorerNameMissed: {
    color: colors.redCard,
  },
  scorerNameOwnGoal: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scorerTeam: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
