/**
 * ConnectionsActionBar Component
 *
 * Bottom action buttons for Connections game.
 * Shows: Submit button only.
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ElevatedButton } from '@/components';
import { colors, spacing, borderRadius } from '@/theme';

export interface ConnectionsActionBarProps {
  canSubmit: boolean;
  onSubmit: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * ConnectionsActionBar - Bottom action buttons.
 */
export function ConnectionsActionBar({
  canSubmit,
  onSubmit,
  disabled = false,
  testID,
}: ConnectionsActionBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ElevatedButton
        title="Submit"
        onPress={onSubmit}
        disabled={!canSubmit || disabled}
        fullWidth
        size="medium"
        borderRadius={borderRadius.lg}
        testID={`${testID}-submit`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
