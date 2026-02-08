import { renderHook, act } from '@testing-library/react-native';
import { useNetworkStatus } from '../useNetworkStatus';

// Controllable mock for NetInfo
let mockListener: ((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((callback: typeof mockListener) => {
    mockListener = callback;
    return mockUnsubscribe;
  }),
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListener = null;
  });

  it('returns null for both values initially before NetInfo fires', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isConnected).toBeNull();
    expect(result.current.isInternetReachable).toBeNull();
  });

  it('updates state when NetInfo reports connected', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isInternetReachable).toBe(true);
  });

  it('updates state when NetInfo reports disconnected', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: false, isInternetReachable: false });
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isInternetReachable).toBe(false);
  });

  it('cleans up subscription on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('tracks connectivity transitions', () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Start connected
    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current.isConnected).toBe(true);

    // Go offline
    act(() => {
      mockListener?.({ isConnected: false, isInternetReachable: false });
    });
    expect(result.current.isConnected).toBe(false);

    // Come back online
    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current.isConnected).toBe(true);
  });
});
