import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, textStyles, borderRadius, shadowOffset } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Semantic button variants for consistent styling across the app.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

/**
 * Color configuration for each variant.
 */
interface VariantColorConfig {
  backgroundColor: string;
  borderBottomColor: string;
  borderColor?: string;
  textColor: string;
}

/**
 * Variant color mappings using solid 3D technique.
 * borderBottomColor is a darker shade of backgroundColor for the 3D depth effect.
 */
const VARIANT_COLORS: Record<ButtonVariant, VariantColorConfig> = {
  primary: {
    backgroundColor: colors.pitchGreen,
    borderBottomColor: colors.grassShadow,
    textColor: colors.stadiumNavy,
  },
  secondary: {
    backgroundColor: colors.stadiumNavy,
    borderBottomColor: '#0A1628', // Darker navy
    borderColor: colors.floodlightWhite,
    textColor: colors.floodlightWhite,
  },
  danger: {
    backgroundColor: colors.redCard,
    borderBottomColor: '#B91C1C', // Darker red
    textColor: colors.floodlightWhite,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass background
    borderBottomColor: 'rgba(255, 255, 255, 0.2)', // Slightly visible depth
    borderColor: colors.floodlightWhite,
    textColor: colors.floodlightWhite,
  },
};

export interface ElevatedButtonProps {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Optional leading icon (rendered before title) */
  icon?: ReactNode;
  /** Semantic color variant (default: 'primary') */
  variant?: ButtonVariant;
  /** Background color (overrides variant) */
  topColor?: string;
  /** Bottom border color for 3D effect (overrides variant) */
  shadowColor?: string;
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  /** Disable the button */
  disabled?: boolean;
  /** Stretch button to fill parent width */
  fullWidth?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

const SIZE_CONFIG = {
  small: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    depth: shadowOffset.buttonSmall,
    textStyle: textStyles.caption as TextStyle,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    depth: shadowOffset.button,
    textStyle: textStyles.button as TextStyle,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    depth: shadowOffset.buttonLarge,
    textStyle: textStyles.buttonLarge as TextStyle,
  },
};

/**
 * ElevatedButton - Duolingo-style 3D Tactile Button
 *
 * Uses the solid borderBottomWidth technique for reliable 3D depth.
 * On press, the button translates down and the border shrinks,
 * simulating being physically pressed into the screen.
 *
 * @example
 * <ElevatedButton title="Play" onPress={handlePlay} />
 * <ElevatedButton title="Give Up" onPress={handleGiveUp} variant="danger" />
 */
export function ElevatedButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  topColor,
  shadowColor,
  size = 'medium',
  disabled = false,
  fullWidth = false,
  style,
  testID,
}: ElevatedButtonProps) {
  const pressed = useSharedValue(0);
  const { triggerMedium } = useHaptics();

  const variantColors = VARIANT_COLORS[variant];
  const backgroundColor = topColor ?? variantColors.backgroundColor;
  const borderBottomColor = shadowColor ?? variantColors.borderBottomColor;
  const borderColor = variantColors.borderColor ?? backgroundColor;
  const textColor = variantColors.textColor;

  const sizeConfig = SIZE_CONFIG[size];
  const depth = sizeConfig.depth;

  // Animate translateY and borderBottomWidth together
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(pressed.value, [0, 1], [0, depth]) }],
    borderBottomWidth: interpolate(pressed.value, [0, 1], [depth, 0]),
  }));

  const handlePressIn = () => {
    if (!disabled) {
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (!disabled) {
      triggerMedium();
      onPress();
    }
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          // Keep original colors even when disabled - opacity handles the muted effect
          backgroundColor: backgroundColor,
          borderBottomColor: borderBottomColor,
          borderColor: borderColor,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderBottomWidth: depth,
          opacity: disabled ? 0.4 : 1,
        },
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[sizeConfig.textStyle, { color: textColor }]}>
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
