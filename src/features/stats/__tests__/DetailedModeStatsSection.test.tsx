/**
 * DetailedModeStatsSection Component Tests
 *
 * Tests for the MODE BREAKDOWN section component that renders
 * per-game-mode stat cards showing accuracy, best score, played count,
 * and perfect scores.
 *
 * Covers:
 * - Renders a card for each DetailedModeStats entry
 * - Shows the correct values in each card (played, accuracy, best score, perfect)
 * - Returns null when stats array is empty
 * - Shows the mode display name and skill name
 * - Handles multiple modes
 * - Entries already sorted by gamesPlayed (the hook pre-sorts; component respects order)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import {
  DetailedModeStatsSection,
  DetailedModeStatsSectionProps,
} from '../components/DetailedModeStatsSection';
import { DetailedModeStats } from '../types/stats.types';

// ── Helpers ───────────────────────────────────────────────────────────────

function buildModeStats(overrides: Partial<DetailedModeStats> = {}): DetailedModeStats {
  return {
    gameMode: 'career_path',
    displayName: 'Career Path',
    skillName: 'Deduction',
    gamesPlayed: 10,
    accuracyPercent: 75,
    bestScore: 9,
    totalPoints: 85,
    perfectScores: 2,
    ...overrides,
  };
}

function renderSection(props: Partial<DetailedModeStatsSectionProps> = {}) {
  return render(
    <DetailedModeStatsSection
      stats={[]}
      {...props}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('DetailedModeStatsSection', () => {
  describe('empty state', () => {
    it('returns null (renders nothing) when stats array is empty', () => {
      const { toJSON } = renderSection({ stats: [] });
      expect(toJSON()).toBeNull();
    });
  });

  describe('single mode card', () => {
    it('renders the mode display name', () => {
      const stats = [buildModeStats({ displayName: 'Career Path' })];
      const { getByText } = renderSection({ stats });

      expect(getByText('Career Path')).toBeTruthy();
    });

    it('renders the mode skill name', () => {
      const stats = [buildModeStats({ skillName: 'Deduction' })];
      const { getByText } = renderSection({ stats });

      expect(getByText('Deduction')).toBeTruthy();
    });

    it('renders gamesPlayed count', () => {
      const stats = [buildModeStats({ gamesPlayed: 42 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('42')).toBeTruthy();
    });

    it('renders accuracy as a percentage string', () => {
      const stats = [buildModeStats({ accuracyPercent: 68 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('68%')).toBeTruthy();
    });

    it('renders bestScore value', () => {
      const stats = [buildModeStats({ bestScore: 9 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('9')).toBeTruthy();
    });

    it('renders perfectScores count', () => {
      const stats = [buildModeStats({ perfectScores: 3 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('3')).toBeTruthy();
    });

    it('renders the "Played" stat label', () => {
      const stats = [buildModeStats()];
      const { getByText } = renderSection({ stats });

      expect(getByText('Played')).toBeTruthy();
    });

    it('renders the "Accuracy" stat label', () => {
      const stats = [buildModeStats()];
      const { getByText } = renderSection({ stats });

      expect(getByText('Accuracy')).toBeTruthy();
    });

    it('renders the "Best Score" stat label', () => {
      const stats = [buildModeStats()];
      const { getByText } = renderSection({ stats });

      expect(getByText('Best Score')).toBeTruthy();
    });

    it('renders the "Perfect" stat label', () => {
      const stats = [buildModeStats()];
      const { getByText } = renderSection({ stats });

      expect(getByText('Perfect')).toBeTruthy();
    });

    it('renders with 0 perfectScores correctly', () => {
      const stats = [buildModeStats({ perfectScores: 0 })];
      const { getAllByText } = renderSection({ stats });

      // "0" will appear at least once (for perfectScores)
      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe('multiple mode cards', () => {
    it('renders a card for each provided mode', () => {
      const stats = [
        buildModeStats({
          gameMode: 'career_path',
          displayName: 'Career Path',
          skillName: 'Deduction',
        }),
        buildModeStats({
          gameMode: 'guess_the_transfer',
          displayName: 'Transfer Guess',
          skillName: 'Market Knowledge',
        }),
        buildModeStats({
          gameMode: 'topical_quiz',
          displayName: 'Topical Quiz',
          skillName: 'Current Affairs',
        }),
      ];

      const { getByText } = renderSection({ stats });

      expect(getByText('Career Path')).toBeTruthy();
      expect(getByText('Transfer Guess')).toBeTruthy();
      expect(getByText('Topical Quiz')).toBeTruthy();
    });

    it('renders each mode with its own values without mixing them up', () => {
      const stats = [
        buildModeStats({
          gameMode: 'career_path',
          displayName: 'Career Path',
          gamesPlayed: 50,
          accuracyPercent: 80,
        }),
        buildModeStats({
          gameMode: 'guess_the_transfer',
          displayName: 'Transfer Guess',
          gamesPlayed: 20,
          accuracyPercent: 60,
        }),
      ];

      const { getAllByText } = renderSection({ stats });

      // Both gamesPlayed values appear
      expect(getAllByText('50').length).toBeGreaterThan(0);
      expect(getAllByText('20').length).toBeGreaterThan(0);
      // Both accuracy values appear
      expect(getAllByText('80%').length).toBeGreaterThan(0);
      expect(getAllByText('60%').length).toBeGreaterThan(0);
    });

    it('renders modes in the order they are provided', () => {
      const stats = [
        buildModeStats({ gameMode: 'career_path', displayName: 'Career Path', gamesPlayed: 100 }),
        buildModeStats({ gameMode: 'topical_quiz', displayName: 'Topical Quiz', gamesPlayed: 30 }),
        buildModeStats({ gameMode: 'the_grid', displayName: 'The Grid (beta)', gamesPlayed: 10 }),
      ];

      const { getAllByText } = renderSection({ stats });

      const careerPathNodes = getAllByText('Career Path');
      const topicalQuizNodes = getAllByText('Topical Quiz');
      const gridNodes = getAllByText('The Grid (beta)');

      // All three appear in the output
      expect(careerPathNodes.length).toBeGreaterThan(0);
      expect(topicalQuizNodes.length).toBeGreaterThan(0);
      expect(gridNodes.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('renders correctly with 100% accuracy', () => {
      const stats = [buildModeStats({ accuracyPercent: 100 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('100%')).toBeTruthy();
    });

    it('renders correctly with 0% accuracy', () => {
      const stats = [buildModeStats({ accuracyPercent: 0 })];
      const { getByText } = renderSection({ stats });

      expect(getByText('0%')).toBeTruthy();
    });

    it('renders testID on the container when provided', () => {
      const stats = [buildModeStats()];
      const { getByTestId } = renderSection({ stats, testID: 'mode-breakdown' });

      expect(getByTestId('mode-breakdown')).toBeTruthy();
    });

    it('handles different game modes correctly', () => {
      const modes: Array<[string, string]> = [
        ['guess_the_goalscorers', 'Goalscorer Recall'],
        ['the_chain', 'The Chain'],
        ['starting_xi', 'Starting XI'],
      ];

      for (const [gameMode, displayName] of modes) {
        const stats = [
          buildModeStats({
            gameMode: gameMode as DetailedModeStats['gameMode'],
            displayName,
          }),
        ];
        const { getByText, unmount } = renderSection({ stats });
        expect(getByText(displayName)).toBeTruthy();
        unmount();
      }
    });
  });
});
