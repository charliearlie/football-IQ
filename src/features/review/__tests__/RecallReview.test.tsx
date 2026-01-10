import React from 'react';
import { render } from '@testing-library/react-native';
import { RecallComparisonView } from '@/features/goalscorer-recall/components/RecallComparisonView';
import { Goal } from '@/features/goalscorer-recall/types/goalscorerRecall.types';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('Goalscorer Recall Review - Found vs Missed', () => {
  const mockGoals: Goal[] = [
    { scorer: 'Salah', minute: 10, team: 'home' },
    { scorer: 'De Bruyne', minute: 25, team: 'away' },
    { scorer: 'Haaland', minute: 45, team: 'away' },
    { scorer: 'Kane', minute: 50, team: 'home' },
    { scorer: 'Saka', minute: 55, team: 'home' },
    { scorer: 'Foden', minute: 60, team: 'away' },
    { scorer: 'Martinelli', minute: 70, team: 'home' },
    { scorer: 'Silva', minute: 75, team: 'away' },
    { scorer: 'Odegaard', minute: 80, team: 'home' },
    { scorer: 'Walker', minute: 85, team: 'away' },
  ];

  it('renders correct FOUND and MISSED counts when 3/10 found', () => {
    // Normalized names (as stored in metadata)
    const foundNames = ['salah', 'de bruyne', 'kane'];
    const { getByText } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={foundNames}
        testID="comparison"
      />
    );

    expect(getByText(/FOUND \(3\)/)).toBeTruthy();
    expect(getByText(/MISSED \(7\)/)).toBeTruthy();
  });

  it('renders 7 items with missed styling for unfound players', () => {
    const foundNames = ['salah', 'de bruyne', 'kane'];
    const { queryAllByTestId } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={foundNames}
        testID="comparison"
      />
    );

    const missedRows = queryAllByTestId(/scorer-row-missed/);
    expect(missedRows.length).toBe(7);
  });

  it('renders 3 items with found styling when 3 players found', () => {
    const foundNames = ['salah', 'de bruyne', 'kane'];
    const { queryAllByTestId } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={foundNames}
        testID="comparison"
      />
    );

    const foundRows = queryAllByTestId(/scorer-row-found/);
    expect(foundRows.length).toBe(3);
  });

  it('separates own goals into their own section', () => {
    const goalsWithOG: Goal[] = [
      ...mockGoals,
      { scorer: 'Defender', minute: 88, team: 'home', isOwnGoal: true },
    ];
    const { getByText } = render(
      <RecallComparisonView
        goals={goalsWithOG}
        foundScorerNames={['salah']}
        testID="comparison"
      />
    );

    expect(getByText('OWN GOALS')).toBeTruthy();
  });

  it('shows empty state when no players found', () => {
    const { getByText } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={[]}
        testID="comparison"
      />
    );

    expect(getByText('No scorers found')).toBeTruthy();
  });

  it('shows "None missed!" when all found', () => {
    // All names normalized (as stored in metadata)
    const allNames = mockGoals.map((g) => g.scorer.toLowerCase());
    const { getByText } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={allNames}
        testID="comparison"
      />
    );

    expect(getByText('None missed!')).toBeTruthy();
  });

  it('matches normalized names correctly (handles accents/case)', () => {
    const goalsWithAccents: Goal[] = [
      { scorer: 'Özil', minute: 10, team: 'home' },
      { scorer: 'Sørloth', minute: 25, team: 'away' },
    ];
    // Stored names are normalized (lowercase, no accents)
    const foundNames = ['ozil'];

    const { getByText } = render(
      <RecallComparisonView
        goals={goalsWithAccents}
        foundScorerNames={foundNames}
        testID="comparison"
      />
    );

    // Özil should be found (normalized match), Sørloth missed
    expect(getByText(/FOUND \(1\)/)).toBeTruthy();
    expect(getByText(/MISSED \(1\)/)).toBeTruthy();
  });

  it('does not show OWN GOALS section when no own goals exist', () => {
    const { queryByText } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={['salah']}
        testID="comparison"
      />
    );

    expect(queryByText('OWN GOALS')).toBeNull();
  });

  it('displays player name and minute for each scorer', () => {
    const foundNames = ['salah'];
    const { getByText } = render(
      <RecallComparisonView
        goals={mockGoals}
        foundScorerNames={foundNames}
        testID="comparison"
      />
    );

    // Check Salah is displayed with minute
    expect(getByText('Salah')).toBeTruthy();
    expect(getByText("10'")).toBeTruthy();
  });
});
