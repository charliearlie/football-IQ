/**
 * SettingsScreen
 *
 * Main settings screen with Privacy Policy, Terms, and Rate App.
 * Provides legal compliance and user support features.
 *
 * Secret dev menu: Tap version text 7 times to reveal developer options.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, FileText, Star, Trash2 } from 'lucide-react-native';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { colors, textStyles, spacing } from '@/theme';
import { deleteAttemptsByGameMode } from '@/lib/database';
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

  // Dev mode state (tap version 7 times to enable)
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  /**
   * Handle version text tap for secret dev menu
   */
  const handleVersionTap = useCallback(() => {
    const now = Date.now();
    // Reset counter if more than 2 seconds since last tap
    if (now - lastTapTimeRef.current > 2000) {
      tapCountRef.current = 0;
    }
    lastTapTimeRef.current = now;
    tapCountRef.current += 1;

    if (tapCountRef.current >= 7) {
      setDevModeEnabled(true);
      tapCountRef.current = 0;
      Alert.alert('Developer Mode', 'Developer options are now visible.');
    }
  }, []);

  /**
   * Clear attempts for a specific game mode
   */
  const handleClearAttempts = useCallback(async (gameMode: string, displayName: string) => {
    Alert.alert(
      'Clear Attempts',
      `Delete all local attempts for ${displayName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const count = await deleteAttemptsByGameMode(gameMode);
              Alert.alert('Success', `Deleted ${count} ${displayName} attempts.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete attempts.');
              console.error('Failed to delete attempts:', error);
            }
          },
        },
      ]
    );
  }, []);

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

        {/* Developer Section (hidden until activated) */}
        {devModeEnabled && (
          <SettingsSection title="Developer">
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Goalscorer Recall Data"
              onPress={() => handleClearAttempts('guess_the_goalscorers', 'Goalscorer Recall')}
              testID={testID ? `${testID}-clear-goalscorer-row` : undefined}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Career Path Data"
              onPress={() => handleClearAttempts('career_path', 'Career Path')}
              testID={testID ? `${testID}-clear-career-row` : undefined}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Transfer Guess Data"
              onPress={() => handleClearAttempts('guess_the_transfer', 'Transfer Guess')}
              testID={testID ? `${testID}-clear-transfer-row` : undefined}
            />
          </SettingsSection>
        )}

        {/* App Version (tap 7 times for dev menu) */}
        <Pressable style={styles.footer} onPress={handleVersionTap}>
          <Text style={styles.versionText}>Version {appVersion}</Text>
          <Text style={styles.copyrightText}>
            Football IQ {new Date().getFullYear()}
          </Text>
        </Pressable>
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
