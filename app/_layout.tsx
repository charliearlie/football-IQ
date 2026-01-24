// Sentry must be imported first for proper instrumentation
import * as Sentry from "@sentry/react-native";

import { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDatabase } from "@/lib/database";
import { Stack } from "expo-router";
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
import { PostHogProvider } from "posthog-react-native";

// Initialize Sentry error monitoring
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 1.0,
  debug: __DEV__,
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
 * AuthGate - Blocks navigation until auth is initialized
 *
 * Shows loading screen while auth state is being established,
 * and displays the FirstRunModal (Briefing) if:
 * - User needs to set display name, OR
 * - User hasn't completed onboarding (AsyncStorage check)
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading, profile, updateDisplayName } = useAuth();
  const [onboardingHydrated, setOnboardingHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const isMounted = useRef(true);

  // Hydrate onboarding state from AsyncStorage
  useEffect(() => {
    isMounted.current = true;

    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((value) => {
        if (isMounted.current) {
          setHasCompletedOnboarding(value === "true");
          setOnboardingHydrated(true);
        }
      })
      .catch(() => {
        if (isMounted.current) {
          setHasCompletedOnboarding(false);
          setOnboardingHydrated(true);
        }
      });

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Determine if user needs to set display name
  const needsDisplayName = profile && !profile.display_name;

  // Show briefing if display name is missing AND onboarding not completed
  // hasCompletedOnboarding takes precedence - once set true in onSubmit callback,
  // modal hides immediately even before profile refetch completes
  const showBriefing = !hasCompletedOnboarding && needsDisplayName;

  // Block navigation until auth is initialized AND onboarding state is hydrated
  if (!isInitialized || isLoading || !onboardingHydrated) {
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
                <PuzzleToastRenderer />
                <FirstRunModal
                  visible={showBriefing}
                  onSubmit={async (displayName) => {
                    // Set state and persist FIRST to hide modal immediately
                    setHasCompletedOnboarding(true);
                    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");

                    // Then update display name in Supabase
                    const { error } = await updateDisplayName(displayName);
                    if (error) throw error;
                  }}
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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!dbReady || !rcReady || !adsReady) {
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
          captureScreens: false,
        }}
      >
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
