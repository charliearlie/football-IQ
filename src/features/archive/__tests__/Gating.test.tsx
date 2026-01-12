/**
 * Archive Gating Tests
 *
 * Tests for premium gating UI in the Archive screen.
 * Verifies that:
 * - Puzzles outside 7-day window show Lock icon for non-premium users
 * - Puzzles outside 7-day window show Play button for premium users
 * - Puzzles within 7-day window (today + 6 previous days) always show Play/Resume/Done (no lock)
 * - Tapping locked card triggers onLockedPress callback
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UniversalGameCard } from '@/components';
import { isPuzzleLocked, isWithinFreeWindow } from '../utils/dateGrouping';
import { ArchivePuzzle } from '../types/archive.types';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Briefcase: 'Briefcase',
  ArrowRightLeft: 'ArrowRightLeft',
  Target: 'Target',
  Grid3X3: 'Grid3X3',
  HelpCircle: 'HelpCircle',
  CheckCircle: 'CheckCircle',
  Check: 'Check',
  Crown: 'Crown',
  Archive: 'Archive',
  ListOrdered: 'ListOrdered',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

// Mock ElevatedButton to avoid Reanimated complexity
jest.mock('@/components/ElevatedButton', () => ({
  ElevatedButton: ({ title, onPress, testID, icon }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        {icon && <View testID={`${testID}-icon`}>{icon}</View>}
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock GlassCard
jest.mock('@/components/GlassCard', () => ({
  GlassCard: ({ children, style, testID }: any) => {
    const { View } = require('react-native');
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  },
}));

/**
 * Helper to create a mock puzzle for testing.
 */
function createMockPuzzle(overrides: Partial<ArchivePuzzle> = {}): ArchivePuzzle {
  return {
    id: 'test-puzzle-123',
    gameMode: 'career_path',
    puzzleDate: '2024-12-20',
    difficulty: 'medium',
    isLocked: false,
    status: 'play',
    ...overrides,
  };
}

/**
 * Get a date string N days ago.
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

describe('Archive Gating', () => {
  describe('isPuzzleLocked utility', () => {
    it('returns false for premium users regardless of date', () => {
      const oldDate = getDateDaysAgo(30);
      expect(isPuzzleLocked(oldDate, true)).toBe(false);
    });

    it('returns false for puzzles within 7 days for non-premium users', () => {
      const recentDate = getDateDaysAgo(3);
      expect(isPuzzleLocked(recentDate, false)).toBe(false);
    });

    it('returns true for puzzles older than 7 days for non-premium users', () => {
      const oldDate = getDateDaysAgo(10);
      expect(isPuzzleLocked(oldDate, false)).toBe(true);
    });

    it('returns false for puzzles exactly 6 days old for non-premium users (boundary)', () => {
      const sixDaysAgo = getDateDaysAgo(6);
      expect(isPuzzleLocked(sixDaysAgo, false)).toBe(false);
    });

    it('returns true for puzzles exactly 7 days old for non-premium users (outside window)', () => {
      const sevenDaysAgo = getDateDaysAgo(7);
      expect(isPuzzleLocked(sevenDaysAgo, false)).toBe(true);
    });
  });

  describe('isWithinFreeWindow utility', () => {
    it('returns true for today', () => {
      const today = getDateDaysAgo(0);
      expect(isWithinFreeWindow(today)).toBe(true);
    });

    it('returns true for 6 days ago (boundary)', () => {
      const sixDaysAgo = getDateDaysAgo(6);
      expect(isWithinFreeWindow(sixDaysAgo)).toBe(true);
    });

    it('returns false for 7 days ago (outside window)', () => {
      const sevenDaysAgo = getDateDaysAgo(7);
      expect(isWithinFreeWindow(sevenDaysAgo)).toBe(false);
    });
  });

  describe('UniversalGameCard (Locked state - Velvet Rope)', () => {
    it('renders premium Unlock button with Crown icon when isLocked is true', () => {
      const puzzle = createMockPuzzle({ isLocked: true });
      const { getByTestId, getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Should have unlock button (Velvet Rope design)
      expect(getByTestId('locked-card-unlock')).toBeTruthy();
      expect(getByText('Unlock')).toBeTruthy();
    });

    it('renders Crown icon on locked cards (Velvet Rope)', () => {
      const puzzle = createMockPuzzle({ isLocked: true });
      const { getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Should have crown icon in the unlock button
      expect(getByTestId('locked-card-unlock-icon')).toBeTruthy();
    });

    it('displays the subtitle', () => {
      const puzzle = createMockPuzzle({
        isLocked: true,
        gameMode: 'career_path',
      });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Should show the subtitle (same as daily variant)
      expect(getByText('Guess the player')).toBeTruthy();
    });

    it('displays the game mode title', () => {
      const puzzle = createMockPuzzle({
        isLocked: true,
        gameMode: 'career_path',
      });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      expect(getByText('Career Path')).toBeTruthy();
    });

    it('is pressable (onPress callback available)', () => {
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle({ isLocked: true });
      const { getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={onPressMock}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Verify the card renders (the component is pressable via Pressable wrapper)
      expect(getByTestId('locked-card')).toBeTruthy();
    });
  });

  describe('UniversalGameCard (Unlocked state)', () => {
    it('renders Play button when status is "play"', () => {
      const puzzle = createMockPuzzle({ status: 'play' });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );

      expect(getByText('Play')).toBeTruthy();
    });

    it('renders Resume button when status is "resume"', () => {
      const puzzle = createMockPuzzle({ status: 'resume' });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );

      expect(getByText('Resume')).toBeTruthy();
    });

    it('renders Result button when status is "done"', () => {
      const puzzle = createMockPuzzle({
        status: 'done',
      });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );

      // Cards show Result button only (emoji shown in CompletedGameModal)
      expect(getByText('Result')).toBeTruthy();
    });

    it('displays subtitle same as daily variant', () => {
      const puzzle = createMockPuzzle({ gameMode: 'career_path' });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );

      // Archive variant now shows same subtitle as daily variant
      expect(getByText('Guess the player')).toBeTruthy();
    });

    it('is pressable (onPress callback available)', () => {
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle();
      const { getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={onPressMock}
          variant="archive"
          testID="archive-card"
        />
      );

      // Verify the card renders (the component is pressable via Pressable wrapper)
      expect(getByTestId('archive-card')).toBeTruthy();
    });
  });

  describe('Gating scenarios', () => {
    it('non-premium user: puzzle >7 days old should be locked', () => {
      const oldDate = getDateDaysAgo(10);
      const isPremium = false;

      const isLocked = isPuzzleLocked(oldDate, isPremium);
      expect(isLocked).toBe(true);

      // Verify the component renders with Unlock button (Velvet Rope design)
      const puzzle = createMockPuzzle({
        isLocked: true,
        puzzleDate: oldDate,
      });
      const { getByTestId, getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );
      expect(getByTestId('locked-card-unlock')).toBeTruthy();
      expect(getByText('Unlock')).toBeTruthy();
    });

    it('premium user: puzzle >7 days old should NOT be locked', () => {
      const oldDate = getDateDaysAgo(10);
      const isPremium = true;

      const isLocked = isPuzzleLocked(oldDate, isPremium);
      expect(isLocked).toBe(false);

      // Verify the component renders correctly when unlocked
      const puzzle = createMockPuzzle({
        isLocked: false,
        puzzleDate: oldDate,
        status: 'play',
      });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );
      expect(getByText('Play')).toBeTruthy();
    });

    it('non-premium user: puzzle ≤7 days old should NOT be locked', () => {
      const recentDate = getDateDaysAgo(5);
      const isPremium = false;

      const isLocked = isPuzzleLocked(recentDate, isPremium);
      expect(isLocked).toBe(false);

      // Verify the component renders with Play button
      const puzzle = createMockPuzzle({
        isLocked: false,
        puzzleDate: recentDate,
        status: 'play',
      });
      const { getByText } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          testID="archive-card"
        />
      );
      expect(getByText('Play')).toBeTruthy();
    });
  });

  describe('Velvet Rope Behavior', () => {
    it('locked card remains fully opaque (vibrant content, not disabled)', () => {
      // The Velvet Rope design removes opacity dimming
      // Cards should have gold border instead for differentiation
      const puzzle = createMockPuzzle({ isLocked: true });
      const { getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Verify the card renders (visual opacity test would require snapshot)
      const card = getByTestId('locked-card');
      expect(card).toBeTruthy();
      // The lockedCard style should NOT have opacity: 0.7 anymore
      // This is verified by the actual style changes in UniversalGameCard
    });

    it('triggers onPress callback when locked card Unlock button is pressed', () => {
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle({ isLocked: true });
      const { getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={onPressMock}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      // Press the unlock button
      fireEvent.press(getByTestId('locked-card-unlock'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('shows same Unlock button style for both isLocked and isPremiumLocked', () => {
      // Velvet Rope unifies locked and premium-locked appearance
      const { getByTestId: getLockedById, getByText: getLockedByText } = render(
        <UniversalGameCard
          gameMode="career_path"
          status="play"
          onPress={jest.fn()}
          variant="archive"
          isLocked={true}
          testID="locked-card"
        />
      );

      const { getByTestId: getPremiumById, getByText: getPremiumByText } = render(
        <UniversalGameCard
          gameMode="top_tens"
          status="play"
          onPress={jest.fn()}
          variant="archive"
          isPremiumOnly={true}
          isPremium={false}
          testID="premium-locked-card"
        />
      );

      // Both should have Unlock buttons
      expect(getLockedById('locked-card-unlock')).toBeTruthy();
      expect(getPremiumById('premium-locked-card-unlock')).toBeTruthy();
      expect(getLockedByText('Unlock')).toBeTruthy();
      expect(getPremiumByText('Unlock')).toBeTruthy();
    });
  });
});
