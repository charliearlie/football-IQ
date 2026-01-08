/**
 * SettingsRow Component
 *
 * A single row in the settings list with icon, label, and chevron.
 */

import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

export interface SettingsRowProps {
  /** Icon to display on the left */
  icon: ReactNode;
  /** Row label text */
  label: string;
  /** Press handler */
  onPress: () => void;
  /** Test ID for testing */
  testID?: string;
}

export function SettingsRow({
  icon,
  label,
  onPress,
  testID,
}: SettingsRowProps) {
  const { triggerSelection } = useHaptics();

  const handlePress = () => {
    triggerSelection();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Text style={styles.label}>{label}</Text>
      <ChevronRight
        size={20}
        color={colors.textSecondary}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    flex: 1,
  },
});
