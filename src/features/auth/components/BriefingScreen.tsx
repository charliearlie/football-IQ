/**
 * BriefingScreen Component
 *
 * Full-screen onboarding experience that introduces new users to Football IQ.
 * Displays the weekly fixture schedule and collects the user's display name.
 *
 * Features:
 * - Large Bebas Neue welcome header
 * - Weekly fixtures grid showing all game modes
 * - Display name input with Pitch Green accent
 * - Sentry analytics on completion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { BriefingBackground } from './BriefingBackground';
import { WeeklyFixturesGrid } from './WeeklyFixturesGrid';

export interface BriefingScreenProps {
  /** Callback when user submits their display name */
  onSubmit: (displayName: string) => Promise<void>;
  /** Test ID for testing */
  testID?: string;
}

// Validation constants
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 30;

/**
 * BriefingScreen - Full-screen onboarding experience
 *
 * Welcomes new users, shows the weekly schedule, and collects
 * their display name for the leaderboard.
 */
export function BriefingScreen({ onSubmit, testID }: BriefingScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerSuccess, triggerNotification } = useHaptics();

  const trimmedName = displayName.trim();
  const isValid = trimmedName.length >= MIN_NAME_LENGTH;

  const handleSubmit = async () => {
    // Validate display name
    if (!trimmedName) {
      setError('Please enter a display name');
      triggerNotification('warning');
      return;
    }

    if (trimmedName.length < MIN_NAME_LENGTH) {
      setError(`Display name must be at least ${MIN_NAME_LENGTH} characters`);
      triggerNotification('warning');
      return;
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Display name must be ${MAX_NAME_LENGTH} characters or less`);
      triggerNotification('warning');
      return;
    }

    // Trigger success haptic immediately
    triggerSuccess();
    setIsSubmitting(true);
    setError(null);

    try {
      // Save display name to Supabase (AsyncStorage is handled by caller)
      await onSubmit(trimmedName);

      // Log analytics event to Sentry
      Sentry.captureMessage('User Onboarded', {
        level: 'info',
        tags: {
          feature: 'onboarding',
          display_name_length: String(trimmedName.length),
        },
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
      triggerNotification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <BriefingBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID={testID}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.welcomeText}>WELCOME TO</Text>
            <Text style={styles.titleText}>FOOTBALL IQ</Text>
            <Text style={styles.subtitle}>
              Your daily football intelligence training
            </Text>
          </View>

          {/* Weekly Fixtures */}
          <WeeklyFixturesGrid testID={testID ? `${testID}-fixtures` : undefined} />

          {/* Scout Identity Section */}
          <View style={styles.identitySection}>
            <Text style={styles.sectionHeader}>SCOUT IDENTITY</Text>
            <Text style={styles.sectionHint}>
              Choose a name for the leaderboard
            </Text>

            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Enter your display name"
              placeholderTextColor={colors.textSecondary}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (error) setError(null);
              }}
              maxLength={MAX_NAME_LENGTH}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
              testID={testID ? `${testID}-input` : undefined}
            />

            {/* Character counter */}
            <Text style={styles.charCounter}>
              {trimmedName.length}/{MAX_NAME_LENGTH}
            </Text>

            {/* Error message */}
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Submit Button */}
          <View style={styles.buttonSection}>
            <ElevatedButton
              title={isSubmitting ? 'Starting...' : 'START YOUR CAREER'}
              onPress={handleSubmit}
              disabled={isSubmitting || !isValid}
              size="large"
              fullWidth
              testID={testID ? `${testID}-submit` : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.textSecondary,
    letterSpacing: 3,
    marginBottom: -8,
  },
  titleText: {
    fontFamily: fonts.headline,
    fontSize: 48,
    color: colors.floodlightWhite,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  identitySection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.floodlightWhite,
    fontSize: 18,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.redCard,
  },
  charCounter: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginRight: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.redCard,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  buttonSection: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
});
