import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock expo-tracking-transparency
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock FirstRunModal to capture props
// We assign the captured props to a mutable object so we can inspect them
let mockFirstRunModalProps: any = {};
jest.mock('../components/FirstRunModal', () => ({
  FirstRunModal: (props: any) => {
    mockFirstRunModalProps = props;
    return null;
  },
}));

describe('OnboardingContext (State Machine)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirstRunModalProps = {};
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{children}</OnboardingProvider>
  );

  describe('Initialization State', () => {
    it('starts in loading state', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: false,
        isLoading: true,
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isOnboardingActive).toBe(false);
    });

    it('waits for Auth initialization then completes (name not required)', async () => {
      // Mock auth still loading
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: false,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useOnboarding(), { wrapper });
      expect(result.current.isLoading).toBe(true);

      // Now Auth initializes — profile exists but no name
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
        updateDisplayName: jest.fn(),
      });
      rerender({});

      // Should complete immediately (name no longer required)
      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('State Transitions & Latching', () => {
    it('completes immediately when profile exists without display name', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Name is no longer required — should complete without showing modal
      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('latches to COMPLETED if storage has true', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null }, // Even if profile incomplete
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isOnboardingActive).toBe(false);
      });
      expect(mockFirstRunModalProps.visible).toBe(false); // Should be false or undefined depending on render
    });
  });

  describe('Submission Flow (Legacy — modal no longer shown)', () => {
    it('skips modal entirely when profile exists without name', async () => {
      const mockUpdateDisplayName = jest.fn().mockResolvedValue({ error: null });
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
        updateDisplayName: mockUpdateDisplayName,
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Should complete immediately — modal never shows
      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });

      // Storage flags should be set
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app_onboarding_completed', 'true');
    });

    it('completes when profile has a display name', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: 'Existing User' },
        updateDisplayName: jest.fn(),
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
