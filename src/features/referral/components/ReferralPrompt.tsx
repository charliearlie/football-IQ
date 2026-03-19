/**
 * ReferralPrompt
 *
 * Shown in the result modal after high-score games (moment of delight).
 * Encourages users to invite friends by sharing their referral link.
 * Only shown for non-premium users who have completed at least a few games.
 */

import React, { useCallback } from 'react';
import { Share, Pressable, Text, View, StyleSheet } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/theme';
import { useReferralCode } from '../hooks/useReferralCode';

const REFERRAL_BASE_URL = 'https://football-iq.app/app/ref';

interface ReferralPromptProps {
  userId: string | null;
  onShare?: () => void;
}

export function ReferralPrompt({ userId, onShare }: ReferralPromptProps) {
  const { code } = useReferralCode(userId);

  const handlePress = useCallback(async () => {
    if (!code) return;

    const url = `${REFERRAL_BASE_URL}/${code}`;
    const message = `Think you know football? Prove it on Football IQ — 11 game modes, daily puzzles. Join me: ${url}`;

    try {
      await Share.share({ message });
      onShare?.();
    } catch (err) {
      console.warn('[ReferralPrompt] Share failed:', err);
    }
  }, [code, onShare]);

  if (!code) return null;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Invite a friend"
    >
      <View style={styles.iconContainer}>
        <UserPlus size={16} color={colors.pitchGreen} strokeWidth={2.5} />
      </View>
      <Text style={styles.text}>
        Invite a friend, earn 3 free archive unlocks
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pitchGreen,
    textDecorationLine: 'underline',
  },
});
