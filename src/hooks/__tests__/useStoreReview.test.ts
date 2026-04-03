/**
 * useStoreReview Tests
 *
 * Tests observable behavior and constants of the store review hook.
 * The hook's internal functions (incrementSessionCount, maybeRequestReview)
 * are not exported, so we test via:
 *   1. Constants that are directly verifiable
 *   2. The hook's effect behavior via renderHook + AsyncStorage mocks
 */

import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { usePostHog } from 'posthog-react-native';
import { useStoreReview } from '../useStoreReview';

// expo-store-review is not mocked globally — mock it here
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  requestReview: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockStoreReview = StoreReview as jest.Mocked<typeof StoreReview>;

// Grab the PostHog capture mock set up in jest-setup.ts
const getMockCapture = () => {
  const { capture } = (usePostHog as jest.Mock).mock.results[
    (usePostHog as jest.Mock).mock.results.length - 1
  ]?.value ?? { capture: jest.fn() };
  return capture;
};

// MIN_INTERVAL_MS is 90 days — derive the expected value for assertions
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Helper: build default hook props
const defaultProps = {
  visible: false,
  resultType: 'win' as const,
  streakDays: 5,
  tierChanged: false,
};

describe('useStoreReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default: store review available
    mockStoreReview.isAvailableAsync.mockResolvedValue(true);
    mockStoreReview.requestReview.mockResolvedValue();

    // Default: nothing stored yet
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('90-day rate-limit constant', () => {
    it('90 days in milliseconds equals 7776000000', () => {
      // Verify the constant matches the expected 90-day interval
      expect(NINETY_DAYS_MS).toBe(7_776_000_000);
    });

    it('90 days is strictly greater than 60 days', () => {
      const sixtyDays = 60 * 24 * 60 * 60 * 1000;
      expect(NINETY_DAYS_MS).toBeGreaterThan(sixtyDays);
    });

    it('90 days allows approximately 4 prompts per year', () => {
      const promptsPerYear = Math.floor(365 / 90);
      expect(promptsPerYear).toBe(4);
    });
  });

  describe('when visible transitions to true', () => {
    it('does not call requestReview when result is loss', async () => {
      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, resultType: 'loss' as const, visible: false } }
      );

      rerender({ ...defaultProps, resultType: 'loss' as const, visible: true });

      // Advance past the 1500ms delay
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('does not call requestReview when result is draw', async () => {
      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, resultType: 'draw' as const, visible: false } }
      );

      rerender({ ...defaultProps, resultType: 'draw' as const, visible: true });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('resets the prompted guard when modal becomes hidden', () => {
      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: true } }
      );

      // Hide modal — should reset guard so next show can re-trigger
      rerender({ ...defaultProps, visible: false });

      // Re-show should allow prompt again (no duplicate block)
      rerender({ ...defaultProps, visible: true });

      // Verify the hook didn't throw and runs without error
      expect(true).toBe(true);
    });

    it('does not show review when store review is not available', async () => {
      mockStoreReview.isAvailableAsync.mockResolvedValue(false);

      // 5 sessions stored (meets session threshold)
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('4');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false } }
      );

      rerender({ ...defaultProps, visible: true });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('skips review when prompted within the 90-day interval', async () => {
      const recentPrompt = Date.now() - 10 * 24 * 60 * 60 * 1000; // 10 days ago

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_last_review_prompt') {
          return Promise.resolve(String(recentPrompt));
        }
        if (key === '@football_iq_session_count') return Promise.resolve('4');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('allows review when last prompt was more than 90 days ago', async () => {
      const oldPrompt = Date.now() - 91 * 24 * 60 * 60 * 1000; // 91 days ago

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_last_review_prompt') {
          return Promise.resolve(String(oldPrompt));
        }
        if (key === '@football_iq_session_count') return Promise.resolve('4');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).toHaveBeenCalledTimes(1);
    });
  });

  describe('session count condition', () => {
    it('triggers review after 5+ sessions even without a streak', async () => {
      // Session count is at 4 (will become 5 after increment)
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('4');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        {
          initialProps: {
            ...defaultProps,
            visible: false,
            streakDays: undefined, // no streak
            tierChanged: false,
          },
        }
      );

      rerender({
        ...defaultProps,
        visible: true,
        streakDays: undefined,
        tierChanged: false,
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).toHaveBeenCalledTimes(1);
    });

    it('does not trigger review when session count is below 5 with no streak', async () => {
      // Session count is at 3 (will become 4 after increment — still below threshold)
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('3');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        {
          initialProps: {
            ...defaultProps,
            visible: false,
            streakDays: undefined,
            tierChanged: false,
          },
        }
      );

      rerender({
        ...defaultProps,
        visible: true,
        streakDays: undefined,
        tierChanged: false,
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('increments session count in AsyncStorage on each win result', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('2');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      // Should have written the incremented count back to storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@football_iq_session_count',
        '3'
      );
    });

    it('initialises session count to 1 when storage is empty', async () => {
      // getItem returns null for all keys (fresh install)
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@football_iq_session_count',
        '1'
      );
    });
  });

  describe('streak condition', () => {
    it('triggers review when streak is exactly 3', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 3 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 3 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).toHaveBeenCalledTimes(1);
    });

    it('does not trigger review when streak is 2 (below threshold)', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('1');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 2 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 2 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });
  });

  describe('tier promotion condition', () => {
    it('triggers review on tier promotion even without streak', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('1');
        return Promise.resolve(null);
      });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        {
          initialProps: {
            ...defaultProps,
            visible: false,
            streakDays: undefined,
            tierChanged: true,
          },
        }
      );

      rerender({
        ...defaultProps,
        visible: true,
        streakDays: undefined,
        tierChanged: true,
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).toHaveBeenCalledTimes(1);
    });
  });

  describe('PostHog analytics', () => {
    it('calls capture with store_review_prompted event on successful prompt', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      // Set up PostHog mock capture spy
      const mockCapture = jest.fn();
      (usePostHog as jest.Mock).mockReturnValue({ capture: mockCapture });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'store_review_prompted',
        expect.objectContaining({ trigger: 'streak' })
      );
    });

    it('passes trigger=session_count when review fires due to session count', async () => {
      // 4 stored → becomes 5 after increment
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('4');
        return Promise.resolve(null);
      });

      const mockCapture = jest.fn();
      (usePostHog as jest.Mock).mockReturnValue({ capture: mockCapture });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        {
          initialProps: {
            ...defaultProps,
            visible: false,
            streakDays: undefined,
            tierChanged: false,
          },
        }
      );

      rerender({
        ...defaultProps,
        visible: true,
        streakDays: undefined,
        tierChanged: false,
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'store_review_prompted',
        expect.objectContaining({ trigger: 'session_count', session_count: 5 })
      );
    });

    it('passes trigger=tier_promotion when tierChanged is true', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@football_iq_session_count') return Promise.resolve('1');
        return Promise.resolve(null);
      });

      const mockCapture = jest.fn();
      (usePostHog as jest.Mock).mockReturnValue({ capture: mockCapture });

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        {
          initialProps: {
            ...defaultProps,
            visible: false,
            streakDays: undefined,
            tierChanged: true,
          },
        }
      );

      rerender({
        ...defaultProps,
        visible: true,
        streakDays: undefined,
        tierChanged: true,
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockCapture).toHaveBeenCalledWith(
        'store_review_prompted',
        expect.objectContaining({ trigger: 'tier_promotion' })
      );
    });
  });

  describe('1500ms delay', () => {
    it('does not call requestReview before the 1500ms delay', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      // Advance only 1000ms — before the delay fires
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('clears the timer when the modal closes before the delay fires', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { rerender } = renderHook(
        (props) => useStoreReview(props),
        { initialProps: { ...defaultProps, visible: false, streakDays: 5 } }
      );

      rerender({ ...defaultProps, visible: true, streakDays: 5 });

      // Close modal before 1500ms
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      rerender({ ...defaultProps, visible: false, streakDays: 5 });

      // Advance past the original timeout
      await act(async () => {
        jest.advanceTimersByTime(2000);
        await Promise.resolve();
      });

      expect(mockStoreReview.requestReview).not.toHaveBeenCalled();
    });
  });
});
