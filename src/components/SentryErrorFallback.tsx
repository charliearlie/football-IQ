import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/theme';
import { ElevatedButton } from './ElevatedButton';

interface SentryErrorFallbackProps {
  resetError?: () => void;
}

/**
 * Digital Pitch styled error fallback for Sentry.ErrorBoundary.
 * Displays when an unhandled error crashes the app.
 */
export function SentryErrorFallback({ resetError }: SentryErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <AlertTriangle size={64} color={colors.cardYellow} />
        </View>

        <Text style={styles.title}>Offside!</Text>
        <Text style={styles.subtitle}>Something went wrong</Text>

        <Text style={styles.description}>
          We&apos;ve been notified and are working on a fix. Please try again.
        </Text>

        {resetError && (
          <View style={styles.buttonContainer}>
            <ElevatedButton
              title="Try Again"
              onPress={resetError}
              fullWidth
              testID="error-fallback-retry"
            />
          </View>
        )}
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
    color: colors.pitchGreen,
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
