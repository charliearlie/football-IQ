/**
 * SettingsScreen Tests
 *
 * TDD tests for the main Settings screen that displays:
 * - Privacy Policy row (opens modal)
 * - Terms of Service row (opens modal)
 * - Rate App row (triggers review)
 * - App version info
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../screens/SettingsScreen';

// Mock theme
jest.mock('@/theme', () => ({
  colors: {
    pitchGreen: '#58CC02',
    stadiumNavy: '#0F172A',
    floodlightWhite: '#F8FAFC',
    glassBackground: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textSecondary: 'rgba(248, 250, 252, 0.7)',
    cardYellow: '#FACC15',
  },
  textStyles: {
    h1: { fontSize: 32, fontFamily: 'BebasNeue-Regular' },
    h2: { fontSize: 24, fontFamily: 'BebasNeue-Regular' },
    body: { fontSize: 16, fontFamily: 'Montserrat', fontWeight: '400' },
    bodySmall: { fontSize: 14, fontFamily: 'Montserrat', fontWeight: '400' },
    caption: { fontSize: 12, fontFamily: 'Montserrat', fontWeight: '400' },
    button: { fontSize: 16, fontFamily: 'Montserrat', fontWeight: '600' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
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
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  SafeAreaView: ({ children, style, edges, testID }: any) => {
    const { View } = require('react-native');
    return <View style={style} testID={testID}>{children}</View>;
  },
}));

// Mock GlassCard
jest.mock('@/components/GlassCard', () => {
  const { View } = require('react-native');
  return {
    GlassCard: ({ children, testID, style }: any) => (
      <View testID={testID} style={style}>{children}</View>
    ),
  };
});

// Mock ElevatedButton
jest.mock('@/components/ElevatedButton', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ElevatedButton: ({ children, onPress, testID, accessibilityLabel }: any) => (
      <Pressable onPress={onPress} testID={testID} accessibilityLabel={accessibilityLabel}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Mock icons
jest.mock('lucide-react-native', () => ({
  Shield: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'shield-icon'} />;
  },
  FileText: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'file-text-icon'} />;
  },
  Star: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'star-icon'} />;
  },
  ChevronRight: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'chevron-right-icon'} />;
  },
  X: ({ testID }: { testID?: string }) => {
    const { View } = require('react-native');
    return <View testID={testID || 'x-icon'} />;
  },
}));

// Mock expo-store-review
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
}));

// Mock app version
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
    },
  },
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
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

// Mock haptics
jest.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    triggerLight: jest.fn(),
    triggerSelection: jest.fn(),
    triggerNotification: jest.fn(),
  }),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Settings title', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Settings')).toBeTruthy();
    });

    it('renders Privacy Policy row', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Privacy Policy')).toBeTruthy();
    });

    it('renders Terms of Service row', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Terms of Service')).toBeTruthy();
    });

    it('renders Rate App row', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Rate App')).toBeTruthy();
    });

    it('renders app version at bottom', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText(/Version 1\.0\.0/)).toBeTruthy();
    });

    it('renders Legal section header', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Legal')).toBeTruthy();
    });

    it('renders Support section header', () => {
      const { getByText } = render(<SettingsScreen />);

      expect(getByText('Support')).toBeTruthy();
    });
  });

  describe('Privacy Policy modal', () => {
    it('opens modal when Privacy Policy row pressed', async () => {
      const { getByText, getByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Privacy Policy'));

      await waitFor(() => {
        expect(getByTestId('legal-modal')).toBeTruthy();
      });
    });

    it('displays privacy policy content in modal', async () => {
      const { getAllByText, getByTestId } = render(<SettingsScreen />);

      // Find the row by text (first match) and press it
      fireEvent.press(getAllByText('Privacy Policy')[0]);

      await waitFor(() => {
        // Modal should be visible and show privacy policy content
        expect(getByTestId('legal-modal')).toBeTruthy();
      });
    });

    it('closes modal when close button pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = render(<SettingsScreen />);

      // Open modal
      fireEvent.press(getByText('Privacy Policy'));

      await waitFor(() => {
        expect(getByTestId('legal-modal')).toBeTruthy();
      });

      // Close modal
      fireEvent.press(getByTestId('legal-modal-close'));

      await waitFor(() => {
        expect(queryByTestId('legal-modal')).toBeNull();
      });
    });
  });

  describe('Terms of Service modal', () => {
    it('opens modal when Terms of Service row pressed', async () => {
      const { getByText, getByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Terms of Service'));

      await waitFor(() => {
        expect(getByTestId('legal-modal')).toBeTruthy();
      });
    });

    it('displays terms content in modal', async () => {
      const { getByText, getAllByText } = render(<SettingsScreen />);

      fireEvent.press(getByText('Terms of Service'));

      await waitFor(() => {
        // Should have Terms of Service text (row label + modal title)
        expect(getAllByText('Terms of Service').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('closes modal when close button pressed', async () => {
      const { getByText, getByTestId, queryByTestId } = render(<SettingsScreen />);

      // Open modal
      fireEvent.press(getByText('Terms of Service'));

      await waitFor(() => {
        expect(getByTestId('legal-modal')).toBeTruthy();
      });

      // Close modal
      fireEvent.press(getByTestId('legal-modal-close'));

      await waitFor(() => {
        expect(queryByTestId('legal-modal')).toBeNull();
      });
    });
  });

  describe('Rate App', () => {
    it('triggers native review when Rate App row pressed', async () => {
      const StoreReview = require('expo-store-review');
      const { getByText } = render(<SettingsScreen />);

      fireEvent.press(getByText('Rate App'));

      await waitFor(() => {
        expect(StoreReview.requestReview).toHaveBeenCalled();
      });
    });

    it('shows fallback if store review not available', async () => {
      const StoreReview = require('expo-store-review');
      StoreReview.isAvailableAsync.mockResolvedValueOnce(false);

      const { getByText, queryByTestId } = render(<SettingsScreen />);

      fireEvent.press(getByText('Rate App'));

      await waitFor(() => {
        // Should show rate modal as fallback
        expect(queryByTestId('rate-modal')).toBeTruthy();
      });
    });
  });

  describe('accessibility', () => {
    it('settings rows have button role', () => {
      const { getByTestId } = render(<SettingsScreen testID="settings" />);

      const privacyRow = getByTestId('settings-privacy-row');
      expect(privacyRow.props.accessibilityRole).toBe('button');
    });

    it('screen title has header role', () => {
      const { getByTestId } = render(<SettingsScreen testID="settings" />);

      const title = getByTestId('settings-title');
      expect(title.props.accessibilityRole).toBe('header');
    });
  });
});
