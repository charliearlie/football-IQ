import '@testing-library/jest-native/extend-expect';

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
