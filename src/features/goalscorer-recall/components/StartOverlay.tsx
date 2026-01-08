/**
 * Start Overlay component for Goalscorer Recall.
 *
 * Displays pre-game overlay with:
 * - Game instructions
 * - Start button
 * - Animated entrance
 */

import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, textStyles, spacing, borderRadius, fonts, fontWeights } from '@/theme';
import { ElevatedButton } from '@/components';

interface StartOverlayProps {
  totalScorers: number;
  onStart: () => void;
}

export function StartOverlay({ totalScorers, onStart }: StartOverlayProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon}>⚽</Text>

        {/* Title */}
        <Text style={[textStyles.title, styles.title]}>
          Name the Scorers
        </Text>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            You have{' '}
            <Text style={styles.highlight}>60 seconds</Text>
            {' '}to name all{' '}
            <Text style={styles.highlight}>{totalScorers}</Text>
            {' '}goalscorer{totalScorers !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.instructionSubtext}>
            Type a player's name and press Guess
          </Text>
        </View>

        {/* Start Button */}
        <ElevatedButton
          title="Start Game"
          onPress={onStart}
          variant="primary"
          style={styles.startButton}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.stadiumNavy,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    width: '100%',
    maxWidth: 320,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.floodlightWhite,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  instructions: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    color: colors.floodlightWhite,
    textAlign: 'center',
    lineHeight: 24,
  },
  highlight: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    color: colors.cardYellow,
  },
  instructionSubtext: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    color: colors.floodlightWhite,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  startButton: {
    width: '100%',
    marginTop: spacing.md,
  },
});
