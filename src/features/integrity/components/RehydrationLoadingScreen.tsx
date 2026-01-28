/**
 * RehydrationLoadingScreen
 *
 * Displayed while restoring user data after app reinstall.
 * Provides visual feedback during the rehydration process.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { textStyles } from '@/theme/typography';

/**
 * Full-screen loading indicator shown during data restoration.
 * Only displayed when actually rehydrating data after reinstall.
 */
export function RehydrationLoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.pitchGreen} />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.message}>Restoring your progress...</Text>
        <Text style={styles.subtitle}>
          Your stats and achievements are being restored
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
    marginTop: 24,
  },
  message: {
    ...textStyles.body,
    color: colors.pitchGreen,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
