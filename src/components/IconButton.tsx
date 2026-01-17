import { Pressable, Text, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, textStyles, borderRadius, depthOffset } from '@/theme';

/**
 * Semantic button variants for consistent styling.
 */
export type IconButtonVariant = 'primary' | 'secondary' | 'outline';

/**
 * Color configuration for each variant.
 */
interface VariantColorConfig {
  backgroundColor: string;
  shadowColor: string;
  borderColor?: string;
  iconColor: string;
}

/**
 * Variant color mappings using Solid Layer 3D technique.
 */
const VARIANT_COLORS: Record<IconButtonVariant, VariantColorConfig> = {
  primary: {
    backgroundColor: colors.pitchGreen,
    shadowColor: colors.grassShadow,
    iconColor: colors.stadiumNavy,
  },
  secondary: {
    backgroundColor: colors.stadiumNavy,
    shadowColor: '#0A1628',
    borderColor: colors.floodlightWhite,
    iconColor: colors.floodlightWhite,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: colors.glassBorder,
    iconColor: colors.floodlightWhite,
  },
};

/**
 * Size configuration for icon button variants.
 */
const SIZE_CONFIG = {
  small: {
    size: 40,
    iconPadding: 10,
    depth: depthOffset.buttonSmall,
    labelStyle: textStyles.caption,
  },
  medium: {
    size: 48,
    iconPadding: 12,
    depth: depthOffset.button,
    labelStyle: textStyles.bodySmall,
  },
};

export interface IconButtonProps {
  /** The icon to display */
  icon: ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Optional label below the button (e.g., "Copied!") */
  label?: string;
  /** Semantic color variant (default: 'primary') */
  variant?: IconButtonVariant;
  /** Button size variant (default: 'medium') */
  size?: 'small' | 'medium';
  /** Disable the button */
  disabled?: boolean;
  /** Test ID for testing */
  testID?: string;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.5,
};

/**
 * IconButton - A square icon-only elevated button with 3D tactile effect.
 *
 * Uses the same "Solid Layer" architecture as ElevatedButton for
 * consistent depth and animation across the design system.
 *
 * @example
 * <IconButton
 *   icon={<Share2 size={20} />}
 *   onPress={handleShare}
 *   label="Share"
 * />
 */
export function IconButton({
  icon,
  onPress,
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  testID,
}: IconButtonProps) {
  const pressed = useSharedValue(0);
  const { triggerMedium } = useHaptics();

  const variantColors = VARIANT_COLORS[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const depth = sizeConfig.depth;

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      triggerMedium();
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
    <View style={styles.wrapper}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.container,
          {
            width: sizeConfig.size,
            height: sizeConfig.size + depth,
            paddingBottom: depth,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Icon button'}
        accessibilityState={{ disabled }}
      >
        {/* Shadow/Depth Layer */}
        <View
          style={[
            styles.shadowLayer,
            {
              top: depth,
              width: sizeConfig.size,
              height: sizeConfig.size,
              backgroundColor: variantColors.shadowColor,
              borderColor: variantColors.shadowColor,
            },
          ]}
        />

        {/* Top/Face Layer */}
        <Animated.View
          style={[
            styles.topLayer,
            {
              width: sizeConfig.size,
              height: sizeConfig.size,
              backgroundColor: variantColors.backgroundColor,
              borderColor: variantColors.borderColor ?? variantColors.backgroundColor,
            },
            animatedTopStyle,
          ]}
        >
          {icon}
        </Animated.View>
      </Pressable>

      {/* Optional label below button */}
      {label && (
        <Text style={[sizeConfig.labelStyle, styles.label]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    alignSelf: 'center',
    overflow: 'visible',
  },
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  topLayer: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
