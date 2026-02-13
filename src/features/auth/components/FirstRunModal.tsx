/**
 * FirstRunModal Component
 *
 * Full-screen modal wrapper for the onboarding briefing experience.
 * Displays BriefingScreen in a non-dismissible modal on first app launch.
 *
 * Includes an error boundary to prevent the modal from becoming invisible
 * while still blocking touches (which would freeze the app).
 */

import React, { Component, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BriefingScreen } from './BriefingScreen';
// import * as Sentry from '@sentry/react-native';

export interface FirstRunModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when user submits their display name */
  onSubmit: (displayName: string) => Promise<void>;
  /** Callback fired after successful submission (for navigation) */
  onSubmitSuccess?: () => void;
  /** External error message to display (e.g., from failed submission) */
  error?: string | null;
  /** Test ID for testing */
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface OnboardingErrorFallbackProps {
  onSubmit: (displayName: string) => Promise<void>;
  onRetry: () => void;
  testID?: string;
}

/**
 * Fallback UI shown when BriefingScreen fails to render.
 * Provides minimal but functional onboarding experience.
 */
function OnboardingErrorFallback({ onSubmit, onRetry, testID }: OnboardingErrorFallbackProps) {
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValid = displayName.trim().length >= 3;

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(displayName.trim());
    } catch (err) {
      setSubmitError('Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  }, [displayName, isValid, isSubmitting, onSubmit]);

  return (
    <SafeAreaView style={fallbackStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={fallbackStyles.content}
      >
        <View style={fallbackStyles.header}>
          <Text style={fallbackStyles.title}>WELCOME TO</Text>
          <Text style={fallbackStyles.subtitle}>FOOTBALL IQ</Text>
        </View>

        <View style={fallbackStyles.form}>
          <Text style={fallbackStyles.label}>Enter your display name</Text>
          <TextInput
            style={fallbackStyles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor="#666"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            testID={testID ? `${testID}-fallback-input` : undefined}
          />
          {submitError && <Text style={fallbackStyles.error}>{submitError}</Text>}

          <TouchableOpacity
            style={[
              fallbackStyles.button,
              (!isValid || isSubmitting) && fallbackStyles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            testID={testID ? `${testID}-fallback-submit` : undefined}
          >
            <Text style={fallbackStyles.buttonText}>
              {isSubmitting ? 'STARTING...' : 'START YOUR CAREER'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={fallbackStyles.retryButton} onPress={onRetry}>
            <Text style={fallbackStyles.retryText}>Retry full screen</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  retryText: {
    color: '#666',
    fontSize: 14,
  },
});

/**
 * Error boundary specifically for the onboarding flow.
 * Catches render errors and shows a fallback UI instead of crashing.
 */
class OnboardingErrorBoundary extends Component<
  { children: React.ReactNode; onSubmit: (displayName: string) => Promise<void>; testID?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onSubmit: (displayName: string) => Promise<void>; testID?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[OnboardingErrorBoundary] Caught error:', error);
    console.error('[OnboardingErrorBoundary] Error info:', errorInfo);
    // Sentry temporarily disabled
    // Sentry.captureException(error, {
    //   tags: { component: 'OnboardingErrorBoundary' },
    //   extra: { componentStack: errorInfo.componentStack },
    // });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <OnboardingErrorFallback
          onSubmit={this.props.onSubmit}
          onRetry={this.handleRetry}
          testID={this.props.testID}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * FirstRunModal - Full-screen onboarding modal
 *
 * Wraps BriefingScreen in a non-dismissible full-screen modal.
 * Uses slide animation for a smooth entrance.
 *
 * Includes error boundary to prevent invisible modal blocking touches.
 */
export function FirstRunModal({ visible, onSubmit, onSubmitSuccess, error, testID }: FirstRunModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      testID={testID}
    >
      <OnboardingErrorBoundary onSubmit={onSubmit} testID={testID}>
        <BriefingScreen
          onSubmit={onSubmit}
          onSubmitSuccess={onSubmitSuccess}
          externalError={error}
          testID={testID ? `${testID}-content` : undefined}
        />
      </OnboardingErrorBoundary>
    </Modal>
  );
}
