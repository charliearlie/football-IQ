/**
 * TimelineActionBar Component
 *
 * Compact footer panel for Timeline game actions.
 * Shows attempt counter, Submit Order button, and inline Give Up link.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Flag } from 'lucide-react-native';
import { ElevatedButton } from '@/components';
import { colors, fonts, spacing, borderRadius } from '@/theme';

export interface TimelineActionBarProps {
  canSubmit: boolean;
  onSubmit: () => void;
  onGiveUp: () => void;
  disabled?: boolean;
  attemptCount: number;
  testID?: string;
}

/**
 * TimelineActionBar - Compact footer with submit and inline give up.
 */
export function TimelineActionBar({
  canSubmit,
  onSubmit,
  onGiveUp,
  disabled = false,
  attemptCount,
  testID,
}: TimelineActionBarProps) {
  return (
    <View style={styles.outerContainer} testID={testID}>
      {/* Blur background for native platforms */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Content */}
      <View style={styles.glassOverlay}>
        {/* Attempt counter */}
        <Text style={styles.attemptText}>Attempt {attemptCount + 1} of 5</Text>

        {/* Submit + Give Up row */}
        <View style={styles.actionRow}>
          <View style={styles.submitWrapper}>
            <ElevatedButton
              title="Submit Order"
              onPress={onSubmit}
              disabled={!canSubmit || disabled}
              fullWidth
              size="medium"
              borderRadius={borderRadius.lg}
              testID={`${testID}-submit`}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.giveUpButton,
              pressed && styles.giveUpButtonPressed,
            ]}
            onPress={onGiveUp}
            hitSlop={8}
            testID={`${testID}-giveup`}
          >
            <Flag size={12} color={colors.redCard} strokeWidth={2} />
            <Text style={styles.giveUpText}>Give Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(5, 5, 10, 0.6)',
  },
  glassOverlay: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    gap: spacing.xs,
  },
  attemptText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  submitWrapper: {
    flex: 1,
  },
  giveUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  giveUpButtonPressed: {
    opacity: 0.6,
  },
  giveUpText: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: '600',
    color: colors.redCard,
  },
});
