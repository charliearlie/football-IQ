import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '@/theme';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

/**
 * TabScreenWrapper - Smooth fade-in animation for tab screens.
 *
 * Wraps tab screen content in a 200ms opacity fade-in to prevent
 * the jarring "content appears instantly" feel when switching tabs.
 */
export function TabScreenWrapper({ children }: TabScreenWrapperProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 200 }}
      style={styles.container}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
