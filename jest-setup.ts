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
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    cancelAnimation: jest.fn(),
    useAnimatedRef: jest.fn(() => ({ current: null })),
    measure: jest.fn(),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
  };
});

// Mock expo-router (global — individual tests can override with local jest.mock)
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => false),
    dismiss: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  useRootNavigationState: jest.fn(() => ({ key: 'test' })),
  Link: jest.fn(({ children }: any) => children),
  Redirect: jest.fn(() => null),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismiss: jest.fn() },
  Href: {},
}));

// Mock @/theme (comprehensive — prevents depthOffset.buttonTiny crash in ElevatedButton)
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    grassShadow: '#46A302',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    cardYellow: '#FACC15',
    redCard: '#EF4444',
    warningOrange: '#FF4D00',
    warningOrangeShadow: '#CC3D00',
    amber: '#F59E0B',
    amberShadow: '#D97706',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    primary: '#58CC02',
    primaryShadow: '#46A302',
    background: '#0F172A',
    text: '#F8FAFC',
    textSecondary: 'rgba(248, 250, 252, 0.7)',
    warning: '#FACC15',
    error: '#EF4444',
    success: '#58CC02',
  },
  depthColors: {
    pitchGreen: '#46A302',
    stadiumNavy: '#0A1628',
    redCard: '#B91C1C',
    cardYellow: '#D4A500',
    warningOrange: '#CC3D00',
    amber: '#D97706',
    glass: 'rgba(255, 255, 255, 0.02)',
  },
  getDepthColor: jest.fn((hex: string) => hex),
  fonts: { headline: 'System', body: 'System', subheading: 'System' },
  fontWeights: { regular: '400' as const, medium: '500' as const, semiBold: '600' as const, bold: '700' as const },
  textStyles: {
    h1: { fontFamily: 'System', fontSize: 32 },
    h2: { fontFamily: 'System', fontSize: 24 },
    h3: { fontFamily: 'System', fontSize: 20 },
    subtitle: { fontFamily: 'System', fontSize: 18 },
    body: { fontFamily: 'System', fontSize: 16 },
    bodySmall: { fontFamily: 'System', fontSize: 14 },
    caption: { fontFamily: 'System', fontSize: 12 },
    button: { fontFamily: 'System', fontSize: 18 },
    buttonLarge: { fontFamily: 'System', fontSize: 18 },
    buttonSmall: { fontFamily: 'System', fontSize: 14 },
    buttonTiny: { fontFamily: 'System', fontSize: 11, lineHeight: 14 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999 },
  shadowOffset: { buttonSmall: 5, button: 8, buttonLarge: 10 },
  depthOffset: {
    none: 0, sunk: 1, card: 2, cell: 3, tictacCell: 4,
    buttonTiny: 3, buttonSmall: 5, button: 8, buttonLarge: 10,
  },
  layout: { screenPadding: 16, cardPadding: 16, listGap: 12, tabBarHeight: 80 },
  shadows: { none: {}, sm: {}, md: {}, lg: {}, xl: {}, '2xl': {} },
  glows: { green: {}, yellow: {}, red: {}, amber: {} },
  combineWithGlow: jest.fn(() => ({})),
}));

// Mock @/theme sub-paths (some tests import from these directly)
jest.mock('@/theme/spacing', () => ({
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, full: 9999 },
  shadowOffset: { buttonSmall: 5, button: 8, buttonLarge: 10 },
  depthOffset: {
    none: 0, sunk: 1, card: 2, cell: 3, tictacCell: 4,
    buttonTiny: 3, buttonSmall: 5, button: 8, buttonLarge: 10,
  },
  layout: { screenPadding: 16, cardPadding: 16, listGap: 12, tabBarHeight: 80 },
}));

jest.mock('@/theme/colors', () => ({
  colors: {
    pitchGreen: '#58CC02', grassShadow: '#46A302', stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC', cardYellow: '#FACC15', redCard: '#EF4444',
    warningOrange: '#FF4D00', warningOrangeShadow: '#CC3D00',
    amber: '#F59E0B', amberShadow: '#D97706',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    primary: '#58CC02', primaryShadow: '#46A302', background: '#0F172A',
    text: '#F8FAFC', textSecondary: 'rgba(248, 250, 252, 0.7)',
    warning: '#FACC15', error: '#EF4444', success: '#58CC02',
  },
  depthColors: {
    pitchGreen: '#46A302', stadiumNavy: '#0A1628', redCard: '#B91C1C',
    cardYellow: '#D4A500', warningOrange: '#CC3D00', amber: '#D97706',
    glass: 'rgba(255, 255, 255, 0.02)',
  },
  getDepthColor: jest.fn((hex: string) => hex),
}));

jest.mock('@/theme/typography', () => ({
  fonts: { headline: 'System', body: 'System', subheading: 'System' },
  fontWeights: { regular: '400' as const, medium: '500' as const, semiBold: '600' as const, bold: '700' as const },
  textStyles: {
    h1: { fontFamily: 'System', fontSize: 32 },
    h2: { fontFamily: 'System', fontSize: 24 },
    h3: { fontFamily: 'System', fontSize: 20 },
    subtitle: { fontFamily: 'System', fontSize: 18 },
    body: { fontFamily: 'System', fontSize: 16 },
    bodySmall: { fontFamily: 'System', fontSize: 14 },
    caption: { fontFamily: 'System', fontSize: 12 },
    button: { fontFamily: 'System', fontSize: 18 },
    buttonLarge: { fontFamily: 'System', fontSize: 18 },
    buttonSmall: { fontFamily: 'System', fontSize: 14 },
    buttonTiny: { fontFamily: 'System', fontSize: 11, lineHeight: 14 },
  },
}));

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
  removeCustomerInfoUpdateListener: jest.fn(),
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
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
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
