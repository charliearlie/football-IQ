/**
 * Scout Profile Deep Link Handler
 *
 * Handles `footballiq://scout/[userId]` deep links from shared Scouting Reports.
 *
 * For existing users: Navigate to the Scout Report tab
 * For new users: Show a download/welcome prompt (future feature)
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors, fonts, spacing } from '@/theme';

/**
 * Deep link route for shared Scouting Reports.
 *
 * URL format: footballiq://scout/[userId]
 */
export default function ScoutProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user, isLoading } = useAuth();

  // Auto-redirect to stats tab if user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      // Navigate to Scout Report tab after a brief moment
      const timer = setTimeout(() => {
        router.replace('/(tabs)/stats');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, router]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // User is logged in - show brief redirect message
  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Scout Report</Text>
          <Text style={styles.message}>
            Taking you to your Scout Report...
          </Text>
          <ActivityIndicator
            size="small"
            color={colors.pitchGreen}
            style={styles.spinner}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Not logged in - show welcome/download CTA
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>🎖️</Text>
        </View>

        <Text style={styles.title}>Football IQ</Text>
        <Text style={styles.subtitle}>Scout Report</Text>

        <Text style={styles.description}>
          Someone shared their Football IQ stats with you! Test your own
          football knowledge and build your Scout Report.
        </Text>

        <View style={styles.buttonContainer}>
          <ElevatedButton
            title="Get Started"
            onPress={() => router.replace('/(tabs)')}
            size="large"
            fullWidth
            testID="get-started-button"
          />
        </View>

        {userId && userId !== 'anonymous' && (
          <Text style={styles.sharedBy}>
            Shared by player #{userId.slice(0, 8)}...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.glassBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
  },
  emoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.floodlightWhite,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.headline,
    fontSize: 20,
    color: colors.pitchGreen,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  sharedBy: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    opacity: 0.7,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
