/**
 * GameHeader Component Tests
 *
 * TDD tests for the game header component that provides:
 * - Back button navigation
 * - Title display
 * - Optional right content (progress indicators, etc.)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GameHeader } from '../GameHeader';

// Track mock calls
const mockOnBack = jest.fn();

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

// Mock icons
jest.mock('lucide-react-native', () => ({
  ArrowLeft: ({ testID, color, size }: { testID?: string; color?: string; size?: number }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'arrow-left-icon'} />;
  },
  ChevronLeft: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'chevron-left-icon'} />;
  },
}));

describe('GameHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title text', () => {
      const { getByText } = render(
        <GameHeader title="Career Path" onBack={mockOnBack} />
      );

      expect(getByText('Career Path')).toBeTruthy();
    });

    it('renders back button by default', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      expect(getByTestId('header-back-button')).toBeTruthy();
    });

    it('hides back button when showBackButton=false', () => {
      const { queryByTestId } = render(
        <GameHeader
          title="Test"
          onBack={mockOnBack}
          showBackButton={false}
          testID="header"
        />
      );

      expect(queryByTestId('header-back-button')).toBeNull();
    });

    it('renders right content when provided', () => {
      const { getByTestId } = render(
        <GameHeader
          title="Test"
          onBack={mockOnBack}
          rightContent={<Text testID="progress">Step 1/5</Text>}
        />
      );

      expect(getByTestId('progress')).toBeTruthy();
    });

    it('renders placeholder for right content alignment when no rightContent', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      // Should have a spacer to keep title centered
      expect(getByTestId('header-right-spacer')).toBeTruthy();
    });
  });

  describe('back button interaction', () => {
    it('calls onBack when back button is pressed', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      fireEvent.press(getByTestId('header-back-button'));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('has correct hitSlop for easier tapping', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const backButton = getByTestId('header-back-button');
      expect(backButton.props.hitSlop).toEqual({ top: 12, right: 12, bottom: 12, left: 12 });
    });
  });

  describe('styling', () => {
    it('uses headline text style for title', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const title = getByTestId('header-title');
      const style = title.props.style;

      // Flatten style if array
      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      expect(flatStyle.fontFamily).toBe('BebasNeue-Regular');
    });

    it('applies floodlight white color to title', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const title = getByTestId('header-title');
      const style = title.props.style;

      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      expect(flatStyle.color).toBe('#F8FAFC');
    });

    it('uses row layout with space-between alignment', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const container = getByTestId('header-container');
      const style = container.props.style;

      const flatStyle = Array.isArray(style)
        ? Object.assign({}, ...style.filter(Boolean))
        : style || {};

      expect(flatStyle.flexDirection).toBe('row');
      expect(flatStyle.alignItems).toBe('center');
    });
  });

  describe('accessibility', () => {
    it('back button has accessibility label', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const backButton = getByTestId('header-back-button');
      expect(backButton.props.accessibilityLabel).toBe('Go back');
    });

    it('back button has button accessibility role', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const backButton = getByTestId('header-back-button');
      expect(backButton.props.accessibilityRole).toBe('button');
    });

    it('title has header accessibility role', () => {
      const { getByTestId } = render(
        <GameHeader title="Test" onBack={mockOnBack} testID="header" />
      );

      const title = getByTestId('header-title');
      expect(title.props.accessibilityRole).toBe('header');
    });
  });
});
