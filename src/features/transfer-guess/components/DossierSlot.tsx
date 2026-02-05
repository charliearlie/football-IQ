import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, fonts, borderRadius, depthOffset } from '@/theme';
import { FlagIcon } from '@/components/FlagIcon';
import { HintLabel } from '../types/transferGuess.types';

/** Regex to detect ISO 3166-1 alpha-2 codes (e.g. "BR", "GB-ENG") */
const ISO_CODE_PATTERN = /^[A-Z]{2}(-[A-Z]{2,3})?$/;

/** Depth for 3D effect (4px as per Solid Layer pattern) */
const DEPTH = depthOffset.tictacCell;

/** Slot height for consistent sizing */
const SLOT_HEIGHT = 80;

/** Background tint for dossier paper effect */
const DOSSIER_BACKGROUND = 'rgba(255, 255, 255, 0.1)';
const DOSSIER_SHADOW = 'rgba(255, 255, 255, 0.05)';

/** Spring config for reveal pop animation */
const POP_SPRING = {
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

const SETTLE_SPRING = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

/** Map hint labels to custom PNG icons */
const SLOT_PNG_ICONS: Record<HintLabel, ImageSourcePropType> = {
  Year: require('../../../../assets/images/transfer-year.png'),
  Position: require('../../../../assets/images/transfer-position.png'),
  Nation: require('../../../../assets/images/transfer-nationality.png'),
};

export interface DossierSlotProps {
  /** The hint label (Year, Position, Nation) */
  label: HintLabel;
  /** The hint text content */
  hint: string;
  /** Whether the hint has been revealed */
  isRevealed: boolean;
  /** Whether in review mode (shows different styling for unrevealed) */
  isReviewMode?: boolean;
  /** Optional style overrides for flex layout */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

/**
 * DossierSlot - A single intel card in the Scout's Dossier grid.
 *
 * Uses Solid Layer 3D architecture with custom PNG icons.
 * Hidden: Shows custom icon for the hint type
 * Revealed: Shows the actual value with pitchGreen border glow
 */
export function DossierSlot({
  label,
  hint,
  isRevealed,
  isReviewMode = false,
  style,
  testID,
}: DossierSlotProps) {
  const wasRevealedRef = useRef(false);

  // Animation values
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(isRevealed ? 1 : 0);
  const pressOffset = useSharedValue(0);

  // Trigger reveal animation when hint is unlocked
  useEffect(() => {
    if (isRevealed && !wasRevealedRef.current) {
      // Scale animation: compress -> pop -> settle
      scale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withSpring(1.05, POP_SPRING),
        withSpring(1.0, SETTLE_SPRING)
      );

      // Border color transition: navy -> green
      borderProgress.value = withTiming(1, { duration: 300 });

      wasRevealedRef.current = true;
    }
  }, [isRevealed, scale, borderProgress]);

  // Top layer animated style (scale + translateY + border color)
  const animatedTopStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderProgress.value,
      [0, 1],
      [colors.stadiumNavy, colors.pitchGreen]
    );

    return {
      transform: [
        { scale: scale.value },
        { translateY: pressOffset.value * DEPTH },
      ],
      borderColor,
    };
  });

  // Determine content opacity for review mode (unrevealed slots are dimmed)
  const contentOpacity = !isRevealed && isReviewMode ? 0.4 : 1;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Shadow Layer - Fixed at bottom */}
      <View style={styles.shadowLayer} />

      {/* Top Layer - Animates on reveal */}
      <Animated.View style={[styles.topLayer, animatedTopStyle]}>
        <View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Icon (hidden state) or Value (revealed state) */}
          {isRevealed ? (
            label === 'Nation' && ISO_CODE_PATTERN.test(hint) ? (
              <View testID={`${testID}-flag`} style={styles.flagContainer}>
                <FlagIcon code={hint} size={32} />
              </View>
            ) : (
              <Text
                style={styles.revealedValue}
                testID={`${testID}-value`}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {hint}
              </Text>
            )
          ) : (
            <Image
              source={SLOT_PNG_ICONS[label]}
              style={styles.icon}
              resizeMode="contain"
              testID={`${testID}-icon`}
            />
          )}
        </View>

        {/* Label at bottom */}
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLOT_HEIGHT + DEPTH,
    paddingBottom: DEPTH,
    overflow: 'visible', // Critical for Android 3D effect
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SLOT_HEIGHT,
    backgroundColor: DOSSIER_SHADOW,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.8)', // Dark navy shadow border
  },
  topLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_HEIGHT,
    backgroundColor: DOSSIER_BACKGROUND,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.stadiumNavy, // Will be animated to pitchGreen
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },
  flagContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  revealedValue: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.pitchGreen,
    textAlign: 'center',
    letterSpacing: 1,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: '600',
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
