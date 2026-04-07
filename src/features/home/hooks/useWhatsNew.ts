import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const KEY_PREFIX = '@whats_new_seen_';

/**
 * Shows a "What's New" modal once per app version.
 * Checks AsyncStorage for `@whats_new_seen_{version}`.
 */
export function useWhatsNew() {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`${KEY_PREFIX}${version}`).then((seen) => {
      if (!seen) setVisible(true);
    });
  }, [version]);

  const dismiss = useCallback(() => {
    setVisible(false);
    AsyncStorage.setItem(`${KEY_PREFIX}${version}`, 'true');
  }, [version]);

  return { visible, dismiss, version };
}
