/**
 * SettingsScreen
 *
 * Main settings screen with Privacy Policy, Terms, and Rate App.
 * Redesigned with "Manager's Office" aesthetic.
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
  Bell,
  RotateCcw,
  UserX,
  Lightbulb,
  Trash2,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import Purchases from "react-native-purchases";
import { colors, textStyles, spacing, borderRadius } from "@/theme";
import { deleteAttemptsByGameMode, clearAllLocalData } from "@/lib/database";
import { useAuth, useSubscriptionSync } from "@/features/auth";
import { useProfile } from "@/features/auth/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  scheduleNotification,
  getMorningMessage,
  getStreakSaverMessage,
  getPermissionStatus,
  requestPermissions,
} from "@/features/notifications";
import { useOnboardingContext, usePuzzleContext } from "@/features/puzzles";
import { getTierForPoints } from "@/features/stats/utils/tierProgression";
import { SettingsRow } from "../components/SettingsRow";
import { SettingsSection } from "../components/SettingsSection";
import { RateAppModal } from "../components/RateAppModal";
import { PremiumUpsellBanner } from "@/features/ads/components/PremiumUpsellBanner";

export interface SettingsScreenProps {
  testID?: string;
}

export function SettingsScreen({ testID }: SettingsScreenProps) {
  const router = useRouter();

  // Modal visibility states
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dev mode state
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

  // Auth context
  const { session, signOut, totalIQ } = useAuth();

  // Profile & Stats data for Header
  const { profile } = useProfile(session?.user?.id ?? null);

  // Calculate Rank
  const rank = getTierForPoints(totalIQ).name;

  // Subscription sync
  const { forceSync, restorePurchases } = useSubscriptionSync();
  const [isRestoring, setIsRestoring] = useState(false);

  // Onboarding & Puzzle context
  const { resetAllIntros } = useOnboardingContext();
  const { refreshLocalPuzzles } = usePuzzleContext();

  // Notifications
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

  // Sound effects
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

  // App version
  const appVersion = Constants.expoConfig?.version ?? "2.2.0";

  /**
   * Handle version text tap for secret dev menu
   */
  const handleVersionTap = useCallback(() => {
    const now = Date.now();
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
        Alert.alert("Error", "Failed to restore purchases. Please try again.");
      }
    } catch (error) {
      console.error("Restore purchases error:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, restorePurchases]);

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
                await refreshLocalPuzzles();
                Alert.alert(
                  "Success",
                  `Deleted ${count} ${displayName} attempts.`,
                );
              } catch (error) {
                Alert.alert("Error", "Failed to delete attempts.");
              }
            },
          },
        ],
      );
    },
    [refreshLocalPuzzles],
  );

  const handleTestNotification = useCallback(
    async (type: "morning" | "streak") => {
      try {
        let status = await getPermissionStatus();
        if (status !== "granted") {
          status = await requestPermissions();
          if (status !== "granted") {
            Alert.alert(
              "Notifications Disabled",
              "Please enable notifications.",
            );
            return;
          }
        }
        const triggerDate = new Date(Date.now() + 5000);
        if (type === "morning") {
          const { title, body } = getMorningMessage();
          await scheduleNotification({
            id: "test_morning",
            title,
            body,
            triggerDate,
            priority: "default",
          });
          Alert.alert("Test Scheduled", "Morning notification in 5s.");
        } else {
          const { title, body } = getStreakSaverMessage(7);
          await scheduleNotification({
            id: "test_streak",
            title,
            body,
            triggerDate,
            priority: "high",
          });
          Alert.alert("Test Scheduled", "Streak saver notification in 5s.");
        }
      } catch (error) {
        console.error("Test notification error:", error);
      }
    },
    [],
  );

  const handleResetAllIntros = useCallback(async () => {
    Alert.alert("Reset Intros", "Reset all game intro screens?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          await resetAllIntros();
          Alert.alert("Success", "Intro screens reset.");
        },
      },
    ]);
  }, [resetAllIntros]);

  const handleDeleteData = useCallback(() => {
    Alert.alert(
      "Delete My Data",
      "Permanently delete all data? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: () => {
            Alert.alert("Are you sure?", "All progress will be lost.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, Delete",
                style: "destructive",
                onPress: async () => {
                  setIsDeleting(true);
                  try {
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
                      await supabase.from("profiles").delete().eq("id", userId);
                    }
                    await clearAllLocalData();
                    await AsyncStorage.clear();
                    await signOut();
                    if (Platform.OS !== "web") {
                      setTimeout(async () => {
                        try {
                          await Purchases.restorePurchases();
                          await forceSync();
                        } catch (e) {
                          console.log(e);
                        }
                      }, 1500);
                    }
                    Alert.alert(
                      "Data Deleted",
                      "All your data has been deleted.",
                    );
                  } catch (error) {
                    Alert.alert("Error", "Failed to delete data.");
                  } finally {
                    setIsDeleting(false);
                  }
                },
              },
            ]);
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
          SETTINGS
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {/* Placeholder Avatar */}
            <Text style={styles.avatarText}>
              {profile?.display_name?.charAt(0).toUpperCase() ?? "G"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.display_name || "Guest Manager"}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{rank}</Text>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        <PremiumUpsellBanner fullWidth />

        {/* Subscription */}
        <SettingsSection title="SUBSCRIPTION">
          <SettingsRow
            icon={
              <RotateCcw size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label={isRestoring ? "Restoring..." : "Restore Purchases"}
            onPress={handleRestorePurchases}
            testID={testID ? `${testID}-restore-purchases-row` : undefined}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="NOTIFICATIONS">
          <View style={styles.toggleRow}>
            <View style={styles.toggleIconContainer}>
              <Bell size={20} color={colors.pitchGreen} strokeWidth={2} />
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

        {/* Legal */}
        <SettingsSection title="LEGAL">
          <SettingsRow
            icon={
              <Shield size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label="Privacy Policy"
            onPress={() => Linking.openURL("https://football-iq.app/privacy")}
            testID={testID ? `${testID}-privacy-row` : undefined}
          />
          <SettingsRow
            icon={
              <FileText size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label="Terms of Service"
            onPress={() => Linking.openURL("https://football-iq.app/terms")}
            testID={testID ? `${testID}-terms-row` : undefined}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="SUPPORT">
          <SettingsRow
            icon={<Star size={20} color={colors.cardYellow} strokeWidth={2} />}
            label="Rate App"
            onPress={async () => {
              const isAvailable = await StoreReview.isAvailableAsync();
              if (isAvailable) {
                await StoreReview.requestReview();
              } else {
                setRateModalVisible(true);
              }
            }}
            testID={testID ? `${testID}-rate-row` : undefined}
          />
        </SettingsSection>

        {/* Community */}
        <SettingsSection title="COMMUNITY">
          <SettingsRow
            icon={
              <Lightbulb size={20} color={colors.pitchGreen} strokeWidth={2} />
            }
            label="Submit Game Idea"
            onPress={() => router.push("/submit-idea")}
            testID={testID ? `${testID}-submit-idea-row` : undefined}
          />
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="DATA">
          <SettingsRow
            icon={<UserX size={20} color={colors.redCard} strokeWidth={2} />}
            label="Delete My Data"
            onPress={handleDeleteData}
            testID={testID ? `${testID}-delete-data-row` : undefined}
          />
        </SettingsSection>

        {/* Developer Items */}
        {devModeEnabled && (
          <SettingsSection title="DEVELOPER">
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { marginLeft: 0 }]}>
                Sound Effects
              </Text>
              <Switch
                value={soundEnabled}
                onValueChange={handleToggleSound}
                trackColor={{
                  false: colors.glassBorder,
                  true: colors.pitchGreen,
                }}
              />
            </View>
            <SettingsRow
              icon={<Bell size={20} color={colors.pitchGreen} />}
              label="Test Morning Notif"
              onPress={() => handleTestNotification("morning")}
            />
            <SettingsRow
              icon={<Bell size={20} color={colors.cardYellow} />}
              label="Test Streak Notif"
              onPress={() => handleTestNotification("streak")}
            />
            <SettingsRow
              icon={<RotateCcw size={20} color={colors.pitchGreen} />}
              label="Reset Intros"
              onPress={handleResetAllIntros}
            />
            <SettingsRow
              icon={<Trash2 size={20} color={colors.redCard} />}
              label="Clear Top Tens Data"
              onPress={() => handleClearAttempts("top_tens", "Top Tens")}
            />
          </SettingsSection>
        )}

        {/* Footer */}
        <Pressable style={styles.footer} onPress={handleVersionTap}>
          <Text style={styles.versionText}>Version {appVersion}</Text>
          <Text style={styles.copyrightText}>
            Football IQ {new Date().getFullYear()}
          </Text>
        </Pressable>
      </ScrollView>

      <RateAppModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
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
    fontFamily: "BebasNeue-Regular",
    fontSize: 40,
    color: colors.floodlightWhite,
    includeFontPadding: false,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: borderRadius.lg, // 12
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(88, 204, 2, 0.5)",
    marginRight: spacing.lg,
  },
  avatarText: {
    fontFamily: "BebasNeue-Regular",
    fontSize: 24,
    color: colors.floodlightWhite,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: "BebasNeue-Regular",
    fontSize: 24,
    color: colors.floodlightWhite,
    marginBottom: 4,
  },
  badgeContainer: {
    backgroundColor: "rgba(88, 204, 2, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(88, 204, 2, 0.3)",
    alignSelf: "flex-start",
  },
  badgeText: {
    color: colors.pitchGreen,
    fontSize: 10,
    fontFamily: "Montserrat",
    fontWeight: "700",
    textTransform: "uppercase",
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
  footer: {
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  versionText: {
    fontFamily: "Montserrat",
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontFamily: "Montserrat",
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.6,
  },
});
