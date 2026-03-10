import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onStatsChanged } from '@/lib/statsEvents';

const STORAGE_KEY = '@welcome_back_dismissed';

const STREAK_MILESTONES = [
  { day: 30, heading: 'DAY 30', body: "A month of daily football knowledge — you're elite" },
  { day: 14, heading: 'DAY 14', body: "Two weeks strong — you're in the zone" },
  { day: 7, heading: '7 DAYS IN A ROW', body: "That's commitment — keep building" },
  { day: 5, heading: 'DAY 5', body: "You're building a habit" },
  { day: 2, heading: 'DAY 2', body: 'Welcome back!' },
] as const;

export interface WelcomeBackBannerData {
  heading: string;
  body: string;
  type: 'milestone' | 'streak-lost';
}

interface UseWelcomeBackBannerParams {
  currentStreak: number;
  lastPlayedDate: string | null;
  gamesPlayedToday: number;
}

interface UseWelcomeBackBannerReturn {
  isVisible: boolean;
  data: WelcomeBackBannerData | null;
  dismiss: () => void;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDaysDifference(date1: string, date2: string): number {
  const utc1 = Date.UTC(
    parseInt(date1.slice(0, 4)),
    parseInt(date1.slice(5, 7)) - 1,
    parseInt(date1.slice(8, 10))
  );
  const utc2 = Date.UTC(
    parseInt(date2.slice(0, 4)),
    parseInt(date2.slice(5, 7)) - 1,
    parseInt(date2.slice(8, 10))
  );
  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

function getBannerData(
  currentStreak: number,
  lastPlayedDate: string | null,
): WelcomeBackBannerData | null {
  // Check streak-lost: streak is 0, user has played before, and last play was more than 1 day ago
  if (currentStreak === 0 && lastPlayedDate !== null) {
    const today = getTodayString();
    const daysSinceLastPlay = getDaysDifference(today, lastPlayedDate);
    if (daysSinceLastPlay > 1) {
      return {
        heading: 'START FRESH',
        body: 'Your next streak starts now',
        type: 'streak-lost',
      };
    }
  }

  // Check streak milestones highest-first
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak === milestone.day) {
      return {
        heading: milestone.heading,
        body: milestone.body,
        type: 'milestone',
      };
    }
  }

  return null;
}

export function useWelcomeBackBanner({
  currentStreak,
  lastPlayedDate,
  gamesPlayedToday,
}: UseWelcomeBackBannerParams): UseWelcomeBackBannerReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<WelcomeBackBannerData | null>(null);

  useEffect(() => {
    async function checkVisibility() {
      const bannerData = getBannerData(currentStreak, lastPlayedDate);

      // Nothing to show
      if (bannerData === null) {
        setIsVisible(false);
        setData(null);
        return;
      }

      // Auto-dismiss if user has already played today
      if (gamesPlayedToday > 0) {
        setIsVisible(false);
        setData(null);
        return;
      }

      try {
        const dismissedDate = await AsyncStorage.getItem(STORAGE_KEY);
        const today = getTodayString();

        // Show if never dismissed or dismissed on a different day
        if (!dismissedDate || dismissedDate !== today) {
          setData(bannerData);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        // If AsyncStorage fails, default to showing the banner
        setData(bannerData);
        setIsVisible(true);
      }
    }

    checkVisibility();
  }, [currentStreak, lastPlayedDate, gamesPlayedToday]);

  // Subscribe to stats changes — auto-dismiss when a game is completed
  useEffect(() => {
    return onStatsChanged(() => {
      // When stats change (game completed), hide the banner
      setIsVisible(false);
    });
  }, []);

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
    data,
    dismiss,
  };
}
