/**
 * Home Screen Offline State Tests
 *
 * Tests the offline UX: first-time offline message, "Playing offline" banner,
 * and auto-retry of anonymous sign-in on reconnection.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Import after all mocks
import HomeScreen from '../../../../app/(tabs)/index';

// ── Controllable mocks ──────────────────────────────────────────────────

let mockIsConnected: boolean | null = true;
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isConnected: mockIsConnected,
    isInternetReachable: mockIsConnected,
  }),
}));

const mockSignInAnonymously = jest.fn().mockResolvedValue({ error: null });
let mockUser: { id: string } | null = { id: 'user-123' };
jest.mock('@/features/auth', () => ({
  useAuth: () => ({
    profile: { is_premium: false },
    user: mockUser,
    signInAnonymously: mockSignInAnonymously,
  }),
}));

let mockCards: {
  puzzleId: string;
  gameMode: string;
  status: string;
  isPremiumOnly?: boolean;
  isAdUnlocked?: boolean;
}[] = [];
let mockPuzzlesLoading = false;

jest.mock('@/features/home', () => {
  const { View, Text } = require('react-native');
  return {
    StreakHeader: ({ completedCount, totalCount }: {
      currentStreak: number;
      completedCount: number;
      totalCount: number;
    }) => (
      <View testID="streak-header">
        <Text>{`${completedCount}/${totalCount}`}</Text>
      </View>
    ),
    DailyStackCard: ({ gameMode, testID }: { gameMode: string; testID: string }) => (
      <View testID={testID}>
        <Text>{gameMode}</Text>
      </View>
    ),
    useUserStats: () => ({
      stats: { currentStreak: 0 },
      isLoading: false,
      refresh: jest.fn(),
    }),
    useDailyPuzzles: () => ({
      cards: mockCards,
      completedCount: 0,
      isLoading: mockPuzzlesLoading,
      refresh: jest.fn(),
    }),
    DailyPuzzleCard: {},
    CompletedGameModal: () => null,
  };
});

jest.mock('@/features/ads', () => ({
  PremiumUpsellBanner: () => null,
  UnlockChoiceModal: () => null,
}));

jest.mock('@/components/ui/Skeletons', () => {
  const { View } = require('react-native');
  return {
    DailyStackCardSkeleton: ({ testID }: { testID: string }) => (
      <View testID={testID} />
    ),
  };
});

jest.mock('@/components/ProBadge', () => ({
  ProBadge: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <View style={style}>{children}</View>
    ),
  };
});

// ── Tests ───────────────────────────────────────────────────────────────

describe('HomeScreen offline states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockUser = { id: 'user-123' };
    mockCards = [];
    mockPuzzlesLoading = false;
  });

  describe('First-time user offline', () => {
    it('shows "No Internet Connection" message when offline with no user and no cards', () => {
      mockIsConnected = false;
      mockUser = null;
      mockCards = [];

      const { getByTestId, getByText } = render(<HomeScreen />);

      expect(getByTestId('first-time-offline')).toBeTruthy();
      expect(getByText('No Internet Connection')).toBeTruthy();
      expect(
        getByText(/Football IQ needs an internet connection for your first launch/)
      ).toBeTruthy();
    });

    it('does NOT show first-time-offline when user exists (returning user offline)', () => {
      mockIsConnected = false;
      mockUser = { id: 'user-123' };
      mockCards = [
        { puzzleId: 'p1', gameMode: 'career_path', status: 'play' },
      ];

      const { queryByTestId } = render(<HomeScreen />);

      expect(queryByTestId('first-time-offline')).toBeNull();
    });

    it('retries signInAnonymously when connectivity returns and user is null', async () => {
      mockIsConnected = false;
      mockUser = null;
      mockCards = [];

      const { rerender } = render(<HomeScreen />);

      expect(mockSignInAnonymously).not.toHaveBeenCalled();

      // Simulate coming back online
      mockIsConnected = true;
      rerender(<HomeScreen />);

      await waitFor(() => {
        expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Returning user offline', () => {
    it('shows "Playing offline" banner when offline with cards available', () => {
      mockIsConnected = false;
      mockUser = { id: 'user-123' };
      mockCards = [
        { puzzleId: 'p1', gameMode: 'career_path', status: 'play' },
        { puzzleId: 'p2', gameMode: 'the_grid', status: 'done' },
      ];

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Playing offline')).toBeTruthy();
    });

    it('renders game cards normally when offline with local data', () => {
      mockIsConnected = false;
      mockUser = { id: 'user-123' };
      mockCards = [
        { puzzleId: 'p1', gameMode: 'career_path', status: 'play' },
      ];

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('daily-card-career_path')).toBeTruthy();
    });
  });

  describe('Online state', () => {
    it('does NOT show offline banner or first-time message when online', () => {
      mockIsConnected = true;
      mockUser = { id: 'user-123' };
      mockCards = [
        { puzzleId: 'p1', gameMode: 'career_path', status: 'play' },
      ];

      const { queryByTestId, queryByText } = render(<HomeScreen />);

      expect(queryByTestId('first-time-offline')).toBeNull();
      expect(queryByText('Playing offline')).toBeNull();
    });
  });
});
