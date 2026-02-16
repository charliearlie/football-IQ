import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@archive_discovery_dismissed';

type BannerVariant = 'default' | 'daily-complete' | 'streak';

interface UseArchiveDiscoveryBannerParams {
  isPremium: boolean;
  completedCount: number;
  totalCards: number;
  currentStreak: number;
}

interface UseArchiveDiscoveryBannerReturn {
  isVisible: boolean;
  dismiss: () => void;
  variant: BannerVariant;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getVariant(
  completedCount: number,
  totalCards: number,
  currentStreak: number
): BannerVariant {
  if (currentStreak >= 7) {
    return 'streak';
  }
  if (completedCount === totalCards && totalCards > 0) {
    return 'daily-complete';
  }
  return 'default';
}

export function useArchiveDiscoveryBanner({
  isPremium,
  completedCount,
  totalCards,
  currentStreak,
}: UseArchiveDiscoveryBannerParams): UseArchiveDiscoveryBannerReturn {
  const [isVisible, setIsVisible] = useState(false);
  const variant = getVariant(completedCount, totalCards, currentStreak);

  useEffect(() => {
    async function checkVisibility() {
      // Never show for premium users
      if (isPremium) {
        setIsVisible(false);
        return;
      }

      try {
        const dismissedDate = await AsyncStorage.getItem(STORAGE_KEY);
        const today = getTodayString();

        // Show if never dismissed or dismissed on a different day
        if (!dismissedDate || dismissedDate !== today) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        // If AsyncStorage fails, default to showing the banner
        setIsVisible(true);
      }
    }

    checkVisibility();
  }, [isPremium]);

  const dismiss = useCallback(async () => {
    setIsVisible(false);
    try {
      const today = getTodayString();
      await AsyncStorage.setItem(STORAGE_KEY, today);
    } catch (error) {
      // Silently fail - user experience isn't affected
    }
  }, []);

  return {
    isVisible,
    dismiss,
    variant,
  };
}
