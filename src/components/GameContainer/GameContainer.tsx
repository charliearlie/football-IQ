/**
 * GameContainer Component
 *
 * Unified wrapper for all game screens providing:
 * - Consistent header with back button
 * - Safe area handling
 * - Optional collapsible header animation
 * - Keyboard avoiding behavior
 */

import React, { ReactNode, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { GameHeader } from './GameHeader';

const HEADER_HEIGHT = 56;

export interface GameContainerProps {
  /** Screen title displayed in header */
  title: string;
  /** Optional right-side content in header (e.g., progress indicator) */
  headerRight?: ReactNode;
  /** Enable collapsible header animation when keyboard opens (default: false) */
  collapsible?: boolean;
  /** Show back button in header (default: true) */
  showBackButton?: boolean;
  /** Custom back handler (defaults to router.back()) */
  onBack?: () => void;
  /** Help button handler - shows help icon in header when provided */
  onHelpPress?: () => void;
  /** Enable KeyboardAvoidingView behavior (default: true) */
  keyboardAvoiding?: boolean;
  /** Content to render in the container */
  children: ReactNode;
  /** Optional container style overrides */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
}

export function GameContainer({
  title,
  headerRight,
  collapsible = false,
  showBackButton = true,
  onBack,
  onHelpPress,
  keyboardAvoiding = true,
  children,
  style,
  testID,
}: GameContainerProps) {
  const router = useRouter();
  const { triggerLight } = useHaptics();

  // Keyboard visibility for collapsible header animation
  const keyboardVisible = useSharedValue(0);

  // Listen for keyboard show/hide events (only when collapsible)
  useEffect(() => {
    if (!collapsible) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      keyboardVisible.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardVisible.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [collapsible, keyboardVisible]);

  // Animated style for collapsible header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    if (!collapsible) return {};

    return {
      height: interpolate(keyboardVisible.value, [0, 1], [HEADER_HEIGHT, 0]),
      opacity: interpolate(keyboardVisible.value, [0, 0.3], [1, 0]),
      overflow: 'hidden' as const,
    };
  });

  /**
   * Handle back button press
   */
  const handleBack = () => {
    triggerLight();
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  /**
   * Render header - animated if collapsible, static otherwise
   */
  const renderHeader = () => {
    const headerContent = (
      <GameHeader
        title={title}
        rightContent={headerRight}
        showBackButton={showBackButton}
        onBack={handleBack}
        onHelpPress={onHelpPress}
        testID={testID ? `${testID}` : undefined}
      />
    );

    if (collapsible) {
      return (
        <Animated.View
          style={headerAnimatedStyle}
          testID={testID ? `${testID}-header-animated` : undefined}
        >
          {headerContent}
        </Animated.View>
      );
    }

    return (
      <View testID={testID ? `${testID}-header` : undefined}>
        {headerContent}
      </View>
    );
  };

  /**
   * Render content - wrapped in KeyboardAvoidingView if enabled
   */
  const renderContent = () => {
    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          testID={testID ? `${testID}-keyboard-avoiding` : undefined}
        >
          {children}
        </KeyboardAvoidingView>
      );
    }

    return <>{children}</>;
  };

  return (
    <SafeAreaView
      style={[styles.container, style]}
      edges={['top']}
      testID={testID ? `${testID}-safe-area` : undefined}
    >
      {renderHeader()}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});
