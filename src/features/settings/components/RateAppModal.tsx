/**
 * RateAppModal Component
 *
 * Fallback modal for rating the app when native review is unavailable.
 * Provides buttons to open App Store / Play Store directly.
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { X, Star } from 'lucide-react-native';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';

// TODO: Replace with actual App Store / Play Store IDs
const IOS_APP_ID = 'com.footballiq.app';
const ANDROID_PACKAGE = 'com.footballiq.app';

export interface RateAppModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

export function RateAppModal({
  visible,
  onClose,
  testID,
}: RateAppModalProps) {
  const { triggerLight, triggerNotification } = useHaptics();

  if (!visible) return null;

  const handleClose = () => {
    triggerLight();
    onClose();
  };

  const handleRateNow = async () => {
    triggerNotification('success');

    // Open appropriate store based on platform
    const storeUrl = Platform.select({
      ios: `https://apps.apple.com/app/${IOS_APP_ID}?action=write-review`,
      android: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
      default: '',
    });

    if (storeUrl) {
      await Linking.openURL(storeUrl);
    }

    onClose();
  };

  const handleMaybeLater = () => {
    triggerLight();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay} testID={testID}>
        {/* Backdrop */}
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          testID={testID ? `${testID}-backdrop` : undefined}
        />

        {/* Modal Content */}
        <Animated.View
          style={styles.container}
          entering={SlideInDown.springify().damping(15)}
        >
          {/* Close Button */}
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

          {/* Star Icon */}
          <View
            style={styles.iconContainer}
            testID={testID ? `${testID}-star` : undefined}
          >
            <Star
              size={48}
              color={colors.cardYellow}
              fill={colors.cardYellow}
              strokeWidth={2}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Enjoying Football IQ?</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your rating helps support the app and lets other football fans discover us!
          </Text>

          {/* Rate Now Button */}
          <ElevatedButton
            title="Rate Now"
            onPress={handleRateNow}
            style={styles.rateButton}
            testID={testID ? `${testID}-rate-button` : undefined}
          />

          {/* Maybe Later Button */}
          <ElevatedButton
            title="Maybe Later"
            onPress={handleMaybeLater}
            variant="outline"
            size="small"
            fullWidth
            testID={testID ? `${testID}-later-button` : undefined}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  iconContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  rateButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
});
