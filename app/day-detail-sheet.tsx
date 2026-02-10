/**
 * Day Detail Sheet Route
 *
 * Native formSheet presenting calendar day details.
 * Gets Liquid Glass blur on iOS 26 automatically.
 * Falls back to standard modal on Android.
 */

import { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/theme';
import { DayDetailSheet } from '@/features/stats/components/StreakCalendar/DayDetailSheet';
import {
  getDayDetailData,
  clearDayDetailData,
} from '@/features/stats/stores/dayDetailStore';

export default function DayDetailSheetRoute() {
  const router = useRouter();
  const day = getDayDetailData();

  // Clear store on unmount
  useEffect(() => {
    return () => clearDayDetailData();
  }, []);

  const handleCompleteGames = useCallback(
    (date: string) => {
      router.back();
      // Allow dismiss animation to complete before navigating to archive
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/archive',
          params: { filterDate: date },
        });
      }, 300);
    },
    [router],
  );

  // Guard: if no data (e.g., direct deep link), dismiss
  if (!day) {
    router.back();
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
          contentStyle: styles.content,
        }}
      />
      <View style={styles.container}>
        <DayDetailSheet
          day={day}
          onCompleteGames={handleCompleteGames}
          testID="day-detail-sheet"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.stadiumNavy,
  },
});
