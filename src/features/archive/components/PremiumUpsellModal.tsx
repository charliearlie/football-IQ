/**
 * PremiumUpsellModal Component
 *
 * Modal shown when user taps a locked archive puzzle.
 * Placeholder for premium upgrade flow - logs action for now.
 */

import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Lock, Crown, Archive } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { colors } from '@/theme/colors';
import { spacing, borderRadius } from '@/theme/spacing';
import { fonts, textStyles } from '@/theme/typography';

interface PremiumUpsellModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Date of the puzzle user tried to access (optional) */
  puzzleDate?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Premium upgrade prompt modal.
 *
 * Shows benefits of premium and upgrade CTA.
 * Currently a placeholder - upgrade button logs to console.
 */
export function PremiumUpsellModal({
  visible,
  onClose,
  puzzleDate,
  testID,
}: PremiumUpsellModalProps) {
  const handleUpgrade = () => {
    console.log('[PremiumUpsellModal] Upgrade pressed - placeholder');
    // TODO: Implement actual premium upgrade flow
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={styles.modal}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Lock size={32} color={colors.stadiumNavy} strokeWidth={2} />
          </View>

          {/* Title */}
          <Text style={styles.title}>UNLOCK ARCHIVE</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Get unlimited access to all past puzzles
          </Text>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <Archive size={20} color={colors.cardYellow} />
              <Text style={styles.featureText}>
                Full puzzle archive (1000+ puzzles)
              </Text>
            </View>
            <View style={styles.featureRow}>
              <Crown size={20} color={colors.cardYellow} />
              <Text style={styles.featureText}>
                Premium badge on your profile
              </Text>
            </View>
          </View>

          {/* Puzzle Date Info */}
          {puzzleDate && (
            <Text style={styles.puzzleInfo}>
              You tried to access a puzzle from {puzzleDate}
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <ElevatedButton
              title="Upgrade to Premium"
              onPress={handleUpgrade}
              size="medium"
              topColor={colors.cardYellow}
              shadowColor="#D4A500"
              testID={`${testID}-upgrade-button`}
            />
            <ElevatedButton
              title="Maybe Later"
              onPress={onClose}
              size="medium"
              topColor={colors.glassBackground}
              shadowColor={colors.glassBorder}
              testID={`${testID}-close-button`}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.cardYellow,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cardYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 36,
    letterSpacing: 2,
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    flex: 1,
  },
  puzzleInfo: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
