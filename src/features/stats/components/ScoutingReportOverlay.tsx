/**
 * ScoutingReportOverlay Component
 *
 * Modal overlay for viewing and sharing the Scouting Report card.
 * Uses ViewShot for high-quality image capture.
 */

import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { X } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, textStyles, spacing, borderRadius } from '@/theme';
import { ElevatedButton } from '@/components';
import { ScoutingReportCard, ScoutingReportData } from './ScoutingReportCard';
import { captureAndShareScoutingReport } from '../utils/shareScoutingReport';

export interface ScoutingReportOverlayProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Scouting report data to display */
  data: ScoutingReportData;
}

/**
 * Modal overlay for viewing and sharing the Scouting Report.
 */
export function ScoutingReportOverlay({
  visible,
  onClose,
  data,
}: ScoutingReportOverlayProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'error'>(
    'idle'
  );

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setShareStatus('idle');

    const result = await captureAndShareScoutingReport(viewShotRef, data);

    setIsSharing(false);

    if (result.success) {
      setShareStatus('shared');
      // Reset after 2 seconds
      setTimeout(() => setShareStatus('idle'), 2000);
    } else {
      setShareStatus('error');
    }
  }, [data]);

  const getButtonTitle = () => {
    if (isSharing) return 'Sharing...';
    if (shareStatus === 'shared') return 'Shared!';
    return 'Share Scout Report';
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Close Button - positioned at top-right */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
              <X size={24} color={colors.floodlightWhite} />
            </Pressable>
          </View>

          {/* Main Content - centered vertically */}
          <View style={styles.content}>
            {/* Title */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(300)}
              style={styles.titleContainer}
            >
              <Text style={styles.modalTitle}>Your Scout Report</Text>
              <Text style={styles.modalSubtitle}>
                Share your Football IQ profile with friends
              </Text>
            </Animated.View>

            {/* Capturable Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1 }}
                style={styles.viewShot}
              >
                <ScoutingReportCard data={data} testID="scouting-report-card" />
              </ViewShot>
            </Animated.View>

            {/* Action Button - centered */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(300)}
              style={styles.actions}
            >
              <ElevatedButton
                title={getButtonTitle()}
                onPress={handleShare}
                disabled={isSharing}
                size="large"
                topColor={
                  shareStatus === 'shared'
                    ? colors.glassBackground
                    : colors.pitchGreen
                }
                shadowColor={
                  shareStatus === 'shared' ? colors.glassBorder : undefined
                }
              />
            </Animated.View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.glassBackground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  viewShot: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actions: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
