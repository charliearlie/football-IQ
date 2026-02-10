import '@testing-library/jest-native/extend-expect';

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  wrap: jest.fn((component) => component),
}));

// Mock Supabase client
const mockSupabaseAuth = {
  getSession: jest.fn(),
  signInAnonymously: jest.fn(),
  signInWithOtp: jest.fn(),
  verifyOtp: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
};

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn(),
    })),
  })),
  update: jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
}));

const mockSupabaseChannel = jest.fn(() => ({
  on: jest.fn(() => ({
    subscribe: jest.fn(),
  })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    channel: mockSupabaseChannel,
    removeChannel: jest.fn(),
  },
}));

// Export mocks for test access
export { mockSupabaseAuth, mockSupabaseFrom, mockSupabaseChannel };

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-blur
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return {
    BlurView: View,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View, Text, Image, ScrollView, Pressable } = require('react-native');

  const Animated = {
    View,
    Text,
    Image,
    ScrollView,
    createAnimatedComponent: (component: any) => component,
  };

  // Create chainable layout animation mock
  const createLayoutAnimationMock = () => {
    const chainable: any = {
      springify: () => chainable,
      damping: () => chainable,
      stiffness: () => chainable,
      duration: () => chainable,
      delay: () => chainable,
      withInitialValues: () => chainable,
      withCallback: () => chainable,
    };
    return chainable;
  };

  return {
    __esModule: true,
    default: Animated,
    View,
    Text,
    Image,
    ScrollView,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[0]),
    withRepeat: jest.fn((val) => val),
    createAnimatedComponent: (component: any) => component,
    // Layout animations
    SlideInDown: createLayoutAnimationMock(),
    SlideInUp: createLayoutAnimationMock(),
    SlideOutDown: createLayoutAnimationMock(),
    SlideOutUp: createLayoutAnimationMock(),
    FadeIn: createLayoutAnimationMock(),
    FadeOut: createLayoutAnimationMock(),
    ZoomIn: createLayoutAnimationMock(),
    ZoomOut: createLayoutAnimationMock(),
    Easing: {
      linear: jest.fn(() => jest.fn()),
      ease: jest.fn(() => jest.fn()),
      bezier: jest.fn(() => jest.fn()),
      out: jest.fn(() => jest.fn()),
      in: jest.fn(() => jest.fn()),
      inOut: jest.fn(() => jest.fn()),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
    },
    interpolate: jest.fn((val) => val),
  };
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Mock react-native-purchases (RevenueCat)
const mockPurchases = {
  configure: jest.fn(),
  logIn: jest.fn(),
  logOut: jest.fn(),
  getOfferings: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
  addCustomerInfoUpdateListener: jest.fn(() => jest.fn()),
  getCustomerInfo: jest.fn(),
  syncPurchases: jest.fn(),
};

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: mockPurchases,
  PURCHASES_ERROR_CODE: {
    PURCHASE_CANCELLED_ERROR: 'PURCHASE_CANCELLED',
    NETWORK_ERROR: 'NETWORK_ERROR',
    PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR: 'PRODUCT_NOT_AVAILABLE',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  },
}));

export { mockPurchases };

// Mock react-native-google-mobile-ads
const mockMobileAds = jest.fn(() => ({
  initialize: jest.fn().mockResolvedValue(undefined),
  setRequestConfiguration: jest.fn().mockResolvedValue(undefined),
}));

const mockBannerAd = {
  __esModule: true,
  BannerAd: jest.fn(() => null),
  BannerAdSize: {
    BANNER: 'BANNER',
    FULL_BANNER: 'FULL_BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  },
  TestIds: {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  },
};

const mockRewardedAd = {
  createForAdRequest: jest.fn(() => ({
    load: jest.fn(),
    show: jest.fn(),
    addAdEventListener: jest.fn(() => jest.fn()),
  })),
};

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: mockMobileAds,
  MobileAds: mockMobileAds,
  BannerAd: mockBannerAd.BannerAd,
  BannerAdSize: mockBannerAd.BannerAdSize,
  TestIds: mockBannerAd.TestIds,
  RewardedAd: mockRewardedAd,
  AdEventType: {
    LOADED: 'loaded',
    ERROR: 'error',
    OPENED: 'opened',
    CLOSED: 'closed',
  },
  RewardedAdEventType: {
    LOADED: 'rewarded_loaded',
    EARNED_REWARD: 'rewarded_earned_reward',
  },
}));

export { mockMobileAds, mockBannerAd, mockRewardedAd };

// Mock moti and moti/skeleton
jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    MotiView: View,
    MotiText: View,
    MotiImage: View,
    AnimatePresence: ({ children }: any) => children,
  };
});

jest.mock('moti/skeleton', () => {
  const { View } = require('react-native');
  return {
    Skeleton: ({ children, ...props }: any) => {
      const React = require('react');
      return React.createElement(View, {
        testID: 'skeleton-placeholder',
        style: { width: props.width, height: props.height },
      });
    },
  };
});

// Mock expo-secure-store
const mockSecureStore = {
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
};

jest.mock('expo-secure-store', () => mockSecureStore);

export { mockSecureStore };

// Mock expo-notifications
const mockNotifications = {
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'undetermined' })
  ),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  AndroidNotificationPriority: { DEFAULT: 0, HIGH: 1 },
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
};

jest.mock('expo-notifications', () => mockNotifications);

export { mockNotifications };

// Mock posthog-react-native
jest.mock('posthog-react-native', () => ({
  usePostHog: jest.fn(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    screen: jest.fn(),
  })),
  PostHogProvider: ({ children }: any) => children,
}));

// Suppress specific console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Animated:') || message.includes('useNativeDriver'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
