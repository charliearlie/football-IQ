import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronRight, X, Crown, Sparkles } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAuth } from "@/features/auth";
import { HOME_COLORS, HOME_FONTS } from "@/theme/home-design";

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

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.container, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        testID={testID}
      >
        <LinearGradient
            colors={['rgba(250, 204, 21, 0.1)', 'rgba(15, 23, 42, 0.6)']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
             {/* Dismiss button - top right corner */}
            <Pressable
                onPress={(e) => {
                    e.stopPropagation();
                    setIsDismissed(true);
                }}
                style={styles.dismissButton}
                hitSlop={12}
            >
                <X size={14} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>

            {/* Icon Box */}
            <View style={styles.iconBox}>
                <Sparkles size={24} color={HOME_COLORS.stadiumNavy} fill={HOME_COLORS.stadiumNavy} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>GO PRO</Text>
                <Text style={styles.subtitle}>Unlock the full archive</Text>
            </View>

             {/* Arrow */}
             <ChevronRight size={20} color={HOME_COLORS.cardYellow} />

        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 6, // Spacing above game list
  },
  container: {
    borderRadius: 16,
    // Yellow glow border
    borderWidth: 1,
    borderColor: HOME_COLORS.cardYellow,
    overflow: 'hidden',
  },
  gradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingVertical: 20,
  },
  dismissButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
  },
  iconBox: {
      width: 48,
      height: 48,
      borderRadius: 12, // Squircle
      backgroundColor: HOME_COLORS.cardYellow,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      // Shadow
      shadowColor: '#CA8A04',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 4,
  },
  content: {
      flex: 1,
  },
  title: {
      fontFamily: HOME_FONTS.heading,
      fontSize: 20,
      color: HOME_COLORS.cardYellow,
      letterSpacing: 0.5,
  },
  subtitle: {
      fontFamily: HOME_FONTS.body,
      fontSize: 12,
      color: '#cbd5e1',
      marginTop: 2,
  },
});
