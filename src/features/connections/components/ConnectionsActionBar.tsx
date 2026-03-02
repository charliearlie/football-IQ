/**
 * ConnectionsActionBar Component
 *
 * Premium glass footer panel for Connections game.
 * Shows: Shuffle + Deselect utility buttons above Submit button.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Shuffle, X, Flag } from 'lucide-react-native';
import { ElevatedButton } from '@/components';
import { colors, fonts, spacing, borderRadius, depthColors } from '@/theme';

export interface ConnectionsActionBarProps {
  canSubmit: boolean;
  canDeselect: boolean;
  onSubmit: () => void;
  onShuffle: () => void;
  onDeselect: () => void;
  onGiveUp: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * ConnectionsActionBar - Glass footer with utility buttons.
 */
export function ConnectionsActionBar({
  canSubmit,
  canDeselect,
  onSubmit,
  onShuffle,
  onDeselect,
  onGiveUp,
  disabled = false,
  testID,
}: ConnectionsActionBarProps) {
  return (
    <View style={styles.outerContainer} testID={testID}>
      {/* Blur background for native platforms */}
      {Platform.OS !== 'web' ? (
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Glass overlay with content */}
      <View style={styles.glassOverlay}>
        {/* Utility buttons row */}
        <View style={styles.utilityRow}>
          <Pressable
            style={({ pressed }) => [
              styles.utilityButton,
              pressed && styles.utilityButtonPressed,
            ]}
            onPress={onShuffle}
            testID={`${testID}-shuffle`}
          >
            <Shuffle size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={styles.utilityButtonText}>SHUFFLE</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.utilityButton,
              !canDeselect && styles.utilityButtonDisabled,
              pressed && canDeselect && styles.utilityButtonPressed,
            ]}
            onPress={onDeselect}
            disabled={!canDeselect}
            testID={`${testID}-deselect`}
          >
            <X size={14} color={colors.textSecondary} strokeWidth={2} />
            <Text style={[
              styles.utilityButtonText,
              !canDeselect && styles.utilityButtonTextDisabled,
            ]}>
              DESELECT
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.utilityButton,
              pressed && styles.utilityButtonPressed,
            ]}
            onPress={onGiveUp}
            testID={`${testID}-giveup`}
          >
            <Flag size={14} color={colors.dangerRed} strokeWidth={2} />
            <Text style={[styles.utilityButtonText, styles.giveUpText]}>GIVE UP</Text>
          </Pressable>
        </View>

        {/* Submit button */}
        <ElevatedButton
          title="SUBMIT"
          onPress={onSubmit}
          disabled={!canSubmit || disabled}
          fullWidth
          size="large"
          borderRadius={borderRadius.lg}
          shadowColor={depthColors.pitchGreen}
          textStyle={styles.submitButtonText}
          testID={`${testID}-submit`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: colors.glassBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 16,
  },
  glassOverlay: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
  },
  utilityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  utilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  utilityButtonPressed: {
    opacity: 0.6,
  },
  utilityButtonDisabled: {
    opacity: 0.3,
  },
  utilityButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  utilityButtonTextDisabled: {
    opacity: 0.5,
  },
  giveUpText: {
    color: colors.dangerRed,
  },
  submitButtonText: {
    fontFamily: fonts.headline,
    fontSize: 24,
    letterSpacing: 1,
    color: colors.stadiumNavy,
  },
});
