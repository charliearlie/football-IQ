/**
 * SettingsScreen
 *
 * Main settings screen with Privacy Policy, Terms, and Rate App.
 * Provides legal compliance and user support features.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, FileText, Star } from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { colors, textStyles, spacing } from '@/theme';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { LegalModal } from '../components/LegalModal';
import { RateAppModal } from '../components/RateAppModal';

export interface SettingsScreenProps {
  testID?: string;
}

export function SettingsScreen({ testID }: SettingsScreenProps) {
  // Modal visibility states
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);

  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  /**
   * Handle Privacy Policy row press
   */
  const handlePrivacyPress = useCallback(() => {
    setPrivacyModalVisible(true);
  }, []);

  /**
   * Handle Terms of Service row press
   */
  const handleTermsPress = useCallback(() => {
    setTermsModalVisible(true);
  }, []);

  /**
   * Handle Rate App row press
   * Attempts native review first, falls back to modal
   */
  const handleRateAppPress = useCallback(async () => {
    // Check if native review is available
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      // Use native review dialog
      await StoreReview.requestReview();
    } else {
      // Fall back to custom modal
      setRateModalVisible(true);
    }
  }, []);

  /**
   * Close modals
   */
  const closePrivacyModal = useCallback(() => {
    setPrivacyModalVisible(false);
  }, []);

  const closeTermsModal = useCallback(() => {
    setTermsModalVisible(false);
  }, []);

  const closeRateModal = useCallback(() => {
    setRateModalVisible(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
          testID={testID ? `${testID}-title` : undefined}
        >
          Settings
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Legal Section */}
        <SettingsSection title="Legal">
          <SettingsRow
            icon={<Shield size={20} color={colors.pitchGreen} strokeWidth={2} />}
            label="Privacy Policy"
            onPress={handlePrivacyPress}
            testID={testID ? `${testID}-privacy-row` : undefined}
          />
          <SettingsRow
            icon={<FileText size={20} color={colors.pitchGreen} strokeWidth={2} />}
            label="Terms of Service"
            onPress={handleTermsPress}
            testID={testID ? `${testID}-terms-row` : undefined}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="Support">
          <SettingsRow
            icon={<Star size={20} color={colors.cardYellow} strokeWidth={2} />}
            label="Rate App"
            onPress={handleRateAppPress}
            testID={testID ? `${testID}-rate-row` : undefined}
          />
        </SettingsSection>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version {appVersion}</Text>
          <Text style={styles.copyrightText}>
            Football IQ {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <LegalModal
        visible={privacyModalVisible}
        type="privacy"
        onClose={closePrivacyModal}
        testID="legal-modal"
      />

      <LegalModal
        visible={termsModalVisible}
        type="terms"
        onClose={closeTermsModal}
        testID="legal-modal"
      />

      <RateAppModal
        visible={rateModalVisible}
        onClose={closeRateModal}
        testID="rate-modal"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.floodlightWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  versionText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  copyrightText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});
