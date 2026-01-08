/**
 * RateAppModal Tests
 *
 * TDD tests for the rate app fallback modal when native review is unavailable.
 * This modal provides buttons to open App Store / Play Store directly.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { RateAppModal } from '../components/RateAppModal';

// Mock theme
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    cardYellow: '#FACC15',
    textSecondary: 'rgba(248, 250, 252, 0.7)',
  },
  textStyles: {
    h2: { fontSize: 24, fontFamily: 'BebasNeue-Regular' },
    body: { fontSize: 16, fontFamily: 'Montserrat', fontWeight: '400' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
}));

// Mock icons
jest.mock('lucide-react-native', () => ({
  X: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'x-icon'} />;
  },
  Star: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'star-icon'} />;
  },
}));

// Mock ElevatedButton
jest.mock('@/components/ElevatedButton', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ElevatedButton: ({ title, onPress, testID }: any) => (
      <Pressable onPress={onPress} testID={testID}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});

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
    FadeIn: { duration: () => ({ duration: () => ({}) }) },
    SlideInDown: { springify: () => ({ damping: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    SlideOutDown: {},
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
  };
});

// Mock haptics
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerLight: jest.fn(),
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
    triggerSuccess: jest.fn(),
  }),
}));

// Mock Linking
jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

describe('RateAppModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders nothing when visible=false', () => {
      const { queryByTestId } = render(
        <RateAppModal
          visible={false}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(queryByTestId('rate-modal')).toBeNull();
    });

    it('renders modal when visible=true', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(getByTestId('rate-modal')).toBeTruthy();
    });
  });

  describe('content', () => {
    it('displays rate app title', () => {
      const { getByText } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(getByText(/Rate.*App|Enjoying/i)).toBeTruthy();
    });

    it('displays encouraging message', () => {
      const { getByText } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      // Should have some encouraging text about rating
      expect(getByText(/rating|review|support/i)).toBeTruthy();
    });

    it('displays star icon', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(getByTestId('rate-modal-star')).toBeTruthy();
    });

    it('displays rate now button', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(getByTestId('rate-modal-rate-button')).toBeTruthy();
    });

    it('displays maybe later button', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      expect(getByTestId('rate-modal-later-button')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('opens store URL when rate button pressed', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      fireEvent.press(getByTestId('rate-modal-rate-button'));

      // Should call Linking.openURL with a store URL
      expect(Linking.openURL).toHaveBeenCalled();
    });

    it('calls onClose when maybe later pressed', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      fireEvent.press(getByTestId('rate-modal-later-button'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button pressed', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      fireEvent.press(getByTestId('rate-modal-close'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after rate button pressed', async () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      fireEvent.press(getByTestId('rate-modal-rate-button'));

      // Wait for async handler to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('has dark overlay background', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      const backdrop = getByTestId('rate-modal-backdrop');
      const style = backdrop.props.style;

      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      expect(flatStyle.backgroundColor).toMatch(/rgba.*0\.[78]/);
    });
  });

  describe('accessibility', () => {
    it('close button has accessibility label', () => {
      const { getByTestId } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      const closeButton = getByTestId('rate-modal-close');
      expect(closeButton.props.accessibilityLabel).toBe('Close');
    });

    it('rate button has accessible text', () => {
      const { getByText } = render(
        <RateAppModal
          visible={true}
          onClose={mockOnClose}
          testID="rate-modal"
        />
      );

      // ElevatedButton renders with title text which is accessible
      expect(getByText('Rate Now')).toBeTruthy();
    });
  });
});
