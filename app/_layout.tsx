// Sentry must be imported first for proper instrumentation
import * as Sentry from "@sentry/react-native";

import { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDatabase } from "@/lib/database";
import { Stack, usePathname, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { colors, fonts } from "@/theme";
import {
  AuthProvider,
  useAuth,
  AuthLoadingScreen,
  FirstRunModal,
  SubscriptionSyncProvider,
  ONBOARDING_STORAGE_KEY,
  useOnboardingLock,
} from "@/features/auth";
import {
  PuzzleProvider,
  OnboardingProvider,
  usePuzzleContext,
} from "@/features/puzzles";
import { PuzzleUpdateToast } from "@/components/PuzzleUpdateToast";
import { AdProvider } from "@/features/ads";
import { QuizPrefetchProvider } from "@/features/topical-quiz";
import { IntegrityGuardProvider } from "@/features/integrity";
import {
  NotificationWrapper,
  initializeNotifications,
} from "@/features/notifications";
import { getRevenueCatApiKey } from "@/config/revenueCat";
import { SentryErrorFallback } from "@/components";
import { PostHogProvider, usePostHog } from "posthog-react-native";

// Initialize Sentry error monitoring
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 1.0,
});

// Conditionally import MobileAds only on native platforms
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MobileAds: (() => { initialize: () => Promise<void> }) | null = null;
if (Platform.OS === "ios" || Platform.OS === "android") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require("react-native-google-mobile-ads");
    MobileAds = mobileAds.default;
  } catch {
    // Module not available
  }
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * PuzzleToastRenderer - Renders the puzzle update toast notification
 * Must be inside PuzzleProvider to access context.
 */
function PuzzleToastRenderer() {
  const { showUpdateToast, updatedPuzzleCount, dismissUpdateToast } =
    usePuzzleContext();

  return (
    <PuzzleUpdateToast
      visible={showUpdateToast}
      count={updatedPuzzleCount}
      onDismiss={dismissUpdateToast}
    />
  );
}

/**
 * PostHogLogger - Logs PostHog initialization status
 * Must be inside PostHogProvider to access context.
 */
function PostHogLogger() {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      console.log("[PostHog] SDK initialized successfully");
    }
  }, [posthog]);

  return null;
}

/**
 * PostHogScreenTracker - Tracks screen views for expo-router
 * Must be inside both PostHogProvider and navigation context.
 */
function PostHogScreenTracker() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    if (posthog && pathname) {
      // Create a readable screen name from segments
      const screenName = segments.length > 0 ? segments.join("/") : "index";
      posthog.screen(screenName, { pathname });
    }
  }, [posthog, pathname, segments]);

  return null;
}

/**
 * AuthGate - Blocks navigation until auth is initialized
 *
 * Shows loading screen while auth state is being established,
 * and displays the FirstRunModal (Briefing) if user needs onboarding.
 *
 * Uses the "onboarding lock" pattern to prevent race conditions:
 * Once the modal is shown, external state changes (like profile updates from
 * real-time subscriptions) cannot close it. Only explicit successful
 * submission can close the modal.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading, profile, updateDisplayName, user } = useAuth();
  const [onboardingHydrated, setOnboardingHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Hydrate onboarding state from AsyncStorage
  // Re-run when user changes (e.g., after data deletion and new account creation)
  useEffect(() => {
    isMounted.current = true;
    const STORAGE_TIMEOUT_MS = 5000;

    const loadOnboarding = async () => {
      try {
        const storagePromise = AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        const timeoutPromise = new Promise<string | null>((_, reject) =>
          setTimeout(() => reject(new Error("AsyncStorage timeout")), STORAGE_TIMEOUT_MS)
        );

        const value = await Promise.race([storagePromise, timeoutPromise]);

        if (isMounted.current) {
          setHasCompletedOnboarding(value === "true");
          setOnboardingHydrated(true);
        }
      } catch (error) {
        console.warn("[AuthGate] Onboarding load failed:", error);
        if (isMounted.current) {
          // Default to showing onboarding on error (safe fallback)
          setHasCompletedOnboarding(false);
          setOnboardingHydrated(true);
        }
      }
    };

    loadOnboarding();

    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  // Global timeout failsafe - prevent infinite loading under any circumstances
  useEffect(() => {
    const GLOBAL_TIMEOUT_MS = 15000;

    const timeout = setTimeout(() => {
      if (!isInitialized || isLoading || !onboardingHydrated) {
        console.error("[AuthGate] Global timeout - forcing app to proceed");
        Sentry.captureMessage("AuthGate global timeout triggered", "error");
        setLoadingTimedOut(true);
      }
    }, GLOBAL_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isInitialized, isLoading, onboardingHydrated]);

  // Determine if user needs to set display name
  const needsDisplayName = !profile?.display_name;

  // Use the onboarding lock hook to prevent race conditions
  // Once the modal is shown, it stays visible until explicitly completed
  const { isOnboardingActive, completeOnboarding } = useOnboardingLock({
    needsDisplayName,
    hasCompletedOnboarding,
    isHydrated: onboardingHydrated,
  });

  // Atomic submission handler - only closes modal after ALL operations succeed
  const handleOnboardingSubmit = useCallback(async (displayName: string) => {
    setSubmissionError(null);

    try {
      // Step 1: Update display name in Supabase FIRST (critical operation)
      const { error } = await updateDisplayName(displayName);

      if (error) {
        // Don't close modal on error - let user retry
        console.error("[AuthGate] Failed to save display name:", error);
        setSubmissionError("Failed to save. Please try again.");
        throw error;
      }

      // Step 2: Only after Supabase succeeds, persist to AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      setHasCompletedOnboarding(true);

      // Step 3: Unlock the modal (this will hide it)
      completeOnboarding();

    } catch (error) {
      // Error already handled above - re-throw for BriefingScreen to handle
      throw error;
    }
  }, [updateDisplayName, completeOnboarding]);

  // Block navigation until auth is initialized AND onboarding state is hydrated
  // Allow proceeding if global timeout triggered (failsafe)
  if (!loadingTimedOut && (!isInitialized || isLoading || !onboardingHydrated)) {
    return <AuthLoadingScreen testID="auth-loading" />;
  }

  return (
    <IntegrityGuardProvider>
      <PuzzleProvider>
        <OnboardingProvider>
          <QuizPrefetchProvider>
            <AdProvider>
              <NotificationWrapper>
                {children}
                <PostHogScreenTracker />
                <PuzzleToastRenderer />
                <FirstRunModal
                  visible={isOnboardingActive}
                  onSubmit={handleOnboardingSubmit}
                  error={submissionError}
                  testID="first-run-modal"
                />
              </NotificationWrapper>
            </AdProvider>
          </QuizPrefetchProvider>
        </OnboardingProvider>
      </PuzzleProvider>
    </IntegrityGuardProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "BebasNeue-Regular": require("../assets/fonts/BebasNeue-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
  });
  const [dbReady, setDbReady] = useState(false);
  const [rcReady, setRcReady] = useState(false);
  const [adsReady, setAdsReady] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);

  // Global initialization timeout - prevents black screen if SDKs hang
  useEffect(() => {
    const INIT_TIMEOUT_MS = 10000; // 10 seconds max for initialization

    const timeout = setTimeout(() => {
      const fontsReady = fontsLoaded || fontError;
      if (!fontsReady || !dbReady || !rcReady || !adsReady) {
        console.error("[RootLayout] Initialization timeout - forcing app to proceed");
        Sentry.captureMessage("RootLayout initialization timeout", {
          level: "error",
          extra: {
            fontsLoaded,
            fontError: !!fontError,
            dbReady,
            rcReady,
            adsReady,
          },
        });
        setInitTimedOut(true);
      }
    }, INIT_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError, dbReady, rcReady, adsReady]);

  // Initialize local SQLite database
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.error("Database initialization failed:", error);
        // Continue in degraded mode - app can still work with network
        setDbReady(true);
      });
  }, []);

  // Initialize notification system (sets up notification handler)
  useEffect(() => {
    if (Platform.OS !== "web") {
      initializeNotifications().catch((error) => {
        console.error("[Notifications] Initialization failed:", error);
      });
    }
  }, []);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initRevenueCat = async () => {
      // Skip on web platform
      if (Platform.OS === "web") {
        setRcReady(true);
        return;
      }

      try {
        const apiKey = getRevenueCatApiKey();
        await Purchases.configure({ apiKey });
        console.log("[RevenueCat] SDK initialized successfully");
        setRcReady(true);
      } catch (error) {
        console.error("[RevenueCat] SDK initialization failed:", error);
        // Continue in degraded mode - purchases won't work but app functions
        setRcReady(true);
      }
    };
    initRevenueCat();
  }, []);

  // Initialize Google Mobile Ads SDK (with ATT on iOS)
  useEffect(() => {
    const initMobileAds = async () => {
      // Skip on web or if module not available
      if (Platform.OS === "web" || !MobileAds) {
        setAdsReady(true);
        return;
      }

      try {
        // Request ATT permission on iOS BEFORE initializing ads
        // This ensures ad personalization status is known before ad requests
        if (Platform.OS === "ios") {
          // Wrap ATT request with timeout - response should be instant after user taps,
          // but if promise hangs (known issue when denying), continue after 3s
          const attPromise = requestTrackingPermissionsAsync();
          const timeoutPromise = new Promise<{ status: string }>((_, reject) =>
            setTimeout(() => reject(new Error("ATT request timed out")), 3000),
          );

          try {
            const { status } = await Promise.race([attPromise, timeoutPromise]);
            console.log("[ATT] Tracking permission status:", status);
          } catch (attError) {
            console.warn("[ATT] Request failed or timed out:", attError);
            // Continue without ATT - ads will work in non-personalized mode
          }
        }

        await MobileAds().initialize();
        console.log("[MobileAds] SDK initialized successfully");
        setAdsReady(true);
      } catch (error) {
        console.error("[MobileAds] SDK initialization failed:", error);
        // Continue in degraded mode - ads won't work but app functions
        setAdsReady(true);
      }
    };
    initMobileAds();
  }, []);

  // Hide splash screen when fonts, database, RevenueCat, and ads are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady && rcReady && adsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady, rcReady, adsReady]);

  // Show nothing (splash screen visible) while initializing
  // But if timeout triggers, proceed anyway to prevent black screen
  const fontsReady = fontsLoaded || fontError;
  const sdksReady = dbReady && rcReady && adsReady;

  if (!initTimedOut && !fontsReady) {
    return null;
  }

  if (!initTimedOut && !sdksReady) {
    return null;
  }

  return (
    <AuthProvider>
      <PostHogProvider
        apiKey="phc_u3vrkbSBmnx9m6bDDInC3XsFrnETkRAnNgO3iVLDWLE"
        options={{
          host: "https://eu.i.posthog.com",
        }}
        autocapture={{
          captureScreens: false, // Manual tracking required for expo-router
        }}
      >
        <PostHogLogger />
        <SubscriptionSyncProvider>
          <GestureHandlerRootView style={styles.container}>
            <AuthGate>
              <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
                <View style={styles.container}>
                  <Stack
                    screenOptions={{
                      headerStyle: { backgroundColor: colors.stadiumNavy },
                      headerTintColor: colors.floodlightWhite,
                      headerTitleStyle: { fontFamily: fonts.headline },
                      contentStyle: { backgroundColor: colors.stadiumNavy },
                    }}
                  >
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="premium-modal"
                      options={{
                        presentation: "formSheet",
                        headerShown: false,
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="design-lab"
                      options={{
                        title: "Design Lab",
                        presentation: "modal",
                      }}
                    />
                    <Stack.Screen
                      name="submit-idea"
                      options={{
                        title: "Submit Idea",
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="light" />
                </View>
              </Sentry.ErrorBoundary>
            </AuthGate>
          </GestureHandlerRootView>
        </SubscriptionSyncProvider>
      </PostHogProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
