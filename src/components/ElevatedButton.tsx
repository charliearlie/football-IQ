import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, textStyles, borderRadius, depthOffset } from '@/theme';

/**
 * Semantic button variants for consistent styling across the app.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

/**
 * Color configuration for each variant.
 */
interface VariantColorConfig {
  backgroundColor: string;
  shadowColor: string;
  borderColor?: string;
  textColor: string;
}

/**
 * Variant color mappings using Solid Layer 3D technique.
 * shadowColor is a darker shade of backgroundColor for the depth effect.
 */
const VARIANT_COLORS: Record<ButtonVariant, VariantColorConfig> = {
  primary: {
    backgroundColor: colors.pitchGreen,
    shadowColor: colors.grassShadow,
    textColor: colors.stadiumNavy,
  },
  secondary: {
    backgroundColor: colors.stadiumNavy,
    shadowColor: '#0A1628', // Darker navy
    borderColor: colors.floodlightWhite,
    textColor: colors.floodlightWhite,
  },
  danger: {
    backgroundColor: colors.redCard,
    shadowColor: '#B91C1C', // Darker red
    textColor: colors.floodlightWhite,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass background
    shadowColor: 'rgba(255, 255, 255, 0.2)', // Slightly visible depth
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
  /** Shadow/depth color (overrides variant) */
  shadowColor?: string;
  /** Border color (overrides variant border color) */
  borderColorOverride?: string;
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  /** Disable the button */
  disabled?: boolean;
  /** Stretch button to fill parent width */
  fullWidth?: boolean;
  /** Haptic feedback type: 'light' for selection, 'medium' for impact, 'none' to disable */
  hapticType?: 'light' | 'medium' | 'none';
  /** Additional container styles */
  style?: ViewStyle;
  /** Custom text styles (overrides size config) */
  textStyle?: TextStyle;
  /** Test ID for testing */
  testID?: string;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * Size configuration for button variants.
 */
const SIZE_CONFIG = {
  small: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    depth: depthOffset.buttonSmall,
    textStyle: textStyles.buttonSmall as TextStyle,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    depth: depthOffset.button,
    textStyle: textStyles.button as TextStyle,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    depth: depthOffset.buttonLarge,
    textStyle: textStyles.buttonLarge as TextStyle,
  },
};

/**
 * ElevatedButton - Duolingo-style 3D Tactile Button
 *
 * Uses the "Solid Layer" architecture for reliable cross-platform 3D depth:
 * - Bottom layer: Fixed solid color block (the "shadow/depth")
 * - Top layer: Animated translateY on press (the "face")
 *
 * On press, the top face physically covers the bottom layer,
 * creating a perfect tactile compression effect.
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
  borderColorOverride,
  size = 'medium',
  disabled = false,
  fullWidth = false,
  hapticType = 'medium',
  style,
  textStyle,
  testID,
}: ElevatedButtonProps) {
  const pressed = useSharedValue(0);
  const { triggerMedium, triggerLight } = useHaptics();

  const variantColors = VARIANT_COLORS[variant];
  const backgroundColor = topColor ?? variantColors.backgroundColor;
  const depthColor = shadowColor ?? variantColors.shadowColor;
  const borderColor = borderColorOverride ?? variantColors.borderColor ?? backgroundColor;
  const textColor = variantColors.textColor;

  const sizeConfig = SIZE_CONFIG[size];
  const depth = sizeConfig.depth;

  // Animate only translateY on the top layer
  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      // Fire haptic immediately at press start based on hapticType
      if (hapticType === 'medium') {
        triggerMedium();
      } else if (hapticType === 'light') {
        triggerLight();
      }
      // 'none' - no haptic feedback
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG);
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          paddingBottom: depth,
          opacity: disabled ? 0.4 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      {/* Shadow/Depth Layer - Absolute, fills container minus depth offset */}
      <View
        style={[
          styles.shadowLayer,
          {
            top: depth, // Start where the top layer ends when pressed
            backgroundColor: depthColor,
            borderColor: depthColor,
          },
        ]}
      />

      {/* Top/Face Layer - Flows naturally, animates translateY */}
      <Animated.View
        style={[
          styles.topLayer,
          {
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            paddingVertical: sizeConfig.paddingVertical,
          },
          animatedTopStyle,
        ]}
      >
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[sizeConfig.textStyle, { color: textColor }, textStyle]}>
            {title}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    overflow: 'visible', // Critical for Android - prevents layer clipping
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // top is set dynamically based on depth
    borderRadius: borderRadius.xl,
    borderWidth: 2,
  },
  topLayer: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
