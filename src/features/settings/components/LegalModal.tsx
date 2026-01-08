/**
 * LegalModal Component
 *
 * Modal for displaying Privacy Policy or Terms of Service content.
 * Uses in-app display for a seamless user experience.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface LegalModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Type of legal content to display */
  type: 'privacy' | 'terms';
  /** Close handler */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

const PRIVACY_POLICY_CONTENT = `Last Updated: January 2025

1. Information We Collect
Football IQ collects minimal data to provide our services:
- Anonymous usage statistics
- Game progress and scores
- Device information for app optimization

2. How We Use Your Information
We use collected information to:
- Improve app performance and features
- Provide leaderboards and statistics
- Fix bugs and technical issues

3. Data Storage
Your game progress is stored locally on your device and optionally synced to our secure servers if you create an account.

4. Third-Party Services
We use analytics services to improve the app experience. These services collect anonymous usage data.

5. Your Rights
You can request deletion of your data at any time by contacting us.

6. Contact Us
For privacy concerns, contact: privacy@footballiq.app`;

const TERMS_OF_SERVICE_CONTENT = `Last Updated: January 2025

1. Acceptance of Terms
By using Football IQ, you agree to these Terms of Service.

2. Use of Service
Football IQ is provided for entertainment purposes. You agree to:
- Use the app lawfully
- Not attempt to manipulate scores or leaderboards
- Not reverse engineer the app

3. User Accounts
You are responsible for maintaining the security of your account credentials.

4. Intellectual Property
All content, including puzzles and game mechanics, is owned by Football IQ.

5. Disclaimers
The app is provided "as is" without warranties of any kind.

6. Limitation of Liability
Football IQ is not liable for any damages arising from use of the app.

7. Changes to Terms
We may update these terms at any time. Continued use constitutes acceptance.

8. Contact
For questions, contact: support@footballiq.app`;

export function LegalModal({
  visible,
  type,
  onClose,
  testID,
}: LegalModalProps) {
  const { triggerLight } = useHaptics();

  if (!visible) return null;

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const content = type === 'privacy' ? PRIVACY_POLICY_CONTENT : TERMS_OF_SERVICE_CONTENT;

  const handleClose = () => {
    triggerLight();
    onClose();
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay} testID={testID}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          testID={testID ? `${testID}-backdrop` : undefined}
        />

        {/* Modal Content */}
        <Animated.View
          style={styles.container}
          entering={SlideInDown.springify().damping(15)}
          testID={testID ? `${testID}-container` : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={styles.title}
              accessibilityRole="header"
              testID={testID ? `${testID}-title` : undefined}
            >
              {title}
            </Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
              testID={testID ? `${testID}-close` : undefined}
            >
              <X size={24} color={colors.floodlightWhite} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            testID={testID ? `${testID}-scroll` : undefined}
          >
            <Text
              style={styles.content}
              testID={testID ? `${testID}-content` : undefined}
            >
              {content}
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    backgroundColor: colors.stadiumNavy,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  title: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  content: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    lineHeight: 24,
  },
});
