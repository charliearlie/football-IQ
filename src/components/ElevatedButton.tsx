import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/hooks/useHaptics';
import { colors, textStyles, borderRadius, shadowOffset } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ElevatedButtonProps {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Top layer color (default: Pitch Green) */
  topColor?: string;
  /** Shadow/bottom layer color (default: Grass Shadow) */
  shadowColor?: string;
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  /** Disable the button */
  disabled?: boolean;
  /** Additional container styles */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

const SIZE_CONFIG = {
  small: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    offset: 3,
    textStyle: textStyles.caption as TextStyle,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    offset: shadowOffset.button,
    textStyle: textStyles.button as TextStyle,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    offset: shadowOffset.buttonLarge,
    textStyle: textStyles.buttonLarge as TextStyle,
  },
};

/**
 * ElevatedButton - Neubrutalist 3D Button
 *
 * A tactile button with a 3D press effect and haptic feedback.
 * The top layer translates down on press to meet the shadow layer,
 * creating a satisfying "click" sensation.
 */
export function ElevatedButton({
  title,
  onPress,
  topColor = colors.pitchGreen,
  shadowColor = colors.grassShadow,
  size = 'medium',
  disabled = false,
  style,
  testID,
}: ElevatedButtonProps) {
  const pressed = useSharedValue(0);
  const { triggerSelection } = useHaptics();

  const sizeConfig = SIZE_CONFIG[size];
  const offset = sizeConfig.offset;

  const animatedTopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * offset }],
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
      triggerSelection();
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
        styles.container,
        { paddingBottom: offset },
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      {/* Shadow layer (bottom) */}
      <Animated.View
        style={[
          styles.layer,
          styles.shadow,
          {
            backgroundColor: disabled ? colors.textSecondary : shadowColor,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            paddingVertical: sizeConfig.paddingVertical,
          },
        ]}
      >
        <Text style={[sizeConfig.textStyle, styles.text, { opacity: 0 }]}>
          {title}
        </Text>
      </Animated.View>

      {/* Top layer */}
      <Animated.View
        style={[
          styles.layer,
          styles.top,
          {
            backgroundColor: disabled ? colors.glassBorder : topColor,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            paddingVertical: sizeConfig.paddingVertical,
            top: 0,
          },
          animatedTopStyle,
        ]}
      >
        <Text
          style={[
            sizeConfig.textStyle,
            styles.text,
            disabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  layer: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.stadiumNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    position: 'relative',
  },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  text: {
    color: colors.stadiumNavy,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.7,
  },
});
