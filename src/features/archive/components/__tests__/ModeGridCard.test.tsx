/**
 * ModeGridCard Component Tests (TDD)
 *
 * Verifies that the ModeGridCard shows clean progress info with no PRO-related UI.
 *
 * Covers:
 * - No "PRO" text appears anywhere in the rendered card
 * - Subtitle shows "X of Y played" when playedCount > 0
 * - Subtitle shows "Y puzzles" when playedCount === 0
 * - Card opacity is always 1 (no dimming for locked cards)
 * - Card is always pressable (even when all puzzles are locked)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModeGridCard } from '../ModeGridCard';

// ── Mocks ──────────────────────────────────────────────────────────────────

// react-native-reanimated is already mocked globally in jest-setup.ts

// Mock lucide-react-native icons used inside ModeGridCard (Check icon)
jest.mock('lucide-react-native', () => ({
  Check: () => null,
  Grid3X3: () => null,
  Link: () => null,
  Shirt: () => null,
  HelpCircle: () => null,
}));

// Mock GameModeIcon (uses react-native-svg which is not needed here)
jest.mock('@/components', () => ({
  GameModeIcon: () => null,
}));

// Mock @/theme/home-design so font/color constants resolve to plain strings
jest.mock('@/theme/home-design', () => ({
  HOME_COLORS: {
    stadiumNavy: '#0F172A',
    surface: '#1E293B',
    surfaceShadow: 'rgba(0, 0, 0, 0.4)',
    border: 'rgba(255, 255, 255, 0.08)',
    textSecondary: '#94A3B8',
  },
  HOME_FONTS: {
    heading: 'System',
    body: 'System',
  },
}));

// Mock haptics (expo-haptics is already mocked globally; this covers the wrapper)
jest.mock('@/lib/haptics', () => ({
  triggerLight: jest.fn(),
}));

// ── Default props helper ───────────────────────────────────────────────────

type ModeGridCardProps = React.ComponentProps<typeof ModeGridCard>;

function buildProps(overrides: Partial<ModeGridCardProps> = {}): ModeGridCardProps {
  return {
    gameMode: 'career_path',
    title: 'Career Path',
    playedCount: 3,
    totalCount: 10,
    hasUnplayed: true,
    lockedCount: 0,
    onPress: jest.fn(),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ModeGridCard', () => {
  describe('PRO badge removal', () => {
    it('does not show PRO text when some puzzles are locked', () => {
      const { queryByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 2, totalCount: 10, lockedCount: 5, hasUnplayed: false })}
        />
      );

      expect(queryByText('PRO')).toBeNull();
    });

    it('does not show PRO text when all puzzles are locked', () => {
      const { queryByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 0, totalCount: 8, lockedCount: 8, hasUnplayed: false })}
        />
      );

      expect(queryByText('PRO')).toBeNull();
    });

    it('does not show PRO text when no puzzles are locked', () => {
      const { queryByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 5, totalCount: 10, lockedCount: 0, hasUnplayed: true })}
        />
      );

      expect(queryByText('PRO')).toBeNull();
    });

    it('does not contain any text matching "PRO" anywhere in the card', () => {
      const { queryByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 1, totalCount: 5, lockedCount: 3, hasUnplayed: false })}
        />
      );

      // Check for both "PRO" and "with PRO" patterns
      expect(queryByText(/PRO/)).toBeNull();
      expect(queryByText(/with PRO/)).toBeNull();
    });
  });

  describe('subtitle text', () => {
    it('shows "X of Y played" when playedCount is greater than zero', () => {
      const { getByText } = render(
        <ModeGridCard {...buildProps({ playedCount: 3, totalCount: 10 })} />
      );

      expect(getByText('3 of 10 played')).toBeTruthy();
    });

    it('shows "1 of Y played" when playedCount is exactly 1', () => {
      const { getByText } = render(
        <ModeGridCard {...buildProps({ playedCount: 1, totalCount: 8 })} />
      );

      expect(getByText('1 of 8 played')).toBeTruthy();
    });

    it('shows "X of Y played" when all puzzles are played (completed state)', () => {
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 10, totalCount: 10, hasUnplayed: false, lockedCount: 0 })}
        />
      );

      expect(getByText('10 of 10 played')).toBeTruthy();
    });

    it('shows "Y puzzles" when playedCount is zero', () => {
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 0, totalCount: 7, hasUnplayed: true, lockedCount: 0 })}
        />
      );

      expect(getByText('7 puzzles')).toBeTruthy();
    });

    it('shows "Y puzzles" when playedCount is zero and all puzzles are locked', () => {
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 0, totalCount: 5, hasUnplayed: false, lockedCount: 5 })}
        />
      );

      expect(getByText('5 puzzles')).toBeTruthy();
    });

    it('does not show the old "X played · Y with PRO" format', () => {
      const { queryByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 2, totalCount: 8, lockedCount: 3, hasUnplayed: false })}
        />
      );

      // Old format used middle dot separator
      expect(queryByText(/played\s*·/)).toBeNull();
      expect(queryByText(/with PRO/)).toBeNull();
    });
  });

  describe('card opacity', () => {
    it('has opacity of 1 when all puzzles are locked (fully locked state)', () => {
      const { getByTestId } = render(
        <ModeGridCard
          {...buildProps({
            playedCount: 0,
            totalCount: 6,
            hasUnplayed: false,
            lockedCount: 6,
          })}
          testID="mode-card"
        />
      );

      // The Animated.View receives the opacity style; check that opacity is 1
      const card = getByTestId('mode-card');
      const flatStyle = Array.isArray(card.props.style)
        ? Object.assign({}, ...card.props.style.filter(Boolean))
        : card.props.style ?? {};
      expect(flatStyle.opacity).toBe(1);
    });

    it('has opacity of 1 when some puzzles are locked', () => {
      const { getByTestId } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 2, totalCount: 10, lockedCount: 5, hasUnplayed: false })}
          testID="mode-card"
        />
      );

      const card = getByTestId('mode-card');
      const flatStyle = Array.isArray(card.props.style)
        ? Object.assign({}, ...card.props.style.filter(Boolean))
        : card.props.style ?? {};
      expect(flatStyle.opacity).toBe(1);
    });

    it('has opacity of 1 when no puzzles are locked', () => {
      const { getByTestId } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 5, totalCount: 10, lockedCount: 0, hasUnplayed: true })}
          testID="mode-card"
        />
      );

      const card = getByTestId('mode-card');
      const flatStyle = Array.isArray(card.props.style)
        ? Object.assign({}, ...card.props.style.filter(Boolean))
        : card.props.style ?? {};
      expect(flatStyle.opacity).toBe(1);
    });
  });

  describe('pressability', () => {
    it('calls onPress when tapped with no locked puzzles', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({ playedCount: 3, totalCount: 10, lockedCount: 0, hasUnplayed: true, onPress })}
        />
      );

      fireEvent.press(getByText('Career Path'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress when tapped and all puzzles are locked', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({
            playedCount: 0,
            totalCount: 8,
            hasUnplayed: false,
            lockedCount: 8,
            onPress,
          })}
        />
      );

      fireEvent.press(getByText('Career Path'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPress when tapped and some puzzles are locked', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <ModeGridCard
          {...buildProps({
            playedCount: 2,
            totalCount: 10,
            hasUnplayed: false,
            lockedCount: 5,
            onPress,
          })}
        />
      );

      fireEvent.press(getByText('Career Path'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
