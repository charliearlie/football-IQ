import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Share2 } from 'lucide-react-native';
import { IconButton, ElevatedButton } from '@/components';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { ShareResult } from '../utils/transferShare';

/** Spring config for entry animation */
const ENTRY_SPRING = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

export interface TransferGameOverZoneProps {
  /** The correct player name */
  answer: string;
  /** Whether the player won the game */
  won: boolean;
  /** Callback to share the game result */
  onShare: () => Promise<ShareResult>;
  /** Callback to view detailed score breakdown */
  onSeeScore: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * TransferGameOverZone - Replaces the DossierGrid when the game ends.
 *
 * Displays the player's name in a "glowing badge" style with:
 * - Fade-in + scale-up entry animation
 * - Pitch green glow effect for correct answers
 * - Share button for social sharing
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │              CORRECT!                   │
 * │                                         │
 * │          KYLIAN MBAPPÉ                  │
 * │                                         │
 * │      [Share]    [See Score]             │
 * └─────────────────────────────────────────┘
 */
export function TransferGameOverZone({
  answer,
  won,
  onShare,
  onSeeScore,
  testID,
}: TransferGameOverZoneProps) {
  // Animation values for entry effect
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Trigger entry animation on mount
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    scale.value = withSpring(1.0, ENTRY_SPRING);
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} testID={testID}>
      {/* Glowing badge container */}
      <View style={[styles.badgeContainer, won && styles.badgeContainerWon]}>
        {/* Status label */}
        <Text style={styles.label} testID={`${testID}-label`}>
          {won ? 'CORRECT!' : 'THE ANSWER'}
        </Text>

        {/* Player name */}
        <Text
          style={[styles.playerName, won && styles.playerNameWon]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          testID={`${testID}-answer`}
        >
          {answer}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <IconButton
          icon={<Share2 size={20} color={colors.stadiumNavy} />}
          onPress={onShare}
          label="Share"
          variant="primary"
          size="medium"
          testID={`${testID}-share`}
        />
        <ElevatedButton
          title="See how you scored"
          onPress={onSeeScore}
          size="medium"
          testID={`${testID}-score-button`}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  badgeContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(248, 250, 252, 0.05)', // Subtle white tint
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  badgeContainerWon: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)', // 10% pitchGreen tint
    borderColor: colors.pitchGreen,
    // Glow effect via shadow
    ...Platform.select({
      ios: {
        shadowColor: colors.pitchGreen,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  playerName: {
    fontFamily: fonts.headline,
    fontSize: 32,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 1,
  },
  playerNameWon: {
    color: colors.pitchGreen,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
