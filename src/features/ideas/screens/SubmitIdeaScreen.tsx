/**
 * SubmitIdeaScreen Component
 *
 * Full-screen form for users to submit game mode ideas.
 * Offers a Pro subscription reward incentive for accepted ideas.
 *
 * Features:
 * - Large Bebas Neue header
 * - Reward banner with Pro incentive
 * - Title and description inputs
 * - Optional email field for follow-up
 * - Haptic feedback on submission
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { RewardBanner } from '../components/RewardBanner';
import { submitIdea } from '../services/ideaSubmissionService';
import type { IdeaFormErrors } from '../types/idea.types';

export interface SubmitIdeaScreenProps {
  testID?: string;
}

// Validation constants
const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 100;
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 1000;

// Email regex for basic validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * SubmitIdeaScreen - Game idea submission form
 *
 * Allows users to submit game mode ideas with the incentive
 * of winning 1 year of Pro if their idea is used.
 */
export function SubmitIdeaScreen({ testID }: SubmitIdeaScreenProps) {
  const router = useRouter();
  const { triggerSuccess, triggerNotification } = useHaptics();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<IdeaFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Trimmed values for validation
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const trimmedEmail = email.trim();

  // Basic form validity check
  const isValid =
    trimmedTitle.length >= MIN_TITLE_LENGTH &&
    trimmedDescription.length >= MIN_DESCRIPTION_LENGTH;

  /**
   * Validate all form fields.
   * Returns true if valid, false if there are errors.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: IdeaFormErrors = {};

    // Title validation
    if (!trimmedTitle) {
      newErrors.title = 'Please enter an idea title';
    } else if (trimmedTitle.length < MIN_TITLE_LENGTH) {
      newErrors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    // Description validation
    if (!trimmedDescription) {
      newErrors.description = 'Please describe how your game would work';
    } else if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
    } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }

    // Email validation (optional, but must be valid if provided)
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [trimmedTitle, trimmedDescription, trimmedEmail]);

  /**
   * Handle form submission.
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      triggerNotification('warning');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await submitIdea({
        title: trimmedTitle,
        description: trimmedDescription,
        email: trimmedEmail || undefined,
      });

      if (result.success) {
        triggerSuccess();
        setIsSubmitted(true);
      } else {
        triggerNotification('error');
        Alert.alert('Submission Failed', result.error || 'Please try again later.');
      }
    } catch {
      triggerNotification('error');
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Clear error for a specific field when user starts typing.
   */
  const clearFieldError = (field: keyof IdeaFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle close button press.
   */
  const handleClose = () => {
    router.back();
  };

  // Show success state after submission
  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>IDEA SUBMITTED!</Text>
          <Text style={styles.successSubtitle}>
            Thanks for sharing your creativity. We&apos;ll review your idea and
            reach out if we decide to use it.
          </Text>
          <View style={styles.successButton}>
            <ElevatedButton
              title="BACK TO HOME"
              onPress={handleClose}
              size="large"
              fullWidth
              testID={testID ? `${testID}-back-button` : undefined}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Close Button */}
        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <X size={24} color={colors.floodlightWhite} />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          testID={testID}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>BECOME A</Text>
            <Text style={styles.titleTextAccent}>TACTICIAN</Text>
          </View>

          {/* Reward Banner */}
          <View style={styles.bannerSection}>
            <RewardBanner testID={testID ? `${testID}-banner` : undefined} />
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Idea Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>IDEA TITLE</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g., Transfer Chain"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  clearFieldError('title');
                }}
                maxLength={MAX_TITLE_LENGTH}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSubmitting}
                testID={testID ? `${testID}-title-input` : undefined}
              />
              <View style={styles.fieldFooter}>
                <Text style={styles.charCounter}>
                  {trimmedTitle.length}/{MAX_TITLE_LENGTH}
                </Text>
              </View>
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Mechanics Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>HOW IT WORKS</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputMultiline,
                  errors.description && styles.inputError,
                ]}
                placeholder="Describe the game mechanics, rules, and what makes it fun..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  clearFieldError('description');
                }}
                maxLength={MAX_DESCRIPTION_LENGTH}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoCapitalize="sentences"
                editable={!isSubmitting}
                testID={testID ? `${testID}-description-input` : undefined}
              />
              <View style={styles.fieldFooter}>
                <Text style={styles.charCounter}>
                  {trimmedDescription.length}/{MAX_DESCRIPTION_LENGTH}
                </Text>
              </View>
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Email (Optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>EMAIL (OPTIONAL)</Text>
              <Text style={styles.fieldHint}>For follow-up if we use your idea</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearFieldError('email');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                testID={testID ? `${testID}-email-input` : undefined}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonSection}>
            <ElevatedButton
              title={isSubmitting ? 'SUBMITTING...' : 'SUBMIT IDEA'}
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
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleText: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  titleTextAccent: {
    fontFamily: fonts.headline,
    fontSize: 42,
    color: colors.floodlightWhite,
    letterSpacing: 3,
    marginTop: -4,
  },
  bannerSection: {
    marginBottom: spacing.xl,
  },
  formSection: {
    gap: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontFamily: fonts.headline,
    fontSize: 14,
    color: colors.floodlightWhite,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  fieldHint: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.floodlightWhite,
    fontSize: 16,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
  },
  inputMultiline: {
    minHeight: 140,
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.redCard,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    marginRight: spacing.xs,
  },
  charCounter: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    color: colors.redCard,
    marginTop: spacing.xs,
  },
  buttonSection: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  // Success state styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontFamily: fonts.headline,
    fontSize: 36,
    color: colors.pitchGreen,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  successButton: {
    width: '100%',
    maxWidth: 300,
  },
});
