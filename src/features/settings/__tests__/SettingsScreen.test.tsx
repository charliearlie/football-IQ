/**
 * SettingsScreen Tests
 *
 * TDD tests for the main Settings screen that displays:
 * - Privacy Policy row (opens modal)
 * - Terms of Service row (opens modal)
 * - Rate App row (triggers review)
 * - App version info
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SettingsScreen } from "../screens/SettingsScreen";

// Mock theme
jest.mock("@/theme", () => ({
  colors: {
    pitchGreen: "#58CC02",
    stadiumNavy: "#0F172A",
    floodlightWhite: "#F8FAFC",
    glassBackground: "rgba(255, 255, 255, 0.05)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
    textSecondary: "rgba(248, 250, 252, 0.7)",
    cardYellow: "#FACC15",
  },
  textStyles: {
    h1: { fontSize: 32, fontFamily: "BebasNeue-Regular" },
    h2: { fontSize: 24, fontFamily: "BebasNeue-Regular" },
    body: { fontSize: 16, fontFamily: "Montserrat", fontWeight: "400" },
    bodySmall: { fontSize: 14, fontFamily: "Montserrat", fontWeight: "400" },
    caption: { fontSize: 12, fontFamily: "Montserrat", fontWeight: "400" },
    button: { fontSize: 16, fontFamily: "Montserrat", fontWeight: "600" },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 28,
    "3xl": 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
}));

// Mock safe area
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  SafeAreaView: ({ children, style, edges, testID }: any) => {
    const { View } = require("react-native");
    return (
      <View style={style} testID={testID}>
        {children}
      </View>
    );
  },
}));

// Mock GlassCard
jest.mock("@/components/GlassCard", () => {
  const { View } = require("react-native");
  return {
    GlassCard: ({ children, testID, style }: any) => (
      <View testID={testID} style={style}>
        {children}
      </View>
    ),
  };
});

// Mock ElevatedButton
jest.mock("@/components/ElevatedButton", () => {
  const { Pressable, Text } = require("react-native");
  return {
    ElevatedButton: ({
      children,
      onPress,
      testID,
      accessibilityLabel,
    }: any) => (
      <Pressable
        onPress={onPress}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
      >
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Mock icons
jest.mock("lucide-react-native", () => ({
  Shield: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "shield-icon"} />;
  },
  FileText: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "file-text-icon"} />;
  },
  Star: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "star-icon"} />;
  },
  ChevronRight: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "chevron-right-icon"} />;
  },
  X: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "x-icon"} />;
  },
  RotateCcw: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "rotate-ccw-icon"} />;
  },
  Bell: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "bell-icon"} />;
  },
  BellOff: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "bell-off-icon"} />;
  },
  UserX: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "user-x-icon"} />;
  },
  Lightbulb: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "lightbulb-icon"} />;
  },
  Volume2: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "volume-2-icon"} />;
  },
  VolumeX: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "volume-x-icon"} />;
  },
  Trash2: ({ testID }: { testID?: string }) => {
    const { View } = require("react-native");
    return <View testID={testID || "trash-2-icon"} />;
  },
}));

// Mock expo-store-review
jest.mock("expo-store-review", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
}));

// Mock app version
jest.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      version: "2.0.0",
    },
  },
}));

// Mock reanimated
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Animated = {
    View,
    createAnimatedComponent: (component: any) => component,
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    FadeIn: { duration: () => ({ duration: () => ({}) }) },
    SlideInDown: { springify: () => ({ damping: () => ({}) }) },
    FadeOut: { duration: () => ({}) },
    SlideOutDown: {},
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
  };
});

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock haptics
jest.mock("@/hooks/useHaptics", () => ({
  useHaptics: () => ({
    triggerLight: jest.fn(),
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
  }),
}));

// Mock React Native Linking
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn().mockResolvedValue(true),
  openSettings: jest.fn(),
}));

// Mock Auth
jest.mock("@/features/auth", () => ({
  useAuth: () => ({
    session: { user: { id: "test-user-id" } },
    signOut: jest.fn(),
  }),
  useSubscriptionSync: () => ({
    forceSync: jest.fn(),
    restorePurchases: jest.fn(),
  }),
}));

// Mock Profile
jest.mock("@/features/auth/hooks/useProfile", () => ({
  useProfile: () => ({
    profile: { display_name: "Test Manager" },
  }),
}));

// Mock Performance Stats
jest.mock("@/features/stats/hooks/usePerformanceStats", () => ({
  usePerformanceStats: () => ({
    stats: { totalPuzzlesSolved: 5 },
  }),
}));

// Mock IQ Rank
jest.mock("@/features/home/hooks/useIQRank", () => ({
  useIQRank: () => "Bench Warmer",
}));

// Mock Puzzles
jest.mock("@/features/puzzles", () => ({
  useOnboardingContext: () => ({
    resetAllIntros: jest.fn(),
  }),
  usePuzzleContext: () => ({
    refreshLocalPuzzles: jest.fn(),
  }),
}));

// Mock Notifications
jest.mock("@/features/notifications", () => ({
  scheduleNotification: jest.fn(),
  getMorningMessage: jest.fn().mockReturnValue({ title: "Morning", body: "Wake up" }),
  getStreakSaverMessage: jest.fn().mockReturnValue({ title: "Streak", body: "Save it" }),
  getPermissionStatus: jest.fn().mockResolvedValue("granted"),
  requestPermissions: jest.fn().mockResolvedValue("granted"),
}));

// Mock Database
jest.mock("@/lib/database", () => ({
  deleteAttemptsByGameMode: jest.fn().mockResolvedValue(10),
  clearAllLocalData: jest.fn(),
}));

// Mock Supabase
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      delete: () => ({
        eq: jest.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

// Mock RevenueCat since it's used directly
jest.mock("react-native-purchases", () => ({
  restorePurchases: jest.fn(),
}));

// Mock PremiumUpsellBanner
jest.mock("@/features/ads/components/PremiumUpsellBanner", () => ({
  PremiumUpsellBanner: () => {
    const { View } = require("react-native");
    return <View testID="premium-upsell" />;
  },
}));

describe("SettingsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders Settings title", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("SETTINGS")).toBeTruthy();
    });

    it("renders Profile section with Test Manager", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("Test Manager")).toBeTruthy();
      expect(getByText(/Bench Warmer/i)).toBeTruthy();
    });

    it("renders Subscription section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("SUBSCRIPTION")).toBeTruthy();
    });

    it("renders Notifications section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("NOTIFICATIONS")).toBeTruthy();
    });

    it("renders Legal section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("LEGAL")).toBeTruthy();
    });

    it("renders Support section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("SUPPORT")).toBeTruthy();
    });

    it("renders Community section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("COMMUNITY")).toBeTruthy();
    });

    it("renders Data section header", () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText("DATA")).toBeTruthy();
    });
  });

  describe("Privacy Policy", () => {
    it("opens URL when Privacy Policy row pressed", async () => {
      const { getByText } = render(<SettingsScreen />);
      const Linking = require("react-native").Linking;

      fireEvent.press(getByText("Privacy Policy"));

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalledWith(
          "https://football-iq.app/privacy"
        );
      });
    });
  });

  describe("Terms of Service", () => {
    it("opens URL when Terms of Service row pressed", async () => {
      const { getByText } = render(<SettingsScreen />);
      const Linking = require("react-native").Linking;

      fireEvent.press(getByText("Terms of Service"));

      await waitFor(() => {
        expect(Linking.openURL).toHaveBeenCalledWith(
          "https://football-iq.app/terms"
        );
      });
    });
  });

  describe("Rate App", () => {
    it("triggers native review when Rate App row pressed", async () => {
      const StoreReview = require("expo-store-review");
      const { getByText } = render(<SettingsScreen />);

      fireEvent.press(getByText("Rate App"));

      await waitFor(() => {
        expect(StoreReview.requestReview).toHaveBeenCalled();
      });
    });

    it("shows fallback if store review not available", async () => {
      const StoreReview = require("expo-store-review");
      StoreReview.isAvailableAsync.mockResolvedValueOnce(false);

      const { getByText, queryByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText("Rate App"));

      await waitFor(() => {
        // Should show rate modal as fallback
        expect(queryByTestId("rate-modal")).toBeTruthy();
      });
    });
  });

  describe("accessibility", () => {
    it("settings rows have button role", () => {
      const { getByTestId } = render(<SettingsScreen testID="settings" />);

      const privacyRow = getByTestId("settings-privacy-row");
      expect(privacyRow.props.accessibilityRole).toBe("button");
    });

    it("screen title has header role", () => {
      const { getByTestId } = render(<SettingsScreen testID="settings" />);

      const title = getByTestId("settings-title");
      expect(title.props.accessibilityRole).toBe("header");
    });
  });
});
