import { ReactNode } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, borderRadius, depthOffset } from '@/theme';

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.5 };

export interface SquishCardProps {
  children: ReactNode;
  /** Press handler. If omitted, card is non-interactive (no squish). */
  onPress?: () => void;
  /** Shadow/depth color (default: rgba(0,0,0,0.4)) */
  shadowColor?: string;
  /** Depth in px (default: depthOffset.card = 3) */
  depth?: number;
  /** Card background color (default: #1E293B) */
  backgroundColor?: string;
  /** Border radius (default: 20) */
  radius?: number;
  /** Disable press interaction */
  disabled?: boolean;
  /** Additional styles on outer container */
  style?: ViewStyle;
  /** Additional styles on inner content */
  contentStyle?: ViewStyle;
  /** Test ID */
  testID?: string;
}

/**
 * SquishCard - A pressable card with tactile 3D squish effect.
 *
 * Uses the same "Solid Layer" architecture as ElevatedButton:
 * - Bottom layer: Fixed darker background (the "shadow")
 * - Top layer: Animated translateY on press (the "face")
 *
 * When pressed, the top face pushes down into the shadow, creating
 * a physical "card press" illusion with haptic feedback.
 */
export function SquishCard({
  children,
  onPress,
  shadowColor = colors.shadowDark,
  depth = depthOffset.card,
  backgroundColor = colors.surface,
  radius = borderRadius['2xl'],
  disabled = false,
  style,
  contentStyle,
  testID,
}: SquishCardProps) {
  const pressed = useSharedValue(0);
  const { triggerLight } = useHaptics();

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }],
  }));

  const handlePressIn = () => {
    if (!disabled && onPress) {
      triggerLight();
      pressed.value = withSpring(1, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      pressed.value = withSpring(0, SPRING_CONFIG);
    }
  };

  // Non-interactive card (no onPress) — static depth for visual layering
  if (!onPress) {
    return (
      <View
        style={[{ paddingBottom: depth }, style]}
        testID={testID}
      >
        <View
          style={[
            staticStyles.shadowLayer,
            { top: depth, backgroundColor: shadowColor, borderRadius: radius },
          ]}
        />
        <View
          style={[
            staticStyles.topLayer,
            { backgroundColor, borderRadius: radius },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        { paddingBottom: depth, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      testID={testID}
    >
      {/* Shadow Layer */}
      <View
        style={[
          staticStyles.shadowLayer,
          { top: depth, backgroundColor: shadowColor, borderRadius: radius },
        ]}
      />

      {/* Top/Face Layer */}
      <Animated.View
        style={[
          staticStyles.topLayer,
          { backgroundColor, borderRadius: radius },
          animatedTopStyle,
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const staticStyles = StyleSheet.create({
  shadowLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  topLayer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
