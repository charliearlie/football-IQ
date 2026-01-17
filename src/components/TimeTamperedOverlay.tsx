import { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/theme';
import { ElevatedButton } from './ElevatedButton';

interface TimeTamperedOverlayProps {
  /** Callback to retry time validation */
  onRetry: () => Promise<void>;
}

/**
 * Full-screen blocking overlay displayed when clock tampering is detected.
 *
 * This overlay is non-dismissible - users must fix their device clock
 * and tap "Try Again" to continue using the app.
 *
 * Matches the Digital Pitch design system (similar to SentryErrorFallback).
 */
export function TimeTamperedOverlay({ onRetry }: TimeTamperedOverlayProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent={false}
      animationType="fade"
      testID="time-tampered-overlay"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Clock size={64} color={colors.cardYellow} />
          </View>

          <Text style={styles.title}>Time Out of Sync</Text>
          <Text style={styles.subtitle}>Your device clock appears incorrect</Text>

          <Text style={styles.description}>
            Football IQ requires accurate time to ensure fair play. Please check
            your device&apos;s date and time settings, then try again.
          </Text>

          <View style={styles.buttonContainer}>
            <ElevatedButton
              title={isRetrying ? 'Checking...' : 'Try Again'}
              onPress={handleRetry}
              disabled={isRetrying}
              fullWidth
              testID="time-retry-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '600',
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
  },
});
