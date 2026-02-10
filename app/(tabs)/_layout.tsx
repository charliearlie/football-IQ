import { View, StyleSheet, Platform } from "react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useHaptics } from "@/hooks/useHaptics";
import { AdBanner } from "@/features/ads";
import { colors } from "@/theme";

const isLiquidGlass =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

/**
 * Tab Navigator Layout — Native Tabs with Liquid Glass
 *
 * Uses the system-native tab bar via NativeTabs:
 * - iOS 26: Liquid Glass translucent tab bar with auto-hide on scroll
 * - Android: Material 3 native tab bar
 *
 * SF Symbols for iOS, Material icon names for Android.
 * AdBanner rendered below the tab bar as a standard full-width banner.
 */
export default function TabLayout() {
  const { triggerSelection } = useHaptics();

  return (
    <View style={styles.container}>
      <NativeTabs
        minimizeBehavior="onScrollDown"
        backgroundColor={isLiquidGlass ? undefined : colors.stadiumNavy}
        blurEffect={isLiquidGlass ? "systemMaterial" : "none"}
        disableTransparentOnScrollEdge={!isLiquidGlass}
        iconColor={{
          selected: colors.pitchGreen,
          default: colors.floodlightWhite,
        }}
        labelStyle={{
          selected: { color: colors.pitchGreen },
          default: { color: colors.floodlightWhite },
        }}
        screenListeners={{
          tabPress: () => triggerSelection(),
        }}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="archive">
          <NativeTabs.Trigger.Label>Archive</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="archivebox.fill" md="archive" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="stats">
          <NativeTabs.Trigger.Label>My IQ</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="brain.head.profile" md="psychology" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        </NativeTabs.Trigger>
      </NativeTabs>

      {/* Global banner ad — below tab bar, above home indicator */}
      <AdBanner testID="global-banner-ad" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
});
