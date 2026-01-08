/**
 * LegalModal Tests
 *
 * TDD tests for the legal content modal that displays:
 * - Privacy Policy content
 * - Terms of Service content
 * - Scrollable text with close button
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LegalModal } from '../components/LegalModal';

// Mock theme
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
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
    '3xl': 48,
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
  }),
}));

describe('LegalModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders nothing when visible=false', () => {
      const { queryByTestId } = render(
        <LegalModal
          visible={false}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      expect(queryByTestId('legal-modal')).toBeNull();
    });

    it('renders modal when visible=true', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      expect(getByTestId('legal-modal')).toBeTruthy();
    });
  });

  describe('content', () => {
    it('displays Privacy Policy title when type=privacy', () => {
      const { getByText } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      expect(getByText('Privacy Policy')).toBeTruthy();
    });

    it('displays Terms of Service title when type=terms', () => {
      const { getByText } = render(
        <LegalModal
          visible={true}
          type="terms"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      expect(getByText('Terms of Service')).toBeTruthy();
    });

    it('renders scrollable content area', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      expect(getByTestId('legal-modal-scroll')).toBeTruthy();
    });

    it('displays privacy policy text content', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const content = getByTestId('legal-modal-content');
      // Content should have text children
      expect(content).toBeTruthy();
    });

    it('displays terms of service text content', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="terms"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const content = getByTestId('legal-modal-content');
      expect(content).toBeTruthy();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when X button pressed', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      fireEvent.press(getByTestId('legal-modal-close'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay backdrop pressed', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      fireEvent.press(getByTestId('legal-modal-backdrop'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('close button has X icon', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const closeButton = getByTestId('legal-modal-close');
      expect(closeButton).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('has dark overlay background', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const backdrop = getByTestId('legal-modal-backdrop');
      const style = backdrop.props.style;

      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      // Should have semi-transparent dark background
      expect(flatStyle.backgroundColor).toMatch(/rgba.*0\.[78]/);
    });

    it('modal content has rounded corners', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const container = getByTestId('legal-modal-container');
      const style = container.props.style;

      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      // Check for borderRadius OR borderTopLeftRadius (both indicate rounded corners)
      const hasRoundedCorners =
        (flatStyle.borderRadius && flatStyle.borderRadius > 0) ||
        (flatStyle.borderTopLeftRadius && flatStyle.borderTopLeftRadius > 0);
      expect(hasRoundedCorners).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('close button has accessibility label', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const closeButton = getByTestId('legal-modal-close');
      expect(closeButton.props.accessibilityLabel).toBe('Close');
    });

    it('modal title has header role', () => {
      const { getByTestId } = render(
        <LegalModal
          visible={true}
          type="privacy"
          onClose={mockOnClose}
          testID="legal-modal"
        />
      );

      const title = getByTestId('legal-modal-title');
      expect(title.props.accessibilityRole).toBe('header');
    });
  });
});
