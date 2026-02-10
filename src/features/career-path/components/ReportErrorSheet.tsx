/**
 * ReportErrorSheet Component
 *
 * Content component for the report error native formSheet.
 * Provides quick-select chips for common report types
 * and an optional comment field.
 *
 * Rendered inside app/report-error-sheet.tsx route with
 * presentation: 'formSheet' for native sheet + Liquid Glass on iOS 26.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { AlertTriangle, Check } from 'lucide-react-native';
import { colors, fonts, borderRadius, spacing } from '@/theme';
import { triggerMedium } from '@/lib/haptics';
import { ElevatedButton } from '@/components';

/**
 * Report type enum matching database constraint.
 */
export type ReportType =
  | 'retired_moved'
  | 'incorrect_stats'
  | 'name_visible'
  | 'wrong_club'
  | 'other';

/**
 * Report type options with labels and descriptions.
 */
const REPORT_OPTIONS: { type: ReportType; label: string; description: string }[] = [
  {
    type: 'retired_moved',
    label: 'Retired/Moved',
    description: 'Player retired or changed clubs',
  },
  {
    type: 'incorrect_stats',
    label: 'Wrong Stats',
    description: 'Incorrect appearances, goals, or years',
  },
  {
    type: 'name_visible',
    label: 'Name Visible',
    description: "Player's name appears in clues",
  },
  {
    type: 'wrong_club',
    label: 'Wrong Club',
    description: 'Club name incorrect or misspelled',
  },
  {
    type: 'other',
    label: 'Other',
    description: 'Something else is wrong',
  },
];

export interface ReportErrorSheetProps {
  /** Puzzle ID to report */
  puzzleId: string;
  /** Callback when report is submitted */
  onSubmit: (reportType: ReportType, comment?: string) => Promise<void>;
  /** Whether submission succeeded (controlled by route) */
  isSuccess: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ReportErrorSheet - Content for the error report native formSheet.
 *
 * Mobile-native pattern for error reporting with:
 * - Quick-select chips for report types
 * - Optional comment field
 * - Haptic feedback on submission
 *
 * Rendered inside a native formSheet route (app/report-error-sheet.tsx).
 */
export function ReportErrorSheet({
  onSubmit,
  isSuccess,
  testID,
}: ReportErrorSheetProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: ReportType) => {
    triggerMedium();
    setSelectedType(type);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedType, comment.trim() || undefined);
      // Success state is managed by the route via isSuccess prop
    } catch (error) {
      console.error('[ReportErrorSheet] Submit failed:', error);
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <View style={styles.successContainer} testID={testID}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Check size={32} color={colors.pitchGreen} />
          </View>
          <Text style={styles.successTitle}>Scout Notified</Text>
          <Text style={styles.successMessage}>
            Thanks for helping improve our records
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <AlertTriangle size={20} color={colors.cardYellow} />
        <Text style={styles.title}>Report an Error</Text>
      </View>
      <Text style={styles.subtitle}>What's wrong with this puzzle?</Text>

      {/* Report Type Chips */}
      <View style={styles.chipsContainer}>
        {REPORT_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={[
              styles.chip,
              selectedType === option.type && styles.chipSelected,
            ]}
            onPress={() => handleTypeSelect(option.type)}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.chipLabel,
                selectedType === option.type && styles.chipLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Description of selected type */}
      {selectedType && (
        <Text style={styles.description}>
          {REPORT_OPTIONS.find((o) => o.type === selectedType)?.description}
        </Text>
      )}

      {/* Optional comment */}
      <TextInput
        style={styles.commentInput}
        placeholder="Add details (optional)"
        placeholderTextColor={colors.textSecondary}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
        editable={!isSubmitting}
      />

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.pitchGreen} />
        ) : (
          <ElevatedButton
            title="Submit Report"
            onPress={handleSubmit}
            size="large"
            fullWidth
            disabled={!selectedType}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  successContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipSelected: {
    backgroundColor: 'rgba(88, 204, 2, 0.15)',
    borderColor: colors.pitchGreen,
  },
  chipLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipLabelSelected: {
    color: colors.pitchGreen,
    fontWeight: '600',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  commentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.floodlightWhite,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  submitContainer: {
    minHeight: 48,
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(88, 204, 2, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.pitchGreen,
  },
  successTitle: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.pitchGreen,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  successMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
