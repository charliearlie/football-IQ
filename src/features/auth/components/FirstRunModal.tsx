import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, textStyles, borderRadius } from '@/theme';

export interface FirstRunModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when user submits their display name */
  onSubmit: (displayName: string) => Promise<void>;
  /** Test ID for testing */
  testID?: string;
}

/**
 * FirstRunModal - Display Name Prompt
 *
 * A modal that prompts new users to set their display name.
 * Uses GlassCard for a frosted glass effect.
 */
export function FirstRunModal({ visible, onSubmit, testID }: FirstRunModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { triggerLight, triggerNotification } = useHaptics();

  const handleSubmit = async () => {
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('Please enter a display name');
      triggerNotification('warning');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters');
      triggerNotification('warning');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Display name must be 30 characters or less');
      triggerNotification('warning');
      return;
    }

    triggerLight();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedName);
      triggerNotification('success');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      triggerNotification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.centeredView}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome to Football IQ!</Text>
            <Text style={styles.subtitle}>
              What should we call you?
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
              maxLength={30}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              editable={!isSubmitting}
              testID={testID ? `${testID}-input` : undefined}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonContainer}>
              <ElevatedButton
                title={isSubmitting ? 'Saving...' : "Let's Go!"}
                onPress={handleSubmit}
                disabled={isSubmitting || !displayName.trim()}
                size="large"
                testID={testID ? `${testID}-submit` : undefined}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
  },
  title: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.floodlightWhite,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: colors.redCard,
  },
  errorText: {
    color: colors.redCard,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: spacing.md,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
