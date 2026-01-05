import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { initDatabase } from '@/lib/database';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Purchases from 'react-native-purchases';
import { colors } from '@/theme';
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
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);
  const [rcReady, setRcReady] = useState(false);

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

  // Hide splash screen when fonts, database, and RevenueCat are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady && rcReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, dbReady, rcReady]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (!dbReady || !rcReady) {
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
                  headerTitleStyle: { fontFamily: 'BebasNeue-Regular' },
                  contentStyle: { backgroundColor: colors.stadiumNavy },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
