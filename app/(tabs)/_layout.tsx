import { Tabs } from 'expo-router';
import { Home, Archive, Brain, Settings } from 'lucide-react-native';
import { colors, fonts } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation with 4 tabs: Home, Archive, My IQ, Settings.
 * Uses lucide-react-native icons with 2px stroke for bold look.
 * Includes haptic feedback on tab press.
 */
export default function TabLayout() {
  const { triggerSelection } = useHaptics();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => triggerSelection(),
      }}
      screenOptions={{
        tabBarActiveTintColor: colors.pitchGreen,
        tabBarInactiveTintColor: colors.floodlightWhite,
        tabBarStyle: {
          backgroundColor: colors.stadiumNavy,
          borderTopColor: colors.glassBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 12,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.stadiumNavy,
        },
        headerTintColor: colors.floodlightWhite,
        headerTitleStyle: {
          fontFamily: fonts.headline,
          fontSize: 24,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'Archive',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Archive color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'My IQ',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Brain color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
