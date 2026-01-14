import React from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { UnlockChoiceModal } from '../UnlockChoiceModal';
import { useAds } from '../../context/AdContext';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('../../context/AdContext');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
  Unlock: 'Unlock',
  Crown: 'Crown',
  Play: 'Play',
  X: 'X',
  Check: 'Check',
  AlertCircle: 'AlertCircle',
  Loader2: 'Loader2',
  ArrowRight: 'ArrowRight',
}));

describe('UnlockChoiceModal', () => {
  const mockRouter = { push: jest.fn() };
  const mockLoadRewardedAd = jest.fn().mockResolvedValue(undefined);
  const mockShowRewardedAd = jest.fn();
  const mockGrantAdUnlock = jest.fn().mockResolvedValue(undefined);
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAds as jest.Mock).mockReturnValue({
      loadRewardedAd: mockLoadRewardedAd,
      showRewardedAd: mockShowRewardedAd,
      grantAdUnlock: mockGrantAdUnlock,
      isRewardedAdReady: true,
      rewardedAdState: 'loaded',
    });
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    visible: true,
    onClose: mockOnClose,
    puzzleId: 'test-puzzle-123',
    puzzleDate: '2025-01-01',
    gameMode: 'career_path' as const,
    testID: 'unlock-modal',
  };

  it('renders correctly in idle state', () => {
    const { getByText, getByTestId } = render(<UnlockChoiceModal {...defaultProps} />);

    expect(getByText('UNLOCK PUZZLE')).toBeTruthy();
    expect(getByText('Go Premium')).toBeTruthy();
    expect(getByText('Watch Ad')).toBeTruthy();
    expect(getByTestId('unlock-modal-watch-ad-button')).not.toBeDisabled();
  });

  it('handles "Go Premium" correctly', async () => {
    const { getByTestId } = render(<UnlockChoiceModal {...defaultProps} />);

    fireEvent.press(getByTestId('unlock-modal-premium-button'));

    // Should close modal first
    expect(mockOnClose).toHaveBeenCalled();

    // Check navigation after delay
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/premium-modal',
        params: { puzzleDate: '2025-01-01', mode: 'blocked' },
      });
    });
  });

  it('handles successful ad watch flow (Manual Navigation)', async () => {
    mockShowRewardedAd.mockResolvedValue(true); // Ad watched successfully

    const { getByTestId, findByText, queryByText } = render(<UnlockChoiceModal {...defaultProps} />);

    // 1. Press Watch Ad
    fireEvent.press(getByTestId('unlock-modal-watch-ad-button'));

    // 2. Verify Ad Loading/Showing
    await waitFor(() => {
      expect(mockShowRewardedAd).toHaveBeenCalled();
    });

    // 3. Verify Success State (PUZZLE UNLOCKED!)
    const successTitle = await findByText('PUZZLE UNLOCKED!');
    expect(successTitle).toBeTruthy();

    // 4. Verify "Play Now" button is present
    const playButton = getByTestId('unlock-modal-play-now-button');
    expect(playButton).toBeTruthy();
    
    // 5. Verify NO automatic navigation occurs
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait > 2s
    expect(mockRouter.push).not.toHaveBeenCalled();

    // 6. Press "Play Now"
    fireEvent.press(playButton);

    // 7. Verify Navigation happens NOW
    // Should close first
    expect(mockOnClose).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/career-path/[puzzleId]',
        params: { 
          puzzleId: 'test-puzzle-123',
          puzzleDate: '2025-01-01', // Important: Sync access check
        },
      });
    });
  });

  it('handles ad error correctly', async () => {
    mockShowRewardedAd.mockRejectedValue(new Error('Ad failed'));

    const { getByTestId, findByText } = render(<UnlockChoiceModal {...defaultProps} />);

    fireEvent.press(getByTestId('unlock-modal-watch-ad-button'));

    const errorMsg = await findByText('Ad failed');
    expect(errorMsg).toBeTruthy();
    expect(getByTestId('unlock-modal-retry-button')).toBeTruthy();
  });

  it('handles "Close (Saved)" button correctly', async () => {
    mockShowRewardedAd.mockResolvedValue(true);

    const { getByTestId, findByText } = render(<UnlockChoiceModal {...defaultProps} />);

    // Watch ad -> Success
    fireEvent.press(getByTestId('unlock-modal-watch-ad-button'));
    await findByText('PUZZLE UNLOCKED!');

    // Press "Back to Archive"
    const closeButton = getByTestId('unlock-modal-success-close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled(); // Should NOT navigate
  });
});
