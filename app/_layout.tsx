// Sentry temporarily disabled for testing
// import * as Sentry from "@sentry/react-native";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { initDatabase } from "@/lib/database";
import { syncEliteIndex } from "@/services/player/SyncService";
import { Stack, usePathname, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import { colors, fonts } from "@/theme";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import {
  AuthProvider,
  AuthLoadingScreen,
  SubscriptionSyncProvider,
  OnboardingProvider as AuthOnboardingProvider,
  useOnboarding,
  useAuth,
} from "@/features/auth";
import {
  PuzzleProvider,
  OnboardingProvider as PuzzleOnboardingProvider,
  usePuzzleContext,
} from "@/features/puzzles";
import { PuzzleUpdateToast } from "@/components/PuzzleUpdateToast";
import { AdProvider } from "@/features/ads";
import { QuizPrefetchProvider } from "@/features/topical-quiz";
import { IntegrityGuardProvider, RehydrationProvider } from "@/features/integrity";
import {
  NotificationWrapper,
  initializeNotifications,
} from "@/features/notifications";
import { getRevenueCatApiKey } from "@/config/revenueCat";
// import { SentryErrorFallback } from "@/components";
import { usePostHog } from "posthog-react-native";
import { SafePostHogProvider } from "@/components/SafePostHogProvider";

// Initialize Sentry error monitoring
// TEMPORARILY DISABLED - testing if Sentry is causing crash
// Sentry.init({
//   dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
//   enabled: !__DEV__,
//   tracesSampleRate: 1.0,
// });

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
 * PostHogIdentifier - Identifies users with person properties.
 * Must be inside both AuthProvider and PostHogProvider.
 */
function PostHogIdentifier() {
  const posthog = usePostHog();
  const { user, profile, isAnonymous } = useAuth();

  useEffect(() => {
    if (!posthog) return;

    if (user?.id) {
      posthog.identify(user.id, {
        is_premium: profile?.is_premium ?? false,
        is_anonymous: isAnonymous,
        display_name: profile?.display_name ?? null,
      });
    } else {
      posthog.reset();
    }
  }, [posthog, user?.id, profile?.is_premium, profile?.display_name, isAnonymous]);

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

/** Signals that app content has mounted (AuthGate finished loading). */
function ContentReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, []);
  return null;
}

const AuthGate = React.memo(function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading: isOnboardingLoading } = useOnboarding();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const attRequested = useRef(false); // Prevent duplicate ATT requests

  // Global timeout failsafe - prevent infinite loading under any circumstances
  useEffect(() => {
    const GLOBAL_TIMEOUT_MS = 15000;

    const timeout = setTimeout(() => {
      // Use the new consolidated loading state
      if (isOnboardingLoading) {
        console.error("[AuthGate] Global timeout - forcing app to proceed");
        setLoadingTimedOut(true);
      }
    }, GLOBAL_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isOnboardingLoading]);

  // ATT Request - runs AFTER app is fully loaded (non-blocking, delayed)
  // This is separate from SDK initialization to avoid race conditions
  useEffect(() => {
    // Only proceed once we're past the loading gate
    if (isOnboardingLoading && !loadingTimedOut) return;
    // Only on iOS
    if (Platform.OS !== "ios") return;
    // Only request once per app session
    if (attRequested.current) return;
    attRequested.current = true;

    // Delay ATT request to ensure UI is stable
    const timeoutId = setTimeout(async () => {
      try {
        const { status } = await getTrackingPermissionsAsync();
        if (status === "undetermined") {
          // Only request if not yet determined
          const { status: newStatus } = await requestTrackingPermissionsAsync();
          console.log("[ATT] Permission requested, status:", newStatus);
        } else {
          console.log("[ATT] Already determined:", status);
        }
      } catch (error) {
        console.warn("[ATT] Request failed:", error);
        // Non-fatal - app continues normally
      }
    }, 1000); // 1 second delay ensures app is stable

    return () => clearTimeout(timeoutId);
  }, [isOnboardingLoading, loadingTimedOut]);

  // Block navigation until auth is initialized AND onboarding state is hydrated
  // Allow proceeding if global timeout triggered (failsafe)
  if (!loadingTimedOut && isOnboardingLoading) {
    return <AuthLoadingScreen testID="auth-loading" />;
  }

  return (
    <IntegrityGuardProvider>
      <RehydrationProvider>
        <PuzzleProvider>
          <PuzzleOnboardingProvider>
          <QuizPrefetchProvider>
            <AdProvider>
              <NotificationWrapper>
                {children}
                <PostHogScreenTracker />
                <PuzzleToastRenderer />
              </NotificationWrapper>
            </AdProvider>
          </QuizPrefetchProvider>
        </PuzzleOnboardingProvider>
      </PuzzleProvider>
      </RehydrationProvider>
    </IntegrityGuardProvider>
  );
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "BebasNeue-Regular": require("../assets/fonts/BebasNeue-Regular.ttf"),
    Montserrat: require("../assets/fonts/Montserrat-VariableFont_wght.ttf"),
  });
  const [dbReady, setDbReady] = useState(false);
  const [initTimedOut, setInitTimedOut] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // Global initialization timeout - prevents black screen if fonts/DB hang
  // Only gates on fonts + DB (RC and Ads init in background, not blocking splash)
  useEffect(() => {
    const INIT_TIMEOUT_MS = 5000; // 5 seconds max (fonts + DB should be <500ms)

    const timeout = setTimeout(() => {
      const fontsReady = fontsLoaded || fontError;
      if (!fontsReady || !dbReady) {
        console.error("[RootLayout] Initialization timeout - forcing app to proceed");
        setInitTimedOut(true);
      }
    }, INIT_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError, dbReady]);

  // Initialize local SQLite database
  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
        // Background: check for Elite Index updates (non-blocking, weekly throttle)
        syncEliteIndex().catch((err: unknown) =>
          console.warn("[EliteIndex] Background sync failed:", err)
        );
      })
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

  // SoundService initialization disabled until expo-av native module is linked.
  // Run `npx expo prebuild` and rebuild to enable.
  // See src/services/sound/SoundService.ts for the implementation.

  // Initialize RevenueCat SDK (background — not blocking splash)
  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      try {
        const apiKey = getRevenueCatApiKey();
        await Purchases.configure({ apiKey });
        console.log("[RevenueCat] SDK initialized successfully");
      } catch (error) {
        console.error("[RevenueCat] SDK initialization failed:", error);
      }
    })();
  }, []);

  // Initialize Google Mobile Ads SDK (background — not blocking splash)
  useEffect(() => {
    if (Platform.OS === "web" || !MobileAds) return;

    (async () => {
      try {
        await MobileAds().initialize();
        console.log("[MobileAds] SDK initialized successfully");
      } catch (error) {
        console.error("[MobileAds] SDK initialization failed:", error);
      }
    })();
  }, []);

  // Hide native splash when fonts + DB are ready (RC and Ads init in background)
  // Our AnimatedSplash component takes over from here with a branded animation
  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady]);

  const handleSplashAnimationComplete = useCallback(() => {
    setSplashAnimationComplete(true);
  }, []);

  const fontsReady = fontsLoaded || fontError;
  const coreReady = (fontsReady && dbReady) || initTimedOut;

  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "";
  const posthogEnabled = posthogApiKey.length > 0 && posthogHost.length > 0;

  if (!posthogEnabled && coreReady) {
    console.warn(
      "[PostHog] Missing environment variables — analytics disabled.",
      { apiKey: !!posthogApiKey, host: !!posthogHost }
    );
  }

  const appContent = (
    <SubscriptionSyncProvider>
      <AuthOnboardingProvider>
        <GestureHandlerRootView style={styles.container}>
          <AuthGate>
            <ContentReadySignal onReady={() => setContentReady(true)} />
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
                    presentation: "modal",
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
          </AuthGate>
        </GestureHandlerRootView>
      </AuthOnboardingProvider>
    </SubscriptionSyncProvider>
  );

  // AnimatedSplash renders at the top level — always visible from the first frame.
  // The full app tree only mounts once fonts + DB are ready, underneath the splash.
  // This eliminates any blank navy gap between native splash and animated splash.
  return (
    <View style={styles.container}>
      {coreReady && (
        <AuthProvider>
          {posthogEnabled ? (
            <SafePostHogProvider
              apiKey={posthogApiKey}
              options={{
                host: posthogHost,
                debug: __DEV__,
              }}
              autocapture={{
                captureScreens: false, // Manual tracking required for expo-router
              }}
            >
              <PostHogLogger />
              <PostHogIdentifier />
              {appContent}
            </SafePostHogProvider>
          ) : (
            appContent
          )}
        </AuthProvider>
      )}
      {!splashAnimationComplete && (
        <AnimatedSplash onComplete={handleSplashAnimationComplete} ready={contentReady} fontsReady={!!fontsReady} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
