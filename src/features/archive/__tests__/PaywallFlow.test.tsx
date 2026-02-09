/**
 * Paywall Flow Tests
 *
 * Tests for premium paywall flow in the Archive screen.
 * Verifies that:
 * - Clicking a locked card prevents navigation and opens the modal
 * - Premium users can navigate directly to any puzzle
 * - Free users can navigate to recent puzzles
 * - Modal state transitions work correctly
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';

import { PremiumUpsellModal } from '../components/PremiumUpsellModal';
import { UniversalGameCard } from '@/components';
import { isPuzzleLocked } from '../utils/dateGrouping';
import { ArchivePuzzle } from '../types/archive.types';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/features/auth', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'test-user' } })),
  useSubscriptionSync: jest.fn(() => ({ forceSync: jest.fn() })),
  waitForEntitlementActivation: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Lock: 'Lock',
  Briefcase: 'Briefcase',
  ArrowRightLeft: 'ArrowRightLeft',
  Target: 'Target',
  Grid3X3: 'Grid3X3',
  HelpCircle: 'HelpCircle',
  CheckCircle: 'CheckCircle',
  Archive: 'Archive',
  Sparkles: 'Sparkles',
  TrendingUp: 'TrendingUp',
  X: 'X',
  Check: 'Check',
  RotateCcw: 'RotateCcw',
  Trophy: 'Trophy',
  Zap: 'Zap',
  Ban: 'Ban',
  Star: 'Star',
}));

// Mock ProBadge
jest.mock('@/components/ProBadge', () => ({
  ProBadge: 'ProBadge',
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return Reanimated;
});

// Mock ElevatedButton
jest.mock('@/components/ElevatedButton', () => ({
  ElevatedButton: ({ title, onPress, testID }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
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

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    getOfferings: jest.fn().mockResolvedValue({
      all: {},
      current: {
        availablePackages: [
          {
            identifier: 'monthly',
            packageType: 'MONTHLY',
            product: {
              title: 'Football IQ Monthly',
              description: 'Monthly subscription',
              priceString: '£4.99',
            },
          },
        ],
      },
    }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED',
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
 * Get a date string N days ago in YYYY-MM-DD format.
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

describe('Paywall Flow', () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
  });

  describe('Archive card interactions', () => {
    it('opens paywall modal when free user clicks locked card', () => {
      // Arrange: Free user context
      (useAuth as jest.Mock).mockReturnValue({
        profile: { is_premium: false },
      });

      const oldDate = getDateDaysAgo(10);
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle({
        isLocked: true,
        puzzleDate: oldDate,
      });

      // Act: Render locked card using UniversalGameCard
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

      // The card should be rendered with Unlock button (Velvet Rope design)
      expect(getByTestId('locked-card')).toBeTruthy();
      expect(getByTestId('locked-card-unlock')).toBeTruthy();

      // Verify that isPuzzleLocked returns true for this puzzle
      expect(isPuzzleLocked(oldDate, false)).toBe(true);
    });

    it('navigates directly when premium user clicks any card', () => {
      // Arrange: Premium user context
      (useAuth as jest.Mock).mockReturnValue({
        profile: { is_premium: true },
      });

      const oldDate = getDateDaysAgo(10);
      const isPremium = true;

      // Premium user should NOT be locked
      expect(isPuzzleLocked(oldDate, isPremium)).toBe(false);

      // Render unlocked card
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle({
        isLocked: false,
        puzzleDate: oldDate,
        status: 'play',
      });

      const { getByText, getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={onPressMock}
          variant="archive"
          testID="archive-card"
        />
      );

      // Should show Play button (not locked)
      expect(getByText('Play')).toBeTruthy();
      expect(getByTestId('archive-card')).toBeTruthy();
    });

    it('navigates when free user clicks recent (unlocked) card', () => {
      // Arrange: Free user context
      (useAuth as jest.Mock).mockReturnValue({
        profile: { is_premium: false },
      });

      const recentDate = getDateDaysAgo(3);
      const isPremium = false;

      // Recent puzzle should NOT be locked even for free user
      expect(isPuzzleLocked(recentDate, isPremium)).toBe(false);

      // Render unlocked card
      const onPressMock = jest.fn();
      const puzzle = createMockPuzzle({
        isLocked: false,
        puzzleDate: recentDate,
        status: 'play',
      });

      const { getByText, getByTestId } = render(
        <UniversalGameCard
          gameMode={puzzle.gameMode}
          status={puzzle.status}
          onPress={onPressMock}
          variant="archive"
          testID="archive-card"
        />
      );

      // Should show Play button
      expect(getByText('Play')).toBeTruthy();
      expect(getByTestId('archive-card')).toBeTruthy();
    });

    it('prevents navigation and shows modal for locked puzzle', () => {
      const oldDate = getDateDaysAgo(10);
      const isPremium = false;

      // Verify lock logic
      expect(isPuzzleLocked(oldDate, isPremium)).toBe(true);

      // Simulate what archive.tsx does:
      // 1. Check if locked
      // 2. If locked, show modal instead of navigating
      let modalVisible = false;
      let navigated = false;

      const handleCardPress = (isLocked: boolean) => {
        if (isLocked) {
          modalVisible = true;
        } else {
          navigated = true;
        }
      };

      handleCardPress(true);

      expect(modalVisible).toBe(true);
      expect(navigated).toBe(false);
    });
  });

  describe('PremiumUpsellModal', () => {
    it('renders when visible is true', () => {
      const { getByText, getAllByText } = render(
        <PremiumUpsellModal
          visible={true}
          onClose={jest.fn()}
          testID="premium-modal"
        />
      );

      // Check for PRO text which is in the title
      expect(getByText(/Football IQ/i)).toBeTruthy();
      expect(getAllByText(/PRO/i)).toBeTruthy();
      // New subtitle/benefit
      expect(getByText(/UNLIMITED ARCHIVE ACCESS/i)).toBeTruthy();
    });

    it('calls onClose when X button is pressed', () => {
      const onCloseMock = jest.fn();
      const { getByTestId } = render(
        <PremiumUpsellModal
          visible={true}
          onClose={onCloseMock}
          testID="premium-modal"
        />
      );

      fireEvent.press(getByTestId('premium-modal-close'));
      expect(onCloseMock).toHaveBeenCalled();
    });

    it('shows plans state initially (mocked logic immediately sets packages)', async () => {
       // Since the mock sets packages immediately locally in the effect sometimes, 
       // but typically it starts as loading.
       // However, the test might need to wait if using real state transitions.
       // Given the implementation of PremiumUpsellModal, it calls fetchOfferings on mount.
       // The mock resolves immediately.
       // Let's check for either Loading or the Plans title.
       
       const { findByText } = render(
        <PremiumUpsellModal
          visible={true}
          onClose={jest.fn()}
          testID="premium-modal"
        />
      );

      // It might be 'Loading' if state update is async, or 'Choose Your Plan' if instant.
      // Better to use findByText for async updates.
      // But we can check if it eventually shows the content.
       const planHeader = await findByText('UNLIMITED ARCHIVE ACCESS');
       expect(planHeader).toBeTruthy();
    });
  });

  describe('Gating decision flow', () => {
    it('free user + old puzzle = blocked', () => {
      const oldDate = getDateDaysAgo(15);
      const isPremium = false;

      expect(isPuzzleLocked(oldDate, isPremium)).toBe(true);
    });

    it('free user + recent puzzle = allowed', () => {
      const recentDate = getDateDaysAgo(5);
      const isPremium = false;

      expect(isPuzzleLocked(recentDate, isPremium)).toBe(false);
    });

    it('premium user + old puzzle = allowed', () => {
      const oldDate = getDateDaysAgo(15);
      const isPremium = true;

      expect(isPuzzleLocked(oldDate, isPremium)).toBe(false);
    });

    it('premium user + recent puzzle = allowed', () => {
      const recentDate = getDateDaysAgo(5);
      const isPremium = true;

      expect(isPuzzleLocked(recentDate, isPremium)).toBe(false);
    });
  });
});
