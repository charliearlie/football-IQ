/**
 * StreakCalendar Component
 *
 * Main container for the Streak Calendar feature.
 * Displays monthly grids of daily completion history with:
 * - 3D depth cells showing completion intensity
 * - Flame icons showing monthly streak records
 * - Perfect week indicators
 * - Premium gating for historical data (>60 days)
 * - Bottom sheet with game completion CTA
 * - Single-month navigation with arrows
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { colors, fonts, spacing, borderRadius } from '@/theme';
import { GlassCard } from '@/components';
import { triggerLight } from '@/lib/haptics';
import { useStreakCalendar } from '../../hooks/useStreakCalendar';
import { CalendarDay, CalendarMonth, CellPosition } from '../../types/calendar.types';
import { MonthGrid } from './MonthGrid';
import { MonthHeader } from './MonthHeader';
import { DayDetailSheet } from './DayDetailSheet';
import { LockedMonthOverlay } from './LockedMonthOverlay';

export interface StreakCalendarProps {
  /** Whether user has premium access */
  isPremium: boolean;
  /** Callback when premium upsell should be shown */
  onPremiumPress: () => void;
  /**
   * Display variant:
   * - 'standalone': Wrapped in GlassCard with header (default)
   * - 'embedded': No card wrapper, no header - for use inside Scout Report
   */
  variant?: 'standalone' | 'embedded';
  /** Test ID for testing */
  testID?: string;
}

/**
 * Number of days in the free window for non-premium users.
 * Users can see current month + previous month (~60 days).
 */
const FREE_WINDOW_DAYS = 60;

/**
 * Check if a month is locked (outside free window).
 */
function isMonthLocked(monthKey: string, isPremium: boolean): boolean {
  if (isPremium) return false;

  const [year, month] = monthKey.split('-').map(Number);
  const monthStartDate = new Date(year, month - 1, 1);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FREE_WINDOW_DAYS);

  // Month is locked if it ends before the cutoff date
  const monthEndDate = new Date(year, month, 0); // Last day of month
  return monthEndDate < cutoffDate;
}

/**
 * Get current month key in YYYY-MM format.
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * StreakCalendar - Monthly grid calendar showing daily completions.
 *
 * Features:
 * - Current month expanded at top
 * - 3D depth cells (empty/low/high intensity)
 * - Flame icon per month showing longest streak
 * - Perfect week indicators (gold left border)
 * - Premium gating for months > 60 days old
 * - Haptic tooltips on cell tap
 */
export function StreakCalendar({
  isPremium,
  onPremiumPress,
  variant = 'standalone',
  testID,
}: StreakCalendarProps) {
  const isEmbedded = variant === 'embedded';
  const router = useRouter();
  const { data, isLoading, error } = useStreakCalendar();

  // Bottom sheet state (replaces tooltip)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Month navigation state (single month view)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  // Get current month for comparison
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // Handle day cell press - show bottom sheet
  const handleDayPress = useCallback((day: CalendarDay, _position: CellPosition) => {
    triggerLight();
    setSelectedDay(day);
    setSheetVisible(true);
  }, []);

  // Dismiss bottom sheet
  const handleDismissSheet = useCallback(() => {
    setSheetVisible(false);
    setSelectedDay(null);
  }, []);

  // Navigate to archive with date filter for incomplete games
  const handleCompleteGames = useCallback((date: string) => {
    setSheetVisible(false);
    router.push({
      pathname: '/(tabs)/archive',
      params: { filterDate: date },
    });
  }, [router]);

  // Month navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setSelectedMonthIndex((prev) => prev + 1);
    triggerLight();
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonthIndex((prev) => Math.max(prev - 1, 0));
    triggerLight();
  }, []);

  // Build empty current month (used when no data or current month not in data)
  const emptyCurrentMonth = useMemo((): CalendarMonth => {
    const now = new Date();
    return {
      monthKey: currentMonthKey,
      monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      days: [],
      longestStreak: 0,
      totalIQ: 0,
      perfectWeeks: [],
    };
  }, [currentMonthKey]);

  // Ensure current month exists in data and is at index 0 (for navigation)
  const monthsToRender = useMemo(() => {
    if (!data || data.months.length === 0) {
      // No data yet - show empty current month
      return [emptyCurrentMonth];
    }

    // Filter out future months (after current month) - they shouldn't be navigable
    const filteredMonths = data.months.filter((m) => m.monthKey <= currentMonthKey);

    // Check if current month exists in filtered data
    const hasCurrentMonth = filteredMonths.some((m) => m.monthKey === currentMonthKey);

    if (!hasCurrentMonth) {
      // Add empty current month at index 0
      return [emptyCurrentMonth, ...filteredMonths];
    }

    // Current month should be at index 0 (data.months is sorted newest-first, filtered to <= current)
    return filteredMonths;
  }, [data, currentMonthKey, emptyCurrentMonth]);

  // Wrapper component based on variant
  const Wrapper = isEmbedded ? View : GlassCard;
  const wrapperStyle = isEmbedded ? styles.embeddedContainer : styles.container;

  // Loading skeleton
  if (isLoading && !data) {
    return (
      <Wrapper style={wrapperStyle} testID={testID}>
        {!isEmbedded && (
          <View style={styles.header}>
            <Calendar size={20} color={colors.pitchGreen} />
            <Text style={styles.headerTitle}>Activity</Text>
          </View>
        )}
        <View style={styles.skeleton}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonGrid} />
        </View>
      </Wrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <Wrapper style={wrapperStyle} testID={testID}>
        {!isEmbedded && (
          <View style={styles.header}>
            <Calendar size={20} color={colors.pitchGreen} />
            <Text style={styles.headerTitle}>Activity</Text>
          </View>
        )}
        <Text style={styles.errorText}>Unable to load activity data</Text>
      </Wrapper>
    );
  }

  // Get current month to display
  const currentMonth = monthsToRender[selectedMonthIndex];
  const isCurrentMonth = currentMonth?.monthKey === currentMonthKey;
  const isLocked = currentMonth ? isMonthLocked(currentMonth.monthKey, isPremium) : false;
  const hasPreviousMonth = selectedMonthIndex < monthsToRender.length - 1;
  const hasNextMonth = selectedMonthIndex > 0;

  return (
    <Wrapper style={wrapperStyle} testID={testID}>
      {!isEmbedded && (
        <View style={styles.header}>
          <Calendar size={20} color={colors.pitchGreen} />
          <Text style={styles.headerTitle}>Activity</Text>
        </View>
      )}

      {currentMonth && (
        <View style={[styles.monthContainer, isLocked && styles.lockedMonth]}>
          <MonthHeader
            monthName={currentMonth.monthName}
            longestStreak={currentMonth.longestStreak}
            totalIQ={currentMonth.totalIQ}
            isCurrentMonth={isCurrentMonth}
            onPrevious={hasPreviousMonth ? goToPreviousMonth : undefined}
            onNext={hasNextMonth ? goToNextMonth : undefined}
            hasPrevious={hasPreviousMonth}
            hasNext={hasNextMonth}
            testID={`month-header-${currentMonth.monthKey}`}
          />

          <MonthGrid
            month={currentMonth}
            isCurrentMonth={isCurrentMonth}
            onDayPress={handleDayPress}
            showHeader={false}
            testID={`month-grid-${currentMonth.monthKey}`}
          />

          {isLocked && (
            <LockedMonthOverlay
              onPress={onPremiumPress}
              testID={`locked-overlay-${currentMonth.monthKey}`}
            />
          )}
        </View>
      )}

      {/* Bottom sheet for day details */}
      <DayDetailSheet
        day={selectedDay}
        visible={sheetVisible}
        onDismiss={handleDismissSheet}
        onCompleteGames={handleCompleteGames}
        testID="day-detail-sheet"
      />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  embeddedContainer: {
    // No margin/padding when embedded - parent handles spacing
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.floodlightWhite,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthContainer: {
    position: 'relative',
  },
  lockedMonth: {
    minHeight: 200,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  skeleton: {
    gap: spacing.md,
  },
  skeletonHeader: {
    height: 24,
    width: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
  },
  skeletonGrid: {
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
