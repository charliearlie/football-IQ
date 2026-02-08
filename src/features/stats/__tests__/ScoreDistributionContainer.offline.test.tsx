/**
 * ScoreDistributionContainer Offline Tests
 *
 * Tests that the distribution graph handles offline state gracefully:
 * shows a placeholder message instead of silently returning null.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ── Controllable mocks ──────────────────────────────────────────────────

let mockIsConnected: boolean | null = true;
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isConnected: mockIsConnected,
    isInternetReachable: mockIsConnected,
  }),
}));

let mockDistribution: Array<{ score: number; count: number; percentage: number }> = [];
let mockTotalAttempts = 0;
let mockIsLoading = false;
let mockError: Error | null = null;

jest.mock('../hooks/useScoreDistribution', () => ({
  useScoreDistribution: () => ({
    distribution: mockDistribution,
    totalAttempts: mockTotalAttempts,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: jest.fn(),
  }),
}));

jest.mock('../components/ScoreDistributionGraph', () => {
  const { View } = require('react-native');
  return {
    ScoreDistributionGraph: (props: { testID?: string }) => (
      <View testID={props.testID ?? 'score-distribution-graph'} />
    ),
  };
});

jest.mock('../components/ScoreDistributionSkeleton', () => {
  const { View } = require('react-native');
  return {
    ScoreDistributionSkeleton: (props: { testID?: string }) => (
      <View testID={props.testID ?? 'score-distribution-skeleton'} />
    ),
  };
});

import { ScoreDistributionContainer } from '../components/ScoreDistributionContainer';

// ── Tests ───────────────────────────────────────────────────────────────

describe('ScoreDistributionContainer offline behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockDistribution = [];
    mockTotalAttempts = 0;
    mockIsLoading = false;
    mockError = null;
  });

  it('renders offline placeholder immediately when offline (no skeleton wait)', () => {
    mockIsConnected = false;
    mockIsLoading = true; // would normally show skeleton

    const { getByTestId, queryByTestId } = render(
      <ScoreDistributionContainer
        puzzleId="puzzle-1"
        gameMode="career_path"
        userScore={50}
        testID="dist"
      />
    );

    expect(getByTestId('dist-offline')).toBeTruthy();
    // Should NOT show skeleton even though isLoading is true
    expect(queryByTestId('dist-skeleton')).toBeNull();
  });

  it('renders offline placeholder when fetch errors (online but failed)', () => {
    mockIsConnected = true;
    mockError = new Error('Network error');

    const { getByTestId } = render(
      <ScoreDistributionContainer
        puzzleId="puzzle-1"
        gameMode="top_tens"
        userScore={70}
        testID="dist"
      />
    );

    expect(getByTestId('dist-offline')).toBeTruthy();
  });

  it('renders skeleton when online and loading', () => {
    mockIsConnected = true;
    mockIsLoading = true;

    const { getByTestId, queryByTestId } = render(
      <ScoreDistributionContainer
        puzzleId="puzzle-1"
        gameMode="top_tens"
        userScore={70}
        testID="dist"
      />
    );

    expect(getByTestId('dist-skeleton')).toBeTruthy();
    expect(queryByTestId('dist-offline')).toBeNull();
  });

  it('renders graph when online with data', () => {
    mockIsConnected = true;
    mockDistribution = [
      { score: 50, count: 5, percentage: 50 },
      { score: 70, count: 3, percentage: 30 },
    ];
    mockTotalAttempts = 10;

    const { getByTestId, queryByTestId } = render(
      <ScoreDistributionContainer
        puzzleId="puzzle-1"
        gameMode="top_tens"
        userScore={70}
        testID="dist"
      />
    );

    expect(getByTestId('dist')).toBeTruthy();
    expect(queryByTestId('dist-offline')).toBeNull();
    expect(queryByTestId('dist-skeleton')).toBeNull();
  });
});
