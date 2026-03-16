/**
 * NotificationOptInCard Component
 *
 * Shown as the second step of onboarding (after display name entry).
 * Asks the user to enable push notifications before they start playing.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, spacing, fonts, fontWeights } from '@/theme';

interface NotificationOptInCardProps {
  onEnable: () => void;
  onSkip: () => void;
}

export function NotificationOptInCard({ onEnable, onSkip }: NotificationOptInCardProps) {
  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconWrapper}>
        <Bell color={colors.pitchGreen} size={48} />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>NEVER MISS A DAILY CHALLENGE</Text>

      {/* Body */}
      <Text style={styles.body}>
        Get notified when new puzzles drop and keep your streak alive
      </Text>

      {/* Enable button */}
      <View style={styles.buttonWrapper}>
        <ElevatedButton
          title="Enable Notifications"
          onPress={onEnable}
          size="large"
          fullWidth
        />
      </View>

      {/* Skip link */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Maybe Later</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    flex: 1,
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: spacing.xl,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.pitchGreen}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
