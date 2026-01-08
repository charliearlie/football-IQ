/**
 * SettingsSection Component
 *
 * A section grouping of settings rows with a header title.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';

export interface SettingsSectionProps {
  /** Section title */
  title: string;
  /** Settings rows to display */
  children: ReactNode;
  /** Test ID for testing */
  testID?: string;
}

export function SettingsSection({
  title,
  children,
  testID,
}: SettingsSectionProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  content: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
