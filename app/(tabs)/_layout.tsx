import { Tabs } from 'expo-router';
import { Home, Gamepad2, Archive, BarChart3 } from 'lucide-react-native';
import { colors } from '@/theme';

/**
 * Tab Navigator Layout
 *
 * Bottom tab navigation with 4 tabs: Home, Games, Archive, Stats.
 * Uses lucide-react-native icons with 2px stroke for bold look.
 */
export default function TabLayout() {
  return (
    <Tabs
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
          fontFamily: 'Inter-Regular',
          fontSize: 12,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.stadiumNavy,
        },
        headerTintColor: colors.floodlightWhite,
        headerTitleStyle: {
          fontFamily: 'BebasNeue-Regular',
          fontSize: 24,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, size }) => (
            <Gamepad2 color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'Archive',
          tabBarIcon: ({ color, size }) => (
            <Archive color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
