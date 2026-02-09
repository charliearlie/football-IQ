import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth";
import { colors, textStyles, spacing, borderRadius } from "@/theme";
import { ProBadge } from "@/components/ProBadge/ProBadge";

export function PremiumUpsellBanner({ testID }: { testID?: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show for premium users or if dismissed
  if (profile?.is_premium || isDismissed) {
    return null;
  }

  const handlePress = () => {
    router.push({
      pathname: "/premium-modal",
      params: { mode: "upsell" },
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(300)}
      style={styles.wrapper}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={["#FACC15", "#EAB308"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {/* Subtle texture overlay */}
          <View style={styles.textureOverlay} />

          {/* Close Button */}
          <Pressable 
            onPress={handleDismiss} 
            style={styles.closeButton}
            hitSlop={12}
            testID={`${testID || 'premium-banner'}-close`}
          >
            <X size={16} color={colors.stadiumNavy} strokeWidth={2.5} style={{ opacity: 0.6 }} />
          </Pressable>
          
          <View style={styles.contentContainer}>
            {/* Left Content */}
            <View style={styles.leftContent}>
              <View style={styles.headerRow}>
                <ProBadge size={20} color={colors.stadiumNavy} />
                <Text style={styles.headerText}>GO PRO</Text>
              </View>
              <Text style={styles.subtext}>
                Unlock the full archive & remove ads.
              </Text>
            </View>

            {/* Right Button Visual */}
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>UPGRADE</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  container: {
    borderRadius: borderRadius.lg, // 12
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#FACC15",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradient: {
    padding: spacing.lg, // 16
    minHeight: 80,
    justifyContent: "center",
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    // Simple texture effect using a rotated view or just noise if we had an image
    // For now, just a subtle overlay on the right
    left: "50%",
    transform: [{ skewX: "-20deg" }],
  },
  closeButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    padding: 4,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  headerText: {
    fontFamily: "BebasNeue-Regular",
    fontSize: 24,
    color: colors.stadiumNavy,
    includeFontPadding: false,
    marginBottom: -4, // Adjustment for Bebas line height
  },
  subtext: {
    fontFamily: "Montserrat",
    fontSize: 12,
    fontWeight: "600",
    color: colors.stadiumNavy,
    opacity: 0.9,
  },
  actionButton: {
    backgroundColor: colors.stadiumNavy,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontFamily: "BebasNeue-Regular",
    fontSize: 14,
    color: colors.floodlightWhite,
    letterSpacing: 0.5,
  },
});
