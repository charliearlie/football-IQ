import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { initDatabase } from '@/lib/database';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import { colors, fonts } from '@/theme';
import {
  AuthProvider,
  useAuth,
  AuthLoadingScreen,
  FirstRunModal,
  SubscriptionSyncProvider,
} from '@/features/auth';
import { PuzzleProvider } from '@/features/puzzles';
import { AdProvider } from '@/features/ads';
import { QuizPrefetchProvider } from '@/features/topical-quiz';
import { getRevenueCatApiKey } from '@/config/revenueCat';

// Conditionally import MobileAds only on native platforms
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MobileAds: (() => { initialize: () => Promise<void> }) | null = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mobileAds = require('react-native-google-mobile-ads');
    MobileAds = mobileAds.default;
  } catch {
    // Module not available
  }
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

/**
 * AuthGate - Blocks navigation until auth is initialized
 *
 * Shows loading screen while auth state is being established,
 * and displays the FirstRunModal if user needs to set display name.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading, profile, updateDisplayName } = useAuth();

  // Determine if user needs to set display name
  const needsDisplayName = profile && !profile.display_name;

  // Block navigation until auth is initialized
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen testID="auth-loading" />;
  }

  return (
    <PuzzleProvider>
      <QuizPrefetchProvider>
        <AdProvider>
          {children}
          <FirstRunModal
            visible={needsDisplayName ?? false}
            onSubmit={async (displayName) => {
              const { error } = await updateDisplayName(displayName);
              if (error) throw error;
            }}
            testID="first-run-modal"
          />
        </AdProvider>
      </QuizPrefetchProvider>
    </PuzzleProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
    Montserrat: require('../assets/fonts/Montserrat-VariableFont_wght.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);
  const [rcReady, setRcReady] = useState(false);
  const [adsReady, setAdsReady] = useState(false);

  // Initialize local SQLite database
  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((error) => {
        console.error('Database initialization failed:', error);
        // Continue in degraded mode - app can still work with network
        setDbReady(true);
      });
  }, []);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initRevenueCat = async () => {
      // Skip on web platform
      if (Platform.OS === 'web') {
        setRcReady(true);
        return;
      }

      try {
        const apiKey = getRevenueCatApiKey();
        await Purchases.configure({ apiKey });
        console.log('[RevenueCat] SDK initialized successfully');
        setRcReady(true);
      } catch (error) {
        console.error('[RevenueCat] SDK initialization failed:', error);
        // Continue in degraded mode - purchases won't work but app functions
        setRcReady(true);
      }
    };
    initRevenueCat();
  }, []);

  // Initialize Google Mobile Ads SDK
  useEffect(() => {
    const initMobileAds = async () => {
      // Skip on web or if module not available
      if (Platform.OS === 'web' || !MobileAds) {
        setAdsReady(true);
        return;
      }

      try {
        await MobileAds().initialize();
        console.log('[MobileAds] SDK initialized successfully');
        setAdsReady(true);
      } catch (error) {
        console.error('[MobileAds] SDK initialization failed:', error);
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
      <SubscriptionSyncProvider>
        <GestureHandlerRootView style={styles.container}>
          <AuthGate>
            <View style={styles.container}>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.stadiumNavy },
                  headerTintColor: colors.floodlightWhite,
                  headerTitleStyle: { fontFamily: fonts.headline },
                  contentStyle: { backgroundColor: colors.stadiumNavy },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="premium-modal"
                  options={{
                    presentation: 'formSheet',
                    headerShown: false,
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="design-lab"
                  options={{
                    title: 'Design Lab',
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="light" />
            </View>
          </AuthGate>
        </GestureHandlerRootView>
      </SubscriptionSyncProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
