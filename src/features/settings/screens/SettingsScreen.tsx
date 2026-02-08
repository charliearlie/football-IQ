/**
 * SettingsScreen
 *
 * Main settings screen with Privacy Policy, Terms, and Rate App.
 * Provides legal compliance and user support features.
 *
 * Secret dev menu: Tap version text 7 times to reveal developer options.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Shield,
  FileText,
  Star,
  Trash2,
  Bell,
  BellOff,
  RotateCcw,
  UserX,
  Lightbulb,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";
import { colors, textStyles, spacing } from "@/theme";
import { deleteAttemptsByGameMode, clearAllLocalData } from "@/lib/database";
import { useAuth, useSubscriptionSync } from "@/features/auth";
import { supabase } from "@/lib/supabase";
import {
  scheduleNotification,
  getMorningMessage,
  getStreakSaverMessage,
  getPermissionStatus,
  requestPermissions,
} from "@/features/notifications";
import { useOnboardingContext, usePuzzleContext } from "@/features/puzzles";
import { SettingsRow } from "../components/SettingsRow";
import { SettingsSection } from "../components/SettingsSection";
import { RateAppModal } from "../components/RateAppModal";

export interface SettingsScreenProps {
  testID?: string;
}

export function SettingsScreen({ testID }: SettingsScreenProps) {
  const router = useRouter();

  // Modal visibility states
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dev mode state (tap version 7 times to enable)
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  // Auth context for user data and sign out
  const { session, signOut } = useAuth();

  // Subscription sync for restoring purchases
  const { forceSync, restorePurchases } = useSubscriptionSync();
  const [isRestoring, setIsRestoring] = useState(false);

  // Onboarding context for resetting intro screens
  const { resetAllIntros } = useOnboardingContext();
  // Puzzle context for refreshing local state after data operations
  const { refreshLocalPuzzles } = usePuzzleContext();

  // Notifications toggle — reflects OS permission status
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    getPermissionStatus().then((status) => {
      setNotificationsEnabled(status === "granted");
    });
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const status = await requestPermissions();
      setNotificationsEnabled(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Notification permissions can only be changed in iOS Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } else {
      Alert.alert(
        "Disable Notifications",
        "Notification permissions can only be changed in iOS Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, []);

  // Sound effects toggle (dev only, OFF by default)
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@sound_dev_enabled").then((val) => {
      setSoundEnabled(val === "true");
    });
  }, []);

  const handleToggleSound = useCallback(async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem("@sound_dev_enabled", value ? "true" : "false");
    Alert.alert(
      value ? "Sound Effects Enabled" : "Sound Effects Disabled",
      value
        ? "Sound effects are now on. Restart the app for changes to take effect."
        : "Sound effects have been turned off.",
    );
  }, []);

  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version ?? "1.0.1";

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
      Alert.alert("Developer Mode", "Developer options are now visible.");
    }
  }, []);

  /**
   * Handle Restore Purchases - explicitly triggers restore with RevenueCat
   */
  const handleRestorePurchases = useCallback(async () => {
    if (isRestoring) return;

    setIsRestoring(true);
    try {
      const { success, hasPremium } = await restorePurchases();

      if (success) {
        if (hasPremium) {
          Alert.alert("Success", "Pro status restored successfully!");
        } else {
          Alert.alert(
            "Restore Complete",
            "No active subscriptions were found.",
          );
        }
      } else {
        // Error handled in service, but we show generic alert
        Alert.alert("Error", "Failed to restore purchases. Please try again.");
      }
    } catch (error) {
      console.error("Restore purchases error:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases]);

  /**
   * Clear attempts for a specific game mode
   */
  const handleClearAttempts = useCallback(
    async (gameMode: string, displayName: string) => {
      Alert.alert(
        "Clear Attempts",
        `Delete all local attempts for ${displayName}? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const count = await deleteAttemptsByGameMode(gameMode);
                // Refresh local state so UI updates immediately (back to "Play" state)
                await refreshLocalPuzzles();
                Alert.alert(
                  "Success",
                  `Deleted ${count} ${displayName} attempts.`,
                );
              } catch (error) {
                Alert.alert("Error", "Failed to delete attempts.");
                console.error("Failed to delete attempts:", error);
              }
            },
          },
        ],
      );
    },
    [refreshLocalPuzzles],
  );

  /**
   * Send a test notification (5 seconds from now)
   */
  const handleTestNotification = useCallback(
    async (type: "morning" | "streak") => {
      try {
        // Check and request permission if needed
        let status = await getPermissionStatus();
        if (status !== "granted") {
          status = await requestPermissions();
          if (status !== "granted") {
            Alert.alert(
              "Notifications Disabled",
              "Please enable notifications in your device settings to test this feature.",
            );
            return;
          }
        }

        const triggerDate = new Date(Date.now() + 5000); // 5 seconds from now

        if (type === "morning") {
          const { title, body } = getMorningMessage();
          await scheduleNotification({
            id: "test_morning",
            title,
            body,
            triggerDate,
            priority: "default",
          });
          Alert.alert(
            "Test Scheduled",
            `Morning notification will appear in 5 seconds.\n\nTitle: "${title}"`,
          );
        } else {
          const { title, body } = getStreakSaverMessage(7);
          await scheduleNotification({
            id: "test_streak",
            title,
            body,
            triggerDate,
            priority: "high",
          });
          Alert.alert(
            "Test Scheduled",
            `Streak saver notification will appear in 5 seconds.\n\nTitle: "${title}"`,
          );
        }
      } catch (error) {
        Alert.alert(
          "Error",
          "Failed to schedule test notification. Make sure notifications are enabled.",
        );
        console.error("Test notification error:", error);
      }
    },
    [],
  );

  /**
   * Reset all onboarding intro screens
   */
  const handleResetAllIntros = useCallback(async () => {
    Alert.alert(
      "Reset Intros",
      'Reset all game intro screens? You will see the "Pre-Match Briefing" again for each game.',
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            try {
              await resetAllIntros();
              Alert.alert(
                "Success",
                "All intro screens have been reset. You will see them again when entering each game.",
              );
            } catch (error) {
              Alert.alert("Error", "Failed to reset intro screens.");
              console.error("Failed to reset intros:", error);
            }
          },
        },
      ],
    );
  }, [resetAllIntros]);

  /**
   * Handle Privacy Policy row press - opens external URL
   */
  const handlePrivacyPress = useCallback(() => {
    Linking.openURL("https://football-iq.app/privacy");
  }, []);

  /**
   * Handle Terms of Service row press - opens external URL
   */
  const handleTermsPress = useCallback(() => {
    Linking.openURL("https://football-iq.app/terms");
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
  const closeRateModal = useCallback(() => {
    setRateModalVisible(false);
  }, []);

  /**
   * Handle Delete My Data - removes all user data from Supabase and local storage
   */
  const handleDeleteData = useCallback(() => {
    Alert.alert(
      "Delete My Data",
      "This will permanently delete all your data including:\n\n• Your profile\n• All puzzle attempts\n• All streaks\n• Local app data\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            // Second confirmation
            Alert.alert(
              "Are you sure?",
              "All your progress will be lost forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      // 1. Delete from Supabase (if authenticated)
                      const userId = session?.user?.id;
                      if (userId) {
                        await supabase
                          .from("puzzle_attempts")
                          .delete()
                          .eq("user_id", userId);
                        await supabase
                          .from("user_streaks")
                          .delete()
                          .eq("user_id", userId);
                        await supabase
                          .from("profiles")
                          .delete()
                          .eq("id", userId);
                      }

                      // 2. Clear local SQLite database
                      await clearAllLocalData();

                      // 3. Clear AsyncStorage
                      await AsyncStorage.clear();

                      // 4. Sign out (will auto-create new anonymous account)
                      await signOut();

                      // 5. Restore any purchases tied to this device's App Store account
                      // This preserves Pro status even after data deletion
                      if (Platform.OS !== "web") {
                        // Small delay to let auth re-initialize with new anonymous account
                        setTimeout(async () => {
                          try {
                            await Purchases.restorePurchases();
                            await forceSync();
                            console.log(
                              "[Settings] Purchases restored after data deletion",
                            );
                          } catch (restoreError) {
                            // Not an error if no purchases to restore
                            console.log(
                              "[Settings] No purchases to restore:",
                              restoreError,
                            );
                          }
                        }, 1500);
                      }

                      Alert.alert(
                        "Data Deleted",
                        "All your data has been deleted.",
                      );
                    } catch (error) {
                      console.error("Failed to delete data:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete some data. Please try again.",
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }, [session, signOut, forceSync]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        {/* Subscription Section */}
        <SettingsSection title="Subscription">
          <SettingsRow
            icon={
              <RotateCcw size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label={isRestoring ? "Restoring..." : "Restore Purchases"}
            onPress={handleRestorePurchases}
            testID={testID ? `${testID}-restore-purchases-row` : undefined}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <View
            style={styles.toggleRow}
            testID={testID ? `${testID}-notif-toggle` : undefined}
          >
            <View style={styles.toggleIconContainer}>
              {notificationsEnabled ? (
                <Bell size={20} color={colors.pitchGreen} strokeWidth={2} />
              ) : (
                <BellOff
                  size={20}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              )}
            </View>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{
                false: colors.glassBorder,
                true: colors.pitchGreen,
              }}
              thumbColor={colors.floodlightWhite}
            />
          </View>
        </SettingsSection>

        {/* Legal Section */}
        <SettingsSection title="Legal">
          <SettingsRow
            icon={
              <Shield size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label="Privacy Policy"
            onPress={handlePrivacyPress}
            testID={testID ? `${testID}-privacy-row` : undefined}
          />
          <SettingsRow
            icon={
              <FileText size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
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

        {/* Community Section */}
        <SettingsSection title="Community">
          <SettingsRow
            icon={
              <Lightbulb size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label="Submit Game Idea"
            onPress={() => router.push("/submit-idea")}
            testID={testID ? `${testID}-submit-idea-row` : undefined}
          />
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection title="Data">
          <SettingsRow
            icon={<UserX size={20} color={colors.redCard} strokeWidth={2} />}
            label="Delete My Data"
            onPress={handleDeleteData}
            testID={testID ? `${testID}-delete-data-row` : undefined}
          />
        </SettingsSection>

        {/* Developer Section (hidden until activated) */}
        {devModeEnabled && (
          <SettingsSection title="Developer">
            <View
              style={styles.toggleRow}
              testID={testID ? `${testID}-sound-toggle` : undefined}
            >
              <View style={styles.toggleIconContainer}>
                {soundEnabled ? (
                  <Volume2
                    size={20}
                    color={colors.pitchGreen}
                    strokeWidth={2}
                  />
                ) : (
                  <VolumeX
                    size={20}
                    color={colors.textSecondary}
                    strokeWidth={2}
                  />
                )}
              </View>
              <Text style={styles.toggleLabel}>Sound Effects</Text>
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{
                  false: colors.glassBorder,
                  true: colors.pitchGreen,
                }}
                thumbColor={colors.floodlightWhite}
              />
            </View>
            <SettingsRow
              icon={
                <Bell size={20} color={colors.pitchGreen} strokeWidth={2} />
              }
              label="Test Morning Notification"
              onPress={() => handleTestNotification("morning")}
              testID={testID ? `${testID}-test-morning-notif` : undefined}
            />
            <SettingsRow
              icon={
                <Bell size={20} color={colors.cardYellow} strokeWidth={2} />
              }
              label="Test Streak Saver Notification"
              onPress={() => handleTestNotification("streak")}
              testID={testID ? `${testID}-test-streak-notif` : undefined}
            />
            <SettingsRow
              icon={
                <RotateCcw
                  size={20}
                  color={colors.pitchGreen}
                  strokeWidth={2}
                />
              }
              label="Reset All Game Intros"
              onPress={handleResetAllIntros}
              testID={testID ? `${testID}-reset-intros` : undefined}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Goalscorer Recall Data"
              onPress={() =>
                handleClearAttempts(
                  "guess_the_goalscorers",
                  "Goalscorer Recall",
                )
              }
              testID={testID ? `${testID}-clear-goalscorer-row` : undefined}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Career Path Data"
              onPress={() => handleClearAttempts("career_path", "Career Path")}
              testID={testID ? `${testID}-clear-career-row` : undefined}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} strokeWidth={2} />}
              label="Clear Transfer Guess Data"
              onPress={() =>
                handleClearAttempts("guess_the_transfer", "Transfer Guess")
              }
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
    paddingBottom: spacing["3xl"],
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing["2xl"],
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  toggleIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...textStyles.body,
    color: colors.floodlightWhite,
    flex: 1,
  },
});
