/**
 * Profile UI Tests
 *
 * Tests for the My IQ profile screen components.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TrophyRoom } from '@/features/stats/components/TrophyRoom';
import { IQScoreDisplay } from '@/features/stats/components/IQScoreDisplay';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import { Badge } from '@/features/stats/types/stats.types';

describe('TrophyRoom', () => {
  it('displays "7-Day Streak" badge as earned when streak >= 7', () => {
    const badges: Badge[] = [
      {
        id: 'streak_7',
        name: '7-Day Streak',
        description: 'Played 7 days in a row',
        icon: 'Flame',
        earnedAt: '2025-01-15T12:00:00Z', // Earned
      },
      {
        id: 'games_10',
        name: 'Getting Started',
        description: 'Completed 10 puzzles',
        icon: 'Award',
        earnedAt: null, // Not earned
      },
    ];

    render(<TrophyRoom badges={badges} />);

    // Badge name should be visible
    expect(screen.getByText('7-Day Streak')).toBeTruthy();
    // Earned count should show 1/2
    expect(screen.getByText('1/2')).toBeTruthy();
  });

  it('displays "7-Day Streak" badge as unearned when streak < 7', () => {
    const badges: Badge[] = [
      {
        id: 'streak_7',
        name: '7-Day Streak',
        description: 'Played 7 days in a row',
        icon: 'Flame',
        earnedAt: null, // Not earned
      },
    ];

    render(<TrophyRoom badges={badges} />);

    // Badge name should still be visible (even unearned)
    expect(screen.getByText('7-Day Streak')).toBeTruthy();
    // Earned count should show 0/1
    expect(screen.getByText('0/1')).toBeTruthy();
  });

  it('shows correct count of earned badges', () => {
    const badges: Badge[] = [
      { id: 'streak_7', name: '7-Day Streak', description: '', icon: 'Flame', earnedAt: '2025-01-15T12:00:00Z' },
      { id: 'perfect_career', name: 'Detective', description: '', icon: 'Search', earnedAt: '2025-01-14T12:00:00Z' },
      { id: 'games_10', name: 'Getting Started', description: '', icon: 'Award', earnedAt: null },
      { id: 'games_50', name: 'Dedicated Fan', description: '', icon: 'Trophy', earnedAt: null },
    ];

    render(<TrophyRoom badges={badges} />);

    // 2 out of 4 earned
    expect(screen.getByText('2/4')).toBeTruthy();
  });
});

describe('IQScoreDisplay', () => {
  it('displays the global IQ score', () => {
    render(<IQScoreDisplay score={75} />);

    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('FOOTBALL IQ')).toBeTruthy();
  });

  it('shows Elite tier for score >= 90', () => {
    render(<IQScoreDisplay score={95} />);

    expect(screen.getByText('Elite')).toBeTruthy();
  });

  it('shows Expert tier for score >= 70', () => {
    render(<IQScoreDisplay score={75} />);

    expect(screen.getByText('Expert')).toBeTruthy();
  });

  it('shows Intermediate tier for score >= 50', () => {
    render(<IQScoreDisplay score={55} />);

    expect(screen.getByText('Intermediate')).toBeTruthy();
  });

  it('shows Apprentice tier for score >= 30', () => {
    render(<IQScoreDisplay score={35} />);

    expect(screen.getByText('Apprentice')).toBeTruthy();
  });

  it('shows Rookie tier for score < 30', () => {
    render(<IQScoreDisplay score={15} />);

    expect(screen.getByText('Rookie')).toBeTruthy();
  });
});

describe('StatsGrid', () => {
  it('displays all stats correctly', () => {
    render(
      <StatsGrid
        puzzlesSolved={42}
        perfectScores={7}
        totalPoints={1250}
        currentStreak={5}
      />
    );

    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('1,250')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();

    expect(screen.getByText('Puzzles Solved')).toBeTruthy();
    expect(screen.getByText('Perfect Scores')).toBeTruthy();
    expect(screen.getByText('Total Points')).toBeTruthy();
    expect(screen.getByText('Current Streak')).toBeTruthy();
  });
});
