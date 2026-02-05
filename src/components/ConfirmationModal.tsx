/**
 * ConfirmationModal
 *
 * Reusable confirmation dialog following the Digital Pitch neubrutalist style.
 * Used primarily for "Give Up" confirmation across game modes, but generic
 * enough for any destructive-action confirmation.
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, textStyles, borderRadius, fonts, fontWeights } from '@/theme';

export interface ConfirmationModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Title text */
  title?: string;
  /** Body message */
  message?: string;
  /** Label for the confirm (destructive) button */
  confirmLabel?: string;
  /** Label for the cancel (safe) button */
  cancelLabel?: string;
  /** Called when user confirms the action */
  onConfirm: () => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Visual variant controlling confirm button style */
  variant?: 'danger' | 'warning';
  /** Test ID for testing */
  testID?: string;
}

export function ConfirmationModal({
  visible,
  title = 'Give Up?',
  message = 'Are you sure you want to give up? The solution will be revealed.',
  confirmLabel = 'Reveal Answer',
  cancelLabel = 'Back to Game',
  onConfirm,
  onCancel,
  variant = 'danger',
  testID,
}: ConfirmationModalProps) {
  const { triggerSelection } = useHaptics();

  const handleConfirm = () => {
    triggerSelection();
    onConfirm();
  };

  const handleCancel = () => {
    triggerSelection();
    onCancel();
  };

  const iconColor = variant === 'danger' ? colors.redCard : colors.amber;
  const iconBgColor =
    variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(250, 204, 21, 0.15)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID={testID}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.springify().damping(15)}
          style={styles.centeredView}
        >
          <View style={styles.card}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
              <AlertTriangle size={32} color={iconColor} strokeWidth={2} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Confirm Button */}
            <View style={styles.buttonContainer}>
              <ElevatedButton
                title={confirmLabel}
                onPress={handleConfirm}
                variant="danger"
                fullWidth
                testID={testID ? `${testID}-confirm` : undefined}
              />
            </View>

            {/* Cancel Link */}
            <Pressable
              onPress={handleCancel}
              style={styles.cancelButton}
              testID={testID ? `${testID}-cancel` : undefined}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h2,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
