/**
 * Notification Permission Modal
 *
 * Custom permission request UI that explains the benefits of notifications
 * before triggering the system permission dialog.
 *
 * Shown after the user completes their first puzzle for higher acceptance rate.
 */

import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Bell, Flame, Trophy, Zap } from 'lucide-react-native';
import { ElevatedButton } from '@/components/ElevatedButton';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, textStyles, borderRadius, fonts, fontWeights } from '@/theme';
import type { NotificationPermissionModalProps } from '../types';

/**
 * Benefit item shown in the modal
 */
interface BenefitItemProps {
  icon: React.ReactNode;
  text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>{icon}</View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

export function NotificationPermissionModal({
  visible,
  onAccept,
  onDecline,
  testID,
}: NotificationPermissionModalProps) {
  const { triggerSelection, triggerSuccess } = useHaptics();

  const handleAccept = () => {
    triggerSuccess();
    onAccept();
  };

  const handleDecline = () => {
    triggerSelection();
    onDecline();
  };

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
            {/* Bell Icon */}
            <Animated.View
              entering={FadeIn.delay(200)}
              style={styles.iconContainer}
            >
              <Bell
                size={36}
                color={colors.floodlightWhite}
                strokeWidth={2}
              />
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>Don't Break Your Streak!</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Stay in the game with timely reminders
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <BenefitItem
                icon={<Trophy size={20} color={colors.cardYellow} />}
                text="Daily briefing reminders each morning"
              />
              <BenefitItem
                icon={<Flame size={20} color={colors.cardYellow} />}
                text="Streak-at-risk alerts before it's too late"
              />
              <BenefitItem
                icon={<Zap size={20} color={colors.cardYellow} />}
                text="Live ad-hoc challenges from our scouts"
              />
            </View>

            {/* Primary Button */}
            <View style={styles.buttonContainer}>
              <ElevatedButton
                title="Enable Notifications"
                onPress={handleAccept}
                size="large"
                fullWidth
                testID={testID ? `${testID}-accept` : undefined}
              />
            </View>

            {/* Secondary Link */}
            <Pressable
              onPress={handleDecline}
              style={styles.declineButton}
              testID={testID ? `${testID}-decline` : undefined}
            >
              <Text style={styles.declineText}>Maybe Later</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.pitchGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  benefitsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 15,
    color: colors.floodlightWhite,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  declineButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  declineText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
