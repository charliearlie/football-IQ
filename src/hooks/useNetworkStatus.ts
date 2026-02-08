import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  /** null = still checking, true = online, false = offline */
  isConnected: boolean | null;
  /** null = still checking, true = internet reachable, false = not reachable */
  isInternetReachable: boolean | null;
}

/**
 * Hook to monitor network connectivity status.
 *
 * NetInfo's addEventListener fires immediately on subscribe with the current
 * state, so no initial fetch is needed.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
