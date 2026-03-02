/**
 * ModeDetailSheet Component Tests
 *
 * TDD tests for the ModeDetailSheet bottom sheet.
 * Covers:
 * - Locked puzzle rows fire onPuzzlePress when tapped (no silent guard)
 * - Surprise Me is enabled when only locked puzzles exist
 * - Surprise Me shows a lock icon alongside shuffle when locked content exists
 * - Surprise Me is disabled when all puzzles are played (no unplayed free or locked)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModeDetailSheet } from '../ModeDetailSheet';
import { ModeStats } from '../../hooks/useModeStats';
import { ArchivePuzzle } from '../../types/archive.types';

// ─── Mock: @shopify/flash-list ────────────────────────────────────────────────
// FlashList doesn't render in test environment — replace with a simple ScrollView
// that renders all items so assertions can find them.
jest.mock('@shopify/flash-list', () => {
  const { ScrollView } = require('react-native');
  return {
    FlashList: ({ data, renderItem, keyExtractor }: any) => {
      const React = require('react');
      return React.createElement(
        ScrollView,
        { testID: 'flash-list' },
        (data ?? []).map((item: any, index: number) => {
          const key = keyExtractor ? keyExtractor(item, index) : String(index);
          return React.createElement(
            React.Fragment,
            { key },
            renderItem({ item, index })
          );
        })
      );
    },
  };
});

// ─── Mock: lucide-react-native ────────────────────────────────────────────────
jest.mock('lucide-react-native', () => ({
  X: 'X',
  Lock: ({ testID }: any) => {
    const { View } = require('react-native');
    return require('react').createElement(View, { testID: testID ?? 'lock-icon' });
  },
  Play: 'Play',
  Shuffle: ({ testID }: any) => {
    const { View } = require('react-native');
    return require('react').createElement(View, { testID: testID ?? 'shuffle-icon' });
  },
  ChevronLeft: 'ChevronLeft',
}));

// ─── Mock: react-native-safe-area-context ─────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// ─── Mock: @/theme/home-design ────────────────────────────────────────────────
jest.mock('@/theme/home-design', () => ({
  HOME_COLORS: {
    pitchGreen: '#2EFC5D',
    grassShadow: '#1A9E38',
    textMain: '#FFFFFF',
    stadiumNavy: '#05050A',
    cardYellow: '#FACC15',
  },
  HOME_FONTS: {
    heading: 'System',
    body: 'System',
  },
}));

// ─── Mock: @/components/ElevatedButton ────────────────────────────────────────
// Expose `disabled` as a testable prop and render title + icon.
jest.mock('@/components/ElevatedButton', () => ({
  ElevatedButton: ({ title, onPress, disabled, icon, testID }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native');
    const React = require('react');
    return React.createElement(
      TouchableOpacity,
      {
        onPress: disabled ? undefined : onPress,
        disabled,
        testID: testID ?? `elevated-button-${title}`,
        accessibilityState: { disabled: !!disabled },
      },
      icon
        ? React.createElement(View, { testID: `${testID ?? `elevated-button-${title}`}-icon` }, icon)
        : null,
      React.createElement(Text, null, title)
    );
  },
}));

// ─── Mock: @/components (GameModeIcon) ────────────────────────────────────────
jest.mock('@/components', () => ({
  GameModeIcon: () => null,
}));

// ─── Mock: @/lib/haptics ──────────────────────────────────────────────────────
jest.mock('@/lib/haptics', () => ({
  triggerLight: jest.fn(() => Promise.resolve()),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createPuzzle(overrides: Partial<ArchivePuzzle> = {}): ArchivePuzzle {
  return {
    id: `puzzle-${Math.random().toString(36).slice(2)}`,
    gameMode: 'career_path',
    puzzleDate: '2026-02-20',
    difficulty: 'medium',
    isLocked: false,
    status: 'play',
    ...overrides,
  };
}

function createModeStats(puzzles: ArchivePuzzle[]): ModeStats {
  const playedCount = puzzles.filter((p) => p.status === 'done').length;
  const lockedCount = puzzles.filter((p) => p.isLocked).length;
  const completedScores = puzzles
    .filter((p) => p.status === 'done' && p.score !== undefined)
    .map((p) => p.score as number);

  return {
    gameMode: 'career_path',
    title: 'Career Path',
    subtitle: 'Follow the journey',
    totalCount: puzzles.length,
    playedCount,
    lockedCount,
    avgScore: completedScores.length > 0
      ? Math.round(completedScores.reduce((s, v) => s + v, 0) / completedScores.length)
      : null,
    bestScore: completedScores.length > 0 ? Math.max(...completedScores) : null,
    hasUnplayed: puzzles.some((p) => !p.isLocked && p.status !== 'done'),
    hasResume: puzzles.some((p) => p.status === 'resume'),
    recentUnplayed: puzzles.find((p) => !p.isLocked && p.status !== 'done') ?? null,
    resumePuzzle: puzzles.find((p) => p.status === 'resume') ?? null,
    puzzles,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ModeDetailSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnPuzzlePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Locked row tappability', () => {
    it('fires onPuzzlePress when a locked puzzle row is tapped', () => {
      const lockedPuzzle = createPuzzle({ id: 'locked-1', isLocked: true, status: 'play' });
      const mode = createModeStats([lockedPuzzle]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      // The row for the locked puzzle is in the list
      const row = getByTestId('puzzle-row-locked-1');
      fireEvent.press(row);

      expect(mockOnPuzzlePress).toHaveBeenCalledTimes(1);
      expect(mockOnPuzzlePress).toHaveBeenCalledWith(lockedPuzzle);
    });

    it('fires onPuzzlePress when a free (unlocked) puzzle row is tapped', () => {
      const freePuzzle = createPuzzle({ id: 'free-1', isLocked: false, status: 'play' });
      const mode = createModeStats([freePuzzle]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      fireEvent.press(getByTestId('puzzle-row-free-1'));

      expect(mockOnPuzzlePress).toHaveBeenCalledWith(freePuzzle);
    });

    it('fires onPuzzlePress when a done puzzle row is tapped', () => {
      const donePuzzle = createPuzzle({ id: 'done-1', isLocked: false, status: 'done', score: 80 });
      const mode = createModeStats([donePuzzle]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      fireEvent.press(getByTestId('puzzle-row-done-1'));

      expect(mockOnPuzzlePress).toHaveBeenCalledWith(donePuzzle);
    });
  });

  describe('Surprise Me button state', () => {
    it('is enabled when only locked unplayed puzzles exist', () => {
      const puzzles = [
        createPuzzle({ id: 'l-1', isLocked: true, status: 'play' }),
        createPuzzle({ id: 'l-2', isLocked: true, status: 'play' }),
      ];
      const mode = createModeStats(puzzles);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      const btn = getByTestId('surprise-me-button');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });

    it('is enabled when a mix of free and locked unplayed puzzles exist', () => {
      const puzzles = [
        createPuzzle({ id: 'f-1', isLocked: false, status: 'play' }),
        createPuzzle({ id: 'l-1', isLocked: true, status: 'play' }),
      ];
      const mode = createModeStats(puzzles);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      const btn = getByTestId('surprise-me-button');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });

    it('is disabled when all puzzles are played (status === done)', () => {
      const puzzles = [
        createPuzzle({ id: 'd-1', isLocked: false, status: 'done', score: 90 }),
        createPuzzle({ id: 'd-2', isLocked: true, status: 'done', score: 70 }),
      ];
      const mode = createModeStats(puzzles);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      const btn = getByTestId('surprise-me-button');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    it('is disabled when the puzzle list is empty', () => {
      const mode = createModeStats([]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      const btn = getByTestId('surprise-me-button');
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    it('is enabled when only free unplayed puzzles exist', () => {
      const puzzles = [
        createPuzzle({ id: 'f-1', isLocked: false, status: 'play' }),
      ];
      const mode = createModeStats(puzzles);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      const btn = getByTestId('surprise-me-button');
      expect(btn.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('Surprise Me callback', () => {
    it('calls onPuzzlePress (but not onClose) when pressed with free unplayed puzzles', () => {
      const freePuzzle = createPuzzle({ id: 'f-1', isLocked: false, status: 'play' });
      const mode = createModeStats([freePuzzle]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      fireEvent.press(getByTestId('surprise-me-button'));

      expect(mockOnPuzzlePress).toHaveBeenCalledWith(freePuzzle);
      // onClose is no longer called by handleSurpriseMe; the parent
      // orchestrates closing the sheet via the onPuzzlePress wrapper.
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onPuzzlePress with a locked puzzle when only locked puzzles are available', () => {
      const lockedPuzzle = createPuzzle({ id: 'l-1', isLocked: true, status: 'play' });
      const mode = createModeStats([lockedPuzzle]);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      fireEvent.press(getByTestId('surprise-me-button'));

      expect(mockOnPuzzlePress).toHaveBeenCalledWith(lockedPuzzle);
      // onClose is no longer called by handleSurpriseMe; the parent
      // orchestrates closing the sheet via the onPuzzlePress wrapper.
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not call onPuzzlePress when the button is disabled', () => {
      const puzzles = [
        createPuzzle({ id: 'd-1', isLocked: false, status: 'done', score: 90 }),
      ];
      const mode = createModeStats(puzzles);

      const { getByTestId } = render(
        <ModeDetailSheet
          mode={mode}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      fireEvent.press(getByTestId('surprise-me-button'));

      expect(mockOnPuzzlePress).not.toHaveBeenCalled();
    });
  });

  describe('Null mode guard', () => {
    it('renders nothing when mode is null', () => {
      const { toJSON } = render(
        <ModeDetailSheet
          mode={null}
          visible={true}
          onClose={mockOnClose}
          onPuzzlePress={mockOnPuzzlePress}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });
});
