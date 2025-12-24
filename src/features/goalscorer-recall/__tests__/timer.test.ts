/**
 * Tests for useCountdownTimer hook.
 */

import { renderHook, act } from '@testing-library/react-native';
import { useCountdownTimer } from '../hooks/useCountdownTimer';

describe('useCountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at initial seconds', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60 })
    );

    expect(result.current.timeRemaining).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it('counts down every second when started', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    // Advance 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.timeRemaining).toBe(57);
  });

  it('calls onTick with remaining time each second', () => {
    const onTick = jest.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60, onTick })
    );

    act(() => {
      result.current.start();
    });

    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onTick).toHaveBeenCalledWith(59);

    // Advance 2 more seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onTick).toHaveBeenCalledWith(58);
    expect(onTick).toHaveBeenCalledWith(57);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('stops at 0 and calls onFinish', () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 3, onFinish })
    );

    act(() => {
      result.current.start();
    });

    // Advance 3 seconds to reach 0
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('does not go below 0', () => {
    const onTick = jest.fn();
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 2, onTick, onFinish })
    );

    act(() => {
      result.current.start();
    });

    // Advance to exactly when timer should finish
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onFinish).toHaveBeenCalledTimes(1);

    // Clear mock to verify no more ticks happen
    onTick.mockClear();

    // Advance more time - should not trigger any more ticks
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('can be stopped manually', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.timeRemaining).toBe(58);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isRunning).toBe(false);

    // Advance more time - should not change
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeRemaining).toBe(58);
  });

  it('can be reset to initial value', () => {
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60 })
    );

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.timeRemaining).toBe(50);

    act(() => {
      result.current.reset();
    });

    expect(result.current.timeRemaining).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it('does not tick when not running', () => {
    const onTick = jest.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60, onTick })
    );

    // Don't start, just advance time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeRemaining).toBe(60);
    expect(onTick).not.toHaveBeenCalled();
  });

  it('does not double-start if already running', () => {
    const onTick = jest.fn();
    const { result } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60, onTick })
    );

    act(() => {
      result.current.start();
      result.current.start(); // Try to start again
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should only have one interval, so only one tick
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('cleans up interval on unmount', () => {
    const { result, unmount } = renderHook(() =>
      useCountdownTimer({ initialSeconds: 60 })
    );

    act(() => {
      result.current.start();
    });

    // Unmount should clean up
    unmount();

    // This should not throw
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });
});
