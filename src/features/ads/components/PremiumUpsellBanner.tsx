import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth";
import { colors, spacing, borderRadius } from "@/theme";
import { ProBadge } from "@/components/ProBadge/ProBadge";

export function PremiumUpsellBanner({ testID, fullWidth = false }: { testID?: string; fullWidth?: boolean }) {
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
      style={[styles.wrapper, fullWidth && styles.fullWidthWrapper]}
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          fullWidth && styles.fullWidthContainer,
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
            hitSlop={8}
            testID={`${testID || 'premium-banner'}-close`}
          >
            <X size={18} color="#000000" strokeWidth={2.5} />
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
  fullWidthWrapper: {
    marginHorizontal: 0,
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
  fullWidthContainer: {
    // Keep border radius even when full width (relative to parent)
  },
  gradient: {
    padding: spacing.lg, // 16
    minHeight: 80,
    justifyContent: "center",
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    left: "50%",
    transform: [{ skewX: "-20deg" }],
  },
  closeButton: {
    position: "absolute",
    top: 4,
    right: 8,
    zIndex: 20, // Higher z-index to ensure it sits on top but doesn't capture touches outside its bounds unnecessarily if we control hitSlop
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
