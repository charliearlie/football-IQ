/**
 * GameContainer Component Tests
 *
 * TDD tests for the unified game screen container that provides:
 * - Consistent header with back button
 * - Safe area handling
 * - Optional collapsible header animation
 * - Keyboard avoiding behavior
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { GameContainer } from '../GameContainer';

// Track mock calls
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);
const mockTriggerLight = jest.fn();

// Mock theme
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },
  textStyles: {
    h1: { fontSize: 32, fontFamily: 'BebasNeue-Regular' },
    body: { fontSize: 16, fontFamily: 'Montserrat', fontWeight: '400' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  SafeAreaView: ({ children, style, edges, testID }: any) => {
    const { View } = require('react-native');
    return <View style={style} testID={testID}>{children}</View>;
  },
}));

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    replace: mockRouterReplace,
    canGoBack: mockCanGoBack,
    push: jest.fn(),
  }),
}));

// Mock haptics
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerLight: mockTriggerLight,
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
  }),
}));

// Mock icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'arrow-left-icon'} />;
  },
  ChevronLeft: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'chevron-left-icon'} />;
  },
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const Animated = {
    View,
    createAnimatedComponent: (component: any) => component,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    interpolate: (value: number, input: number[], output: number[]) => output[0],
    Easing: { out: (fn: any) => fn, ease: {}, bezier: () => {} },
  };
});

// Mock Keyboard from react-native (already included in react-native mock)

describe('GameContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title in header', () => {
      const { getByText } = render(
        <GameContainer title="Career Path">
          <Text>Content</Text>
        </GameContainer>
      );

      expect(getByText('Career Path')).toBeTruthy();
    });

    it('renders back button by default', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      expect(getByTestId('game-container-back-button')).toBeTruthy();
    });

    it('hides back button when showBackButton=false', () => {
      const { queryByTestId } = render(
        <GameContainer title="Test Game" testID="game-container" showBackButton={false}>
          <Text>Content</Text>
        </GameContainer>
      );

      expect(queryByTestId('game-container-back-button')).toBeNull();
    });

    it('renders children content', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game">
          <View testID="child-content">
            <Text>Game Content</Text>
          </View>
        </GameContainer>
      );

      expect(getByTestId('child-content')).toBeTruthy();
    });

    it('renders headerRight content when provided', () => {
      const { getByTestId } = render(
        <GameContainer
          title="Test Game"
          headerRight={<Text testID="progress-indicator">Step 1/5</Text>}
        >
          <Text>Content</Text>
        </GameContainer>
      );

      expect(getByTestId('progress-indicator')).toBeTruthy();
    });
  });

  describe('safe area handling', () => {
    it('uses SafeAreaView with top edge', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      // SafeAreaView should be present (mocked as View)
      expect(getByTestId('game-container-safe-area')).toBeTruthy();
    });

    it('does not apply manual paddingTop to container', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      const safeArea = getByTestId('game-container-safe-area');
      // SafeAreaView handles insets, so container should NOT have paddingTop: 47
      const style = safeArea.props.style;

      // Flatten style if it's an array
      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      // Should NOT have explicit paddingTop (SafeAreaView handles it via edges prop)
      expect(flatStyle.paddingTop).toBeUndefined();
    });
  });

  describe('back navigation', () => {
    it('calls router.back() on back button press', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      fireEvent.press(getByTestId('game-container-back-button'));

      expect(mockRouterBack).toHaveBeenCalled();
    });

    it('falls back to home when router cannot go back', () => {
      mockCanGoBack.mockReturnValueOnce(false);
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      fireEvent.press(getByTestId('game-container-back-button'));

      expect(mockRouterBack).not.toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });

    it('calls custom onBack handler when provided', () => {
      const customOnBack = jest.fn();
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container" onBack={customOnBack}>
          <Text>Content</Text>
        </GameContainer>
      );

      fireEvent.press(getByTestId('game-container-back-button'));

      expect(customOnBack).toHaveBeenCalled();
      expect(mockRouterBack).not.toHaveBeenCalled();
    });

    it('triggers haptic feedback on back press', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      fireEvent.press(getByTestId('game-container-back-button'));

      expect(mockTriggerLight).toHaveBeenCalled();
    });
  });

  describe('keyboard avoiding', () => {
    it('wraps content in KeyboardAvoidingView by default', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      expect(getByTestId('game-container-keyboard-avoiding')).toBeTruthy();
    });

    it('disables KeyboardAvoidingView when keyboardAvoiding=false', () => {
      const { queryByTestId } = render(
        <GameContainer title="Test Game" testID="game-container" keyboardAvoiding={false}>
          <Text>Content</Text>
        </GameContainer>
      );

      expect(queryByTestId('game-container-keyboard-avoiding')).toBeNull();
    });
  });

  describe('collapsible header', () => {
    it('does not animate header by default', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      const header = getByTestId('game-container-header');
      // Default behavior: no collapsible animation
      expect(header).toBeTruthy();
    });

    it('enables collapsible behavior when collapsible=true', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container" collapsible>
          <Text>Content</Text>
        </GameContainer>
      );

      // Header should have animated wrapper when collapsible
      expect(getByTestId('game-container-header-animated')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('back button has accessibility label', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      const backButton = getByTestId('game-container-back-button');
      expect(backButton.props.accessibilityLabel).toBe('Go back');
    });

    it('back button has button role', () => {
      const { getByTestId } = render(
        <GameContainer title="Test Game" testID="game-container">
          <Text>Content</Text>
        </GameContainer>
      );

      const backButton = getByTestId('game-container-back-button');
      expect(backButton.props.accessibilityRole).toBe('button');
    });
  });
});
