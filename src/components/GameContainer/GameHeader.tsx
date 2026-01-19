/**
 * GameHeader Component
 *
 * Reusable header for game screens with back button and title.
 * Provides consistent styling and navigation across all game modes.
 */

import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { colors, textStyles, spacing } from '@/theme';

export interface GameHeaderProps {
  /** Screen title displayed in header */
  title: string;
  /** Optional right-side content (e.g., progress indicator) */
  rightContent?: ReactNode;
  /** Show back button (default: true) */
  showBackButton?: boolean;
  /** Back button press handler */
  onBack?: () => void;
  /** Help button press handler - shows help icon when provided */
  onHelpPress?: () => void;
  /** Optional animated style for collapsible behavior */
  animatedStyle?: ViewStyle;
  /** Test ID prefix for testing */
  testID?: string;
}

export function GameHeader({
  title,
  rightContent,
  showBackButton = true,
  onBack,
  onHelpPress,
  animatedStyle,
  testID,
}: GameHeaderProps) {
  return (
    <View
      style={[styles.container, animatedStyle]}
      testID={testID ? `${testID}-container` : undefined}
    >
      {/* Back Button */}
      {showBackButton ? (
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          testID={testID ? `${testID}-back-button` : undefined}
        >
          <ArrowLeft
            size={24}
            color={colors.floodlightWhite}
            strokeWidth={2}
          />
        </Pressable>
      ) : (
        <View style={styles.spacer} testID={testID ? `${testID}-left-spacer` : undefined} />
      )}

      {/* Title */}
      <Text
        style={styles.title}
        numberOfLines={1}
        accessibilityRole="header"
        testID={testID ? `${testID}-title` : undefined}
      >
        {title}
      </Text>

      {/* Right Content: Help button + optional rightContent, or Spacer */}
      {(onHelpPress || rightContent) ? (
        <View style={styles.rightContent}>
          {/* Help Button */}
          {onHelpPress && (
            <Pressable
              onPress={onHelpPress}
              style={styles.helpButton}
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              accessibilityLabel="Help"
              accessibilityRole="button"
              testID={testID ? `${testID}-help-button` : undefined}
            >
              <HelpCircle
                size={20}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
          )}
          {rightContent}
        </View>
      ) : (
        <View style={styles.spacer} testID={testID ? `${testID}-right-spacer` : undefined} />
      )}
    </View>
  );
}

const BACK_BUTTON_SIZE = 44;
const HELP_BUTTON_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: BACK_BUTTON_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: {
    ...textStyles.h1,
    fontSize: 31, // Slightly smaller than h1 (32) to fit longer titles
    color: colors.floodlightWhite,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  rightContent: {
    minWidth: BACK_BUTTON_SIZE,
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpButton: {
    width: HELP_BUTTON_SIZE,
    height: HELP_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: HELP_BUTTON_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  spacer: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
  },
});
