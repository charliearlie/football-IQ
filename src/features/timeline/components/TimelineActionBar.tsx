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
const MAX_ATTEMPTS = 5;

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
        {/* Status row: label + attempt dots */}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {MAX_ATTEMPTS - attemptCount} {MAX_ATTEMPTS - attemptCount === 1 ? 'ATTEMPT' : 'ATTEMPTS'} LEFT
          </Text>
          <View style={styles.attemptDots}>
            {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.attemptDot,
                  i < attemptCount && styles.attemptDotUsed,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Full-width submit button */}
        <ElevatedButton
          title="SUBMIT ORDER"
          onPress={onSubmit}
          disabled={!canSubmit || disabled}
          fullWidth
          size="medium"
          borderRadius={borderRadius.lg}
          testID={`${testID}-submit`}
        />

        {/* Give up link */}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  statusText: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  attemptDots: {
    flexDirection: 'row',
    gap: 4,
  },
  attemptDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.pitchGreen,
    shadowColor: colors.pitchGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  attemptDotUsed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowOpacity: 0,
    elevation: 0,
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
