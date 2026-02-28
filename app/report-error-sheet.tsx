/**
 * Report Error Sheet Route
 *
 * Native formSheet for submitting puzzle error reports.
 * Gets Liquid Glass blur on iOS 26 automatically.
 * Falls back to standard modal on Android.
 */

import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/theme';
import { triggerSuccess } from '@/lib/haptics';
import { ReportErrorSheet } from '@/features/career-path/components/ReportErrorSheet';
import { submitReport } from '@/features/career-path/services/reportService';
import type { ReportType } from '@/features/career-path/components/ReportErrorSheet';

export default function ReportErrorSheetRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (reportType: ReportType, comment?: string) => {
      if (!puzzleId) return;
      const result = await submitReport(puzzleId, reportType, comment);
      if (!result.success) {
        throw new Error(result.error);
      }
      triggerSuccess();
      setIsSuccess(true);
      // Auto-dismiss after success animation
      setTimeout(() => router.back(), 1500);
    },
    [puzzleId, router],
  );

  // Guard: if no puzzleId (e.g., direct deep link), dismiss
  if (!puzzleId) {
    router.back();
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.55],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
          contentStyle: styles.content,
          gestureEnabled: !isSuccess,
        }}
      />
      <View style={styles.container}>
        <ReportErrorSheet
          puzzleId={puzzleId}
          onSubmit={handleSubmit}
          isSuccess={isSuccess}
          testID="report-error-sheet"
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
